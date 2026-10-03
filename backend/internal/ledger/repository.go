package ledger

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (repository *Repository) OpenBalance(ctx context.Context, customerID uuid.UUID) (string, error) {
	const query = `
SELECT COALESCE(SUM(CASE WHEN direction = 'debit' THEN amount ELSE -amount END), 0)::text
FROM customer_transactions
WHERE customer_id = $1`

	var balance string
	err := repository.pool.QueryRow(ctx, query, customerID).Scan(&balance)
	return balance, err
}

func (repository *Repository) ListByCustomer(ctx context.Context, customerID uuid.UUID) ([]Transaction, error) {
	const query = `
SELECT id, customer_id, job_id, entry_type, direction, amount::text, currency, transaction_date, description, created_at
FROM customer_transactions
WHERE customer_id = $1
ORDER BY transaction_date DESC, created_at DESC`

	rows, err := repository.pool.Query(ctx, query, customerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transactions := make([]Transaction, 0)
	for rows.Next() {
		var transaction Transaction
		if err := rows.Scan(
			&transaction.ID,
			&transaction.CustomerID,
			&transaction.JobID,
			&transaction.EntryType,
			&transaction.Direction,
			&transaction.Amount,
			&transaction.Currency,
			&transaction.TransactionDate,
			&transaction.Description,
			&transaction.CreatedAt,
		); err != nil {
			return nil, err
		}
		transactions = append(transactions, transaction)
	}

	return transactions, rows.Err()
}

func (repository *Repository) CreateTransaction(ctx context.Context, input CreateTransactionInput) (Transaction, error) {
	amountDecimal, err := decimal.NewFromString(input.Amount)
	if err != nil || !amountDecimal.GreaterThan(decimal.Zero) {
		return Transaction{}, errors.New("Tutar 0'dan büyük olmalıdır.")
	}

	tDate, err := time.Parse("2006-01-02", input.TransactionDate)
	if err != nil {
		tDate = time.Now()
	}

	if input.Currency == "" {
		input.Currency = "TRY"
	}

	const query = `
INSERT INTO customer_transactions (customer_id, job_id, entry_type, direction, amount, currency, transaction_date, description)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, customer_id, job_id, entry_type, direction, amount::text, currency, transaction_date, description, created_at`

	var transaction Transaction
	err = repository.pool.QueryRow(ctx, query,
		input.CustomerID, input.JobID, input.EntryType, input.Direction,
		amountDecimal.StringFixed(2), input.Currency, tDate, input.Description,
	).Scan(
		&transaction.ID,
		&transaction.CustomerID,
		&transaction.JobID,
		&transaction.EntryType,
		&transaction.Direction,
		&transaction.Amount,
		&transaction.Currency,
		&transaction.TransactionDate,
		&transaction.Description,
		&transaction.CreatedAt,
	)

	return transaction, err
}

func (repository *Repository) ReverseTransaction(ctx context.Context, id uuid.UUID) error {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var orig Transaction
	const getOrig = `SELECT id, customer_id, job_id, entry_type, direction, amount::text, currency, transaction_date, description, created_at FROM customer_transactions WHERE id = $1`
	err = tx.QueryRow(ctx, getOrig, id).Scan(
		&orig.ID, &orig.CustomerID, &orig.JobID, &orig.EntryType, &orig.Direction, &orig.Amount, &orig.Currency, &orig.TransactionDate, &orig.Description, &orig.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return errors.New("İşlem kaydı bulunamadı.")
	}
	if err != nil {
		return err
	}

	// Reverse direction
	oppositeDirection := "credit"
	if orig.Direction == "credit" {
		oppositeDirection = "debit"
	}

	const insertReverse = `
INSERT INTO customer_transactions (customer_id, job_id, entry_type, direction, amount, currency, transaction_date, description, reversal_of)
VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)`

	_, err = tx.Exec(ctx, insertReverse,
		orig.CustomerID, orig.JobID, orig.EntryType, oppositeDirection,
		orig.Amount, orig.Currency, "İptal kaydı / Düzeltme ("+orig.Description+")", orig.ID,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
