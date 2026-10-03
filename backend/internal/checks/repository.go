package checks

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

type Repository interface {
	List(ctx context.Context, filters Filters) ([]Check, error)
	FindByID(ctx context.Context, id uuid.UUID) (Check, error)
	Create(ctx context.Context, input CreateCheckInput) (Check, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, input UpdateCheckStatusInput) (Check, error)
}

type PostgresRepository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) List(ctx context.Context, filters Filters) ([]Check, error) {
	const query = `
SELECT ch.id, ch.customer_id, COALESCE(c.company_name, ''), ch.check_number, ch.bank_name, ch.drawer, ch.amount::text, ch.currency, ch.issue_date, ch.due_date, ch.check_type, ch.status, ch.notes, ch.created_at, ch.updated_at
FROM checks ch
LEFT JOIN customers c ON c.id = ch.customer_id
WHERE ($1 = '' OR ch.check_type = $1)
  AND ($2 = '' OR ch.status = $2)
  AND ($3 = '' OR ch.check_number ILIKE '%' || $3 || '%' OR ch.drawer ILIKE '%' || $3 || '%' OR ch.bank_name ILIKE '%' || $3 || '%' OR c.company_name ILIKE '%' || $3 || '%')
ORDER BY ch.due_date ASC, ch.created_at DESC`

	rows, err := r.pool.Query(ctx, query, filters.CheckType, filters.Status, filters.Search)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Check, 0)
	for rows.Next() {
		var ch Check
		if err := rows.Scan(&ch.ID, &ch.CustomerID, &ch.CustomerName, &ch.CheckNumber, &ch.BankName, &ch.Drawer, &ch.Amount, &ch.Currency, &ch.IssueDate, &ch.DueDate, &ch.CheckType, &ch.Status, &ch.Notes, &ch.CreatedAt, &ch.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, ch)
	}
	return items, rows.Err()
}

func (r *PostgresRepository) FindByID(ctx context.Context, id uuid.UUID) (Check, error) {
	const query = `
SELECT ch.id, ch.customer_id, COALESCE(c.company_name, ''), ch.check_number, ch.bank_name, ch.drawer, ch.amount::text, ch.currency, ch.issue_date, ch.due_date, ch.check_type, ch.status, ch.notes, ch.created_at, ch.updated_at
FROM checks ch
LEFT JOIN customers c ON c.id = ch.customer_id
WHERE ch.id = $1`

	var ch Check
	err := r.pool.QueryRow(ctx, query, id).Scan(&ch.ID, &ch.CustomerID, &ch.CustomerName, &ch.CheckNumber, &ch.BankName, &ch.Drawer, &ch.Amount, &ch.Currency, &ch.IssueDate, &ch.DueDate, &ch.CheckType, &ch.Status, &ch.Notes, &ch.CreatedAt, &ch.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Check{}, errors.New("Çek bulunamadı.")
	}
	return ch, err
}

