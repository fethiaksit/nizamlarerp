package customers

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	Create(ctx context.Context, input CreateCustomerInput) (Customer, error)
	List(ctx context.Context, query string) ([]CustomerListItem, error)
	FindByID(ctx context.Context, id uuid.UUID) (Customer, error)
	Update(ctx context.Context, id uuid.UUID, input UpdateCustomerInput) (Customer, error)
}

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (repository *PostgresRepository) Create(ctx context.Context, input CreateCustomerInput) (Customer, error) {
	const query = `
INSERT INTO customers (company_name, contact_name, phone, address, tax_office, tax_number, notes)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, company_name, contact_name, phone, address, tax_office, tax_number, notes, is_active, created_at, updated_at`

	return scanCustomer(repository.pool.QueryRow(ctx, query,
		input.CompanyName, input.ContactName, input.Phone, input.Address,
		input.TaxOffice, input.TaxNumber, input.Notes,
	))
}

func (repository *PostgresRepository) List(ctx context.Context, search string) ([]CustomerListItem, error) {
	const query = `
SELECT c.id, c.company_name, c.contact_name, c.phone,
       COALESCE(SUM(CASE WHEN t.direction = 'debit' THEN t.amount ELSE -t.amount END), 0)::text AS open_balance
FROM customers c
LEFT JOIN customer_transactions t ON t.customer_id = c.id
WHERE c.is_active = TRUE
  AND ($1 = '' OR c.company_name ILIKE '%' || $1 || '%' OR c.phone ILIKE '%' || $1 || '%')
GROUP BY c.id
ORDER BY c.company_name`

	rows, err := repository.pool.Query(ctx, query, search)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]CustomerListItem, 0)
	for rows.Next() {
		var item CustomerListItem
		if err := rows.Scan(&item.ID, &item.CompanyName, &item.ContactName, &item.Phone, &item.OpenBalance); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (repository *PostgresRepository) FindByID(ctx context.Context, id uuid.UUID) (Customer, error) {
	const query = `
SELECT id, company_name, contact_name, phone, address, tax_office, tax_number, notes, is_active, created_at, updated_at
FROM customers WHERE id = $1`
	return scanCustomer(repository.pool.QueryRow(ctx, query, id))
}

func (repository *PostgresRepository) Update(ctx context.Context, id uuid.UUID, input UpdateCustomerInput) (Customer, error) {
	const query = `
UPDATE customers
SET company_name = $2, contact_name = $3, phone = $4, address = $5, tax_office = $6, tax_number = $7, notes = $8, updated_at = NOW()
WHERE id = $1
RETURNING id, company_name, contact_name, phone, address, tax_office, tax_number, notes, is_active, created_at, updated_at`
	return scanCustomer(repository.pool.QueryRow(ctx, query,
		id, input.CompanyName, input.ContactName, input.Phone, input.Address,
		input.TaxOffice, input.TaxNumber, input.Notes,
	))
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanCustomer(row rowScanner) (Customer, error) {
	var customer Customer
	err := row.Scan(
		&customer.ID,
		&customer.CompanyName,
		&customer.ContactName,
		&customer.Phone,
		&customer.Address,
		&customer.TaxOffice,
		&customer.TaxNumber,
		&customer.Notes,
		&customer.IsActive,
		&customer.CreatedAt,
		&customer.UpdatedAt,
	)
	if err == nil {
		return customer, nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return Customer{}, ErrNotFound
	}
	var postgresError *pgconn.PgError
	if errors.As(err, &postgresError) && postgresError.Code == "23505" {
		return Customer{}, ErrDuplicateCompany
	}
	return Customer{}, err
}
