package ledger

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
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
SELECT id, entry_type, direction, amount::text, currency, transaction_date, description
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
			&transaction.EntryType,
			&transaction.Direction,
			&transaction.Amount,
			&transaction.Currency,
			&transaction.TransactionDate,
			&transaction.Description,
		); err != nil {
			return nil, err
		}
		transactions = append(transactions, transaction)
	}

	return transactions, rows.Err()
}