func (r *PostgresRepository) Create(ctx context.Context, input CreateCheckInput) (Check, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return Check{}, err
	}
	defer tx.Rollback(ctx)

	amt, err := decimal.NewFromString(input.Amount)
	if err != nil || !amt.GreaterThan(decimal.Zero) {
		return Check{}, errors.New("Çek tutarı sıfırdan büyük olmalıdır.")
	}

	iDate, err := time.Parse("2006-01-02", input.IssueDate)
	if err != nil {
		iDate = time.Now()
	}

	dDate, err := time.Parse("2006-01-02", input.DueDate)
	if err != nil {
		return Check{}, errors.New("Geçerli bir vade tarihi girin.")
	}

	if input.Currency == "" {
		input.Currency = "TRY"
	}
	if input.Status == "" {
		input.Status = "portfoyde"
	}

	const insertQuery = `
INSERT INTO checks (customer_id, check_number, bank_name, drawer, amount, currency, issue_date, due_date, check_type, status, notes)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING id, customer_id, check_number, bank_name, drawer, amount::text, currency, issue_date, due_date, check_type, status, notes, created_at, updated_at`

	var ch Check
	err = tx.QueryRow(ctx, insertQuery, input.CustomerID, input.CheckNumber, input.BankName, input.Drawer, amt.StringFixed(2), input.Currency, iDate, dDate, input.CheckType, input.Status, input.Notes).Scan(
		&ch.ID, &ch.CustomerID, &ch.CheckNumber, &ch.BankName, &ch.Drawer, &ch.Amount, &ch.Currency, &ch.IssueDate, &ch.DueDate, &ch.CheckType, &ch.Status, &ch.Notes, &ch.CreatedAt, &ch.UpdatedAt,
	)
	if err != nil {
		return Check{}, err
	}

	// If check has customer_id, update customer transactions ledger!
	if input.CustomerID != nil {
		entryType := "received_check"
		dir := "credit" // Müşteriden çek alındı -> borcu alacaklanır
		if input.CheckType == "borc" {
			entryType = "issued_check"
			dir = "debit"
		}
		const insertCustTx = `
INSERT INTO customer_transactions (customer_id, entry_type, direction, amount, currency, transaction_date, description)
VALUES ($1, $2, $3, $4, $5, $6, $7)`
		desc := ch.CheckNumber + " no'lu " + ch.BankName + " çek"
		_, err = tx.Exec(ctx, insertCustTx, *input.CustomerID, entryType, dir, amt.StringFixed(2), input.Currency, iDate, desc)
		if err != nil {
			return Check{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Check{}, err
	}

	return r.FindByID(ctx, ch.ID)
}

func (r *PostgresRepository) UpdateStatus(ctx context.Context, id uuid.UUID, input UpdateCheckStatusInput) (Check, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return Check{}, err
	}
	defer tx.Rollback(ctx)

	var orig Check
	const getOrig = `SELECT id, customer_id, check_number, bank_name, amount::text, currency, check_type, status FROM checks WHERE id=$1 FOR UPDATE`
	err = tx.QueryRow(ctx, getOrig, id).Scan(&orig.ID, &orig.CustomerID, &orig.CheckNumber, &orig.BankName, &orig.Amount, &orig.Currency, &orig.CheckType, &orig.Status)
	if err != nil {
		return Check{}, err
	}

	const updateCheck = `UPDATE checks SET status=$2, notes=CASE WHEN $3='' THEN notes ELSE $3 END, updated_at=NOW() WHERE id=$1`
	_, err = tx.Exec(ctx, updateCheck, id, input.Status, input.Notes)
	if err != nil {
		return Check{}, err
	}

	// If transitioning to 'tahsil_edildi' or 'odendi', deposit/withdraw money into cash/bank account if provided
	if input.AccountID != nil && (input.Status == "tahsil_edildi" || input.Status == "odendi") {
		amt, _ := decimal.NewFromString(orig.Amount)
		entryType := "tahsilat"
		if orig.CheckType == "borc" {
			entryType = "odeme"
		}

		multiplier := decimal.NewFromInt(1)
		if entryType == "odeme" {
			multiplier = decimal.NewFromInt(-1)
		}
		change := amt.Mul(multiplier)

		const updateAcc = `UPDATE cash_bank_accounts SET balance = balance + $2, updated_at = NOW() WHERE id = $1`
		if _, err := tx.Exec(ctx, updateAcc, *input.AccountID, change.StringFixed(2)); err != nil {
			return Check{}, err
		}

		const insertFin = `
INSERT INTO finance_transactions (account_id, customer_id, entry_type, category, amount, currency, transaction_date, description)
VALUES ($1, $2, $3, 'cek_tahsilati', $4, $5, NOW(), $6)`
		desc := orig.CheckNumber + " no'lu çek tahsilat/ödemesi"
		if _, err := tx.Exec(ctx, insertFin, *input.AccountID, orig.CustomerID, entryType, amt.StringFixed(2), orig.Currency, desc); err != nil {
			return Check{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Check{}, err
	}

	return r.FindByID(ctx, id)
}
