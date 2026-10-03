package personnel

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
	List(ctx context.Context, search string) ([]Personnel, error)
	FindByID(ctx context.Context, id uuid.UUID) (Personnel, error)
	Create(ctx context.Context, input CreatePersonnelInput) (Personnel, error)
	CreatePayment(ctx context.Context, input CreatePaymentInput) (PaymentHistory, error)
}

type PostgresRepository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) List(ctx context.Context, search string) ([]Personnel, error) {
	const query = `
SELECT id, full_name, title, phone, email, monthly_salary::text, start_date, is_active, notes, created_at, updated_at
FROM personnel
WHERE is_active = TRUE
  AND ($1 = '' OR full_name ILIKE '%' || $1 || '%' OR title ILIKE '%' || $1 || '%')
ORDER BY full_name`

	rows, err := r.pool.Query(ctx, query, search)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Personnel, 0)
	for rows.Next() {
		var p Personnel
		if err := rows.Scan(&p.ID, &p.FullName, &p.Title, &p.Phone, &p.Email, &p.MonthlySalary, &p.StartDate, &p.IsActive, &p.Notes, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, p)
	}
	return items, rows.Err()
}

func (r *PostgresRepository) FindByID(ctx context.Context, id uuid.UUID) (Personnel, error) {
	const query = `
SELECT id, full_name, title, phone, email, monthly_salary::text, start_date, is_active, notes, created_at, updated_at
FROM personnel WHERE id = $1`

	var p Personnel
	err := r.pool.QueryRow(ctx, query, id).Scan(&p.ID, &p.FullName, &p.Title, &p.Phone, &p.Email, &p.MonthlySalary, &p.StartDate, &p.IsActive, &p.Notes, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Personnel{}, errors.New("Personel bulunamadı.")
	}
	if err != nil {
		return Personnel{}, err
	}

	const payQuery = `
SELECT pp.id, pp.personnel_id, pp.account_id, COALESCE(a.name, ''), pp.payment_type, pp.amount::text, pp.payment_date, pp.description, pp.created_at
FROM personnel_payments pp
LEFT JOIN cash_bank_accounts a ON a.id = pp.account_id
WHERE pp.personnel_id = $1
ORDER BY pp.payment_date DESC, pp.created_at DESC`

	rows, err := r.pool.Query(ctx, payQuery, id)
	if err == nil {
		defer rows.Close()
		payments := make([]PaymentHistory, 0)
		for rows.Next() {
			var ph PaymentHistory
			if err := rows.Scan(&ph.ID, &ph.PersonnelID, &ph.AccountID, &ph.AccountName, &ph.PaymentType, &ph.Amount, &ph.PaymentDate, &ph.Description, &ph.CreatedAt); err == nil {
				payments = append(payments, ph)
			}
		}
		p.Payments = payments
	}

	return p, nil
}

func (r *PostgresRepository) Create(ctx context.Context, input CreatePersonnelInput) (Personnel, error) {
	salary, _ := decimal.NewFromString(input.MonthlySalary)
	sDate, err := time.Parse("2006-01-02", input.StartDate)
	if err != nil {
		sDate = time.Now()
	}

	const query = `
INSERT INTO personnel (full_name, title, phone, email, monthly_salary, start_date, notes)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, full_name, title, phone, email, monthly_salary::text, start_date, is_active, notes, created_at, updated_at`

	var p Personnel
	err = r.pool.QueryRow(ctx, query, input.FullName, input.Title, input.Phone, input.Email, salary.StringFixed(2), sDate, input.Notes).Scan(
		&p.ID, &p.FullName, &p.Title, &p.Phone, &p.Email, &p.MonthlySalary, &p.StartDate, &p.IsActive, &p.Notes, &p.CreatedAt, &p.UpdatedAt,
	)
	return p, err
}

func (r *PostgresRepository) CreatePayment(ctx context.Context, input CreatePaymentInput) (PaymentHistory, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return PaymentHistory{}, err
	}
	defer tx.Rollback(ctx)

	amt, err := decimal.NewFromString(input.Amount)
	if err != nil || !amt.GreaterThan(decimal.Zero) {
		return PaymentHistory{}, errors.New("Ödeme tutarı sıfırdan büyük olmalıdır.")
	}

	pDate, err := time.Parse("2006-01-02", input.PaymentDate)
	if err != nil {
		pDate = time.Now()
	}

	const insertPay = `
INSERT INTO personnel_payments (personnel_id, account_id, payment_type, amount, payment_date, description)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, personnel_id, account_id, payment_type, amount::text, payment_date, description, created_at`

	var ph PaymentHistory
	err = tx.QueryRow(ctx, insertPay, input.PersonnelID, input.AccountID, input.PaymentType, amt.StringFixed(2), pDate, input.Description).Scan(
		&ph.ID, &ph.PersonnelID, &ph.AccountID, &ph.PaymentType, &ph.Amount, &ph.PaymentDate, &ph.Description, &ph.CreatedAt,
	)
	if err != nil {
		return PaymentHistory{}, err
	}

	// Update cash/bank account if set
	if input.AccountID != nil {
		const updateAcc = `UPDATE cash_bank_accounts SET balance = balance - $2, updated_at = NOW() WHERE id = $1`
		if _, err := tx.Exec(ctx, updateAcc, *input.AccountID, amt.StringFixed(2)); err != nil {
			return PaymentHistory{}, err
		}

		var pName string
		_ = tx.QueryRow(ctx, `SELECT full_name FROM personnel WHERE id=$1`, input.PersonnelID).Scan(&pName)
		const insertFin = `
INSERT INTO finance_transactions (account_id, entry_type, category, amount, currency, transaction_date, description)
VALUES ($1, 'gider', 'maas', $2, 'TRY', $3, $4)`
		desc := pName + " - " + input.PaymentType + " ödemesi (" + input.Description + ")"
		if _, err := tx.Exec(ctx, insertFin, *input.AccountID, amt.StringFixed(2), pDate, desc); err != nil {
			return PaymentHistory{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return PaymentHistory{}, err
	}

	return ph, nil
}
