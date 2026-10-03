package settings

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	Get(ctx context.Context) (CompanySettings, error)
	Update(ctx context.Context, input CompanySettings) (CompanySettings, error)
}

type PostgresRepository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) Get(ctx context.Context) (CompanySettings, error) {
	const query = `SELECT id, company_title, phone, email, address, tax_office, tax_number, currency, updated_at FROM company_settings WHERE id=1`
	var s CompanySettings
	err := r.pool.QueryRow(ctx, query).Scan(&s.ID, &s.CompanyTitle, &s.Phone, &s.Email, &s.Address, &s.TaxOffice, &s.TaxNumber, &s.Currency, &s.UpdatedAt)
	if err != nil {
		s = CompanySettings{
			ID:           1,
			CompanyTitle: "Nizamlar Tekstil Baskı San. ve Tic. Ltd. Şti.",
			Currency:     "TRY",
		}
	}
	return s, nil
}

func (r *PostgresRepository) Update(ctx context.Context, input CompanySettings) (CompanySettings, error) {
	const query = `
INSERT INTO company_settings (id, company_title, phone, email, address, tax_office, tax_number, currency, updated_at)
VALUES (1, $1, $2, $3, $4, $5, $6, $7, NOW())
ON CONFLICT (id) DO UPDATE SET
	company_title = EXCLUDED.company_title,
	phone = EXCLUDED.phone,
	email = EXCLUDED.email,
	address = EXCLUDED.address,
	tax_office = EXCLUDED.tax_office,
	tax_number = EXCLUDED.tax_number,
	currency = EXCLUDED.currency,
	updated_at = NOW()
RETURNING id, company_title, phone, email, address, tax_office, tax_number, currency, updated_at`

	var s CompanySettings
	err := r.pool.QueryRow(ctx, query, input.CompanyTitle, input.Phone, input.Email, input.Address, input.TaxOffice, input.TaxNumber, input.Currency).Scan(&s.ID, &s.CompanyTitle, &s.Phone, &s.Email, &s.Address, &s.TaxOffice, &s.TaxNumber, &s.Currency, &s.UpdatedAt)
	return s, err
}
