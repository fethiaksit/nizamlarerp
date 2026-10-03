package dashboard

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresRepository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *PostgresRepository { return &PostgresRepository{pool: pool} }

func (repository *PostgresRepository) Get(ctx context.Context, today time.Time) (Summary, error) {
	const query = `
SELECT
	COALESCE((SELECT COUNT(*) FROM jobs WHERE status NOT IN ('teslim_edildi','iptal_edildi')), 0),
	COALESCE((SELECT COUNT(*) FROM jobs WHERE delivery_date = $1 AND status NOT IN ('teslim_edildi','iptal_edildi')), 0),
	COALESCE((SELECT COUNT(*) FROM jobs WHERE delivery_date < $1 AND status NOT IN ('teslim_edildi','iptal_edildi')), 0),
	COALESCE((SELECT COUNT(*) FROM jobs WHERE status = 'hazir'), 0),
	COALESCE((SELECT SUM(CASE WHEN direction='debit' THEN amount ELSE -amount END)::text FROM customer_transactions), '0.00'),
	COALESCE((SELECT SUM(balance)::text FROM cash_bank_accounts WHERE account_type='kasa'), '0.00'),
	COALESCE((SELECT SUM(balance)::text FROM cash_bank_accounts WHERE account_type='banka'), '0.00'),
	COALESCE((SELECT SUM(amount)::text FROM finance_transactions WHERE entry_type IN ('gelir','tahsilat') AND date_trunc('month', transaction_date) = date_trunc('month', $1::date)), '0.00'),
	COALESCE((SELECT SUM(amount)::text FROM finance_transactions WHERE entry_type IN ('gider','odeme') AND date_trunc('month', transaction_date) = date_trunc('month', $1::date)), '0.00'),
	COALESCE((SELECT SUM(amount)::text FROM checks WHERE check_type='alacak' AND status='portfoyde'), '0.00'),
	COALESCE((SELECT COUNT(*) FROM customers WHERE is_active=TRUE), 0)`

	var summary Summary
	err := repository.pool.QueryRow(ctx, query, today).Scan(
		&summary.ActiveJobs,
		&summary.DueToday,
		&summary.Overdue,
		&summary.Ready,
		&summary.Receivable,
		&summary.CashBalance,
		&summary.BankBalance,
		&summary.MonthlyIncome,
		&summary.MonthlyExpense,
		&summary.UpcomingChecks,
		&summary.ActiveCustomers,
	)
	if err != nil {
		return Summary{}, err
	}

	summary.Payable = "0.00"

	// Fetch recent activities (combining jobs and customer transactions)
	const actQuery = `
(
	SELECT j.id::text, 'job' AS type, 'İş: ' || j.job_number AS title, c.company_name AS subtitle, j.total_amount::text AS amount, j.status, j.created_at AS transaction_date
	FROM jobs j JOIN customers c ON c.id=j.customer_id
)
UNION ALL
(
	SELECT t.id::text, 'transaction' AS type, t.description AS title, c.company_name AS subtitle, t.amount::text AS amount, t.entry_type AS status, t.created_at AS transaction_date
	FROM customer_transactions t JOIN customers c ON c.id=t.customer_id
)
ORDER BY transaction_date DESC LIMIT 8`

	rows, err := repository.pool.Query(ctx, actQuery)
	if err == nil {
		defer rows.Close()
		activities := make([]RecentActivity, 0)
		for rows.Next() {
			var a RecentActivity
			if err := rows.Scan(&a.ID, &a.Type, &a.Title, &a.Subtitle, &a.Amount, &a.Status, &a.TransactionDate); err == nil {
				activities = append(activities, a)
			}
		}
		summary.RecentActivities = activities
	}

	return summary, nil
}
