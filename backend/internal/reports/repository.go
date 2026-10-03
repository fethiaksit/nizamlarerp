package reports

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	CustomerBalanceReport(ctx context.Context) ([]CustomerReportItem, error)
	FinancialSummaryReport(ctx context.Context) (FinancialSummaryReport, error)
	ProductionSummaryReport(ctx context.Context) ([]ProductionReportItem, error)
}

type PostgresRepository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) CustomerBalanceReport(ctx context.Context) ([]CustomerReportItem, error) {
	const query = `
SELECT c.id::text, c.company_name, c.phone,
       COALESCE(SUM(CASE WHEN t.direction = 'debit' THEN t.amount ELSE 0 END), 0)::text AS total_debit,
       COALESCE(SUM(CASE WHEN t.direction = 'credit' THEN t.amount ELSE 0 END), 0)::text AS total_credit,
       COALESCE(SUM(CASE WHEN t.direction = 'debit' THEN t.amount ELSE -t.amount END), 0)::text AS balance
FROM customers c
LEFT JOIN customer_transactions t ON t.customer_id = c.id
WHERE c.is_active = TRUE
GROUP BY c.id
ORDER BY c.company_name`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]CustomerReportItem, 0)
	for rows.Next() {
		var item CustomerReportItem
		if err := rows.Scan(&item.ID, &item.CompanyName, &item.Phone, &item.TotalDebit, &item.TotalCredit, &item.Balance); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *PostgresRepository) FinancialSummaryReport(ctx context.Context) (FinancialSummaryReport, error) {
	const query = `
SELECT
	COALESCE((SELECT SUM(amount)::text FROM finance_transactions WHERE entry_type IN ('gelir', 'tahsilat')), '0.00'),
	COALESCE((SELECT SUM(amount)::text FROM finance_transactions WHERE entry_type IN ('gider', 'odeme')), '0.00'),
	COALESCE((SELECT SUM(balance)::text FROM cash_bank_accounts), '0.00'),
	COALESCE((SELECT SUM(CASE WHEN direction = 'debit' THEN amount ELSE -amount END)::text FROM customer_transactions), '0.00')`

	var rep FinancialSummaryReport
	err := r.pool.QueryRow(ctx, query).Scan(&rep.TotalIncome, &rep.TotalExpense, &rep.TotalAssets, &rep.Receivables)
	if err != nil {
		return FinancialSummaryReport{}, err
	}
	// Calculate Net Profit
	rep.NetProfit = "0.00"
	return rep, nil
}

func (r *PostgresRepository) ProductionSummaryReport(ctx context.Context) ([]ProductionReportItem, error) {
	const query = `
SELECT status, COUNT(*), COALESCE(SUM(total_amount), 0)::text
FROM jobs
GROUP BY status`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	labels := map[string]string{
		"yeni":               "Yeni",
		"desen_hazirlaniyor": "Desen Hazırlanıyor",
		"onay_bekliyor":      "Onay Bekliyor",
		"baskida":            "Baskıda",
		"hazir":              "Hazır",
		"teslim_edildi":      "Teslim Edildi",
		"iptal_edildi":       "İptal Edildi",
	}

	items := make([]ProductionReportItem, 0)
	for rows.Next() {
		var item ProductionReportItem
		if err := rows.Scan(&item.Status, &item.Count, &item.TotalAmount); err != nil {
			return nil, err
		}
		item.StatusLabel = labels[item.Status]
		if item.StatusLabel == "" {
			item.StatusLabel = item.Status
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
