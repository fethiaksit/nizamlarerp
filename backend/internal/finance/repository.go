package finance

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

type Repository interface {
	ListAccounts(ctx context.Context) ([]CashBankAccount, error)
	CreateAccount(ctx context.Context, account CashBankAccount) (CashBankAccount, error)
	ListTransactions(ctx context.Context, filters Filters) ([]FinanceTransaction, error)
	CreateTransaction(ctx context.Context, input CreateFinanceInput) (FinanceTransaction, error)
}

type PostgresRepository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (repository *PostgresRepository) ListAccounts(ctx context.Context) ([]CashBankAccount, error) {
	const query = `SELECT id, name, account_type, bank_name, iban, currency, balance::text, is_active, created_at, updated_at FROM cash_bank_accounts WHERE is_active=TRUE ORDER BY account_type, name`
	rows, err := repository.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]CashBankAccount, 0)
	for rows.Next() {
		var a CashBankAccount
		if err := rows.Scan(&a.ID, &a.Name, &a.AccountType, &a.BankName, &a.IBAN, &a.Currency, &a.Balance, &a.IsActive, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, a)
	}
	return items, rows.Err()
}

func (repository *PostgresRepository) CreateAccount(ctx context.Context, input CashBankAccount) (CashBankAccount, error) {
	const query = `INSERT INTO cash_bank_accounts (name, account_type, bank_name, iban, currency, balance) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, account_type, bank_name, iban, currency, balance::text, is_active, created_at, updated_at`
	var a CashBankAccount
	err := repository.pool.QueryRow(ctx, query, input.Name, input.AccountType, input.BankName, input.IBAN, input.Currency, input.Balance).Scan(&a.ID, &a.Name, &a.AccountType, &a.BankName, &a.IBAN, &a.Currency, &a.Balance, &a.IsActive, &a.CreatedAt, &a.UpdatedAt)
	return a, err
}

func (repository *PostgresRepository) ListTransactions(ctx context.Context, filters Filters) ([]FinanceTransaction, error) {
	const query = `
SELECT t.id, t.account_id, COALESCE(a.name, ''), t.customer_id, COALESCE(c.company_name, ''), t.entry_type, t.category, t.amount::text, t.currency, t.transaction_date, t.description, t.created_at
FROM finance_transactions t
LEFT JOIN cash_bank_accounts a ON a.id = t.account_id
LEFT JOIN customers c ON c.id = t.customer_id
WHERE ($1 = '' OR t.entry_type = $1)
  AND ($2 = '' OR t.category = $2)
  AND ($3 = '' OR t.description ILIKE '%' || $3 || '%' OR c.company_name ILIKE '%' || $3 || '%')
ORDER BY t.transaction_date DESC, t.created_at DESC`

	rows, err := repository.pool.Query(ctx, query, filters.EntryType, filters.Category, filters.Search)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]FinanceTransaction, 0)
	for rows.Next() {
		var ft FinanceTransaction
		if err := rows.Scan(&ft.ID, &ft.AccountID, &ft.AccountName, &ft.CustomerID, &ft.CustomerName, &ft.EntryType, &ft.Category, &ft.Amount, &ft.Currency, &ft.TransactionDate, &ft.Description, &ft.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, ft)
	}
	return items, rows.Err()
}

func (repository *PostgresRepository) CreateTransaction(ctx context.Context, input CreateFinanceInput) (FinanceTransaction, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return FinanceTransaction{}, err
	}
	defer tx.Rollback(ctx)

	amt, err := decimal.NewFromString(input.Amount)
	if err != nil || !amt.GreaterThan(decimal.Zero) {
		return FinanceTransaction{}, errors.New("Tutar sıfırdan büyük olmalıdır.")
	}

	tDate, err := time.Parse("2006-01-02", input.TransactionDate)
	if err != nil {
		tDate = time.Now()
	}

	if input.Currency == "" {
		input.Currency = "TRY"
	}

	const insertQuery = `
INSERT INTO finance_transactions (account_id, customer_id, entry_type, category, amount, currency, transaction_date, description)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, account_id, customer_id, entry_type, category, amount::text, currency, transaction_date, description, created_at`

	var ft FinanceTransaction
	err = tx.QueryRow(ctx, insertQuery, input.AccountID, input.CustomerID, input.EntryType, input.Category, amt.StringFixed(2), input.Currency, tDate, input.Description).Scan(
		&ft.ID, &ft.AccountID, &ft.CustomerID, &ft.EntryType, &ft.Category, &ft.Amount, &ft.Currency, &ft.TransactionDate, &ft.Description, &ft.CreatedAt,
	)
	if err != nil {
		return FinanceTransaction{}, err
	}

	// Update account balance if account_id is set
	if input.AccountID != nil {
		multiplier := decimal.NewFromInt(1)
		if input.EntryType == "gider" || input.EntryType == "odeme" {
			multiplier = decimal.NewFromInt(-1)
		}
		change := amt.Mul(multiplier)

		const updateAcc = `UPDATE cash_bank_accounts SET balance = balance + $2, updated_at = NOW() WHERE id = $1`
		if _, err := tx.Exec(ctx, updateAcc, *input.AccountID, change.StringFixed(2)); err != nil {
			return FinanceTransaction{}, err
		}
	}

	// If customer_id is set and entry_type is tahsilat/odeme, update customer_transactions ledger!
	if input.CustomerID != nil && (input.EntryType == "tahsilat" || input.EntryType == "odeme") {
		dir := "credit" // Tahsilat -> customer alacaklanır (borcu düşer)
		if input.EntryType == "odeme" {
			dir = "debit" // Müşteriye ödeme yapıldı -> borçlandı
		}
		const insertCustTx = `
INSERT INTO customer_transactions (customer_id, entry_type, direction, amount, currency, transaction_date, description)
VALUES ($1, $2, $3, $4, $5, $6, $7)`
		_, err = tx.Exec(ctx, insertCustTx, *input.CustomerID, input.EntryType, dir, amt.StringFixed(2), input.Currency, tDate, input.Description)
		if err != nil {
			return FinanceTransaction{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return FinanceTransaction{}, err
	}

	// Load names
	if ft.AccountID != nil {
		_ = repository.pool.QueryRow(ctx, `SELECT name FROM cash_bank_accounts WHERE id=$1`, *ft.AccountID).Scan(&ft.AccountName)
	}
	if ft.CustomerID != nil {
		_ = repository.pool.QueryRow(ctx, `SELECT company_name FROM customers WHERE id=$1`, *ft.CustomerID).Scan(&ft.CustomerName)
	}

	return ft, nil
}
