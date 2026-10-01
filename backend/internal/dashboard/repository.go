package dashboard

import (
	"context"
	"github.com/jackc/pgx/v5/pgxpool"
	"time"
)

type PostgresRepository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *PostgresRepository { return &PostgresRepository{pool: pool} }
func (repository *PostgresRepository) Get(ctx context.Context, today time.Time) (Summary, error) {
	const query = `SELECT
COUNT(*) FILTER (WHERE status NOT IN ('teslim_edildi','iptal_edildi')),
COUNT(*) FILTER (WHERE delivery_date = $1 AND status NOT IN ('teslim_edildi','iptal_edildi')),
COUNT(*) FILTER (WHERE delivery_date < $1 AND status NOT IN ('teslim_edildi','iptal_edildi')),
COUNT(*) FILTER (WHERE status = 'hazir'),
(SELECT COALESCE(SUM(CASE WHEN direction='debit' THEN amount ELSE -amount END),0)::text FROM customer_transactions)
FROM jobs`
	var summary Summary
	err := repository.pool.QueryRow(ctx, query, today).Scan(&summary.ActiveJobs, &summary.DueToday, &summary.Overdue, &summary.Ready, &summary.Receivable)
	return summary, err
}
