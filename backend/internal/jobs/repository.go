package jobs

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresRepository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *PostgresRepository { return &PostgresRepository{pool: pool} }

func (repository *PostgresRepository) Create(ctx context.Context, input CreateJobInput) (Job, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Job{}, err
	}
	defer tx.Rollback(ctx)

	const insertJob = `INSERT INTO jobs (customer_id, job_number, pattern_name, pattern_code, pattern_reference, fabric_info, print_type, color_info, quantity, unit, unit_price, total_amount, order_date, delivery_date, notes)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
RETURNING id, customer_id, job_number, pattern_name, pattern_code, pattern_reference, fabric_info, print_type, color_info, quantity::text, unit, unit_price::text, total_amount::text, order_date, delivery_date, status, notes, created_at, updated_at`
	job, err := scanJob(tx.QueryRow(ctx, insertJob, input.CustomerID, input.JobNumber, input.PatternName, input.PatternCode, input.PatternReference, input.FabricInfo, input.PrintType, input.ColorInfo, input.Quantity, input.Unit, input.UnitPrice, input.TotalAmount, input.OrderDate, input.DeliveryDate, input.Notes))
	if err != nil {
		return Job{}, err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO job_status_history (job_id, new_status) VALUES ($1, $2)`, job.ID, StatusNew); err != nil {
		return Job{}, err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO customer_transactions (customer_id, job_id, entry_type, direction, amount, transaction_date, description) VALUES ($1,$2,'job_sale','debit',$3,$4,$5)`, job.CustomerID, job.ID, job.TotalAmount, job.OrderDate, job.JobNumber+" numaralı iş"); err != nil {
		return Job{}, err
	}
	if err = tx.Commit(ctx); err != nil {
		return Job{}, err
	}
	return job, nil
}

func (repository *PostgresRepository) List(ctx context.Context, filters Filters) ([]ListItem, error) {
	const query = `SELECT j.id, j.customer_id, j.job_number, j.pattern_name, j.pattern_code, j.pattern_reference, j.fabric_info, j.print_type, j.color_info, j.quantity::text, j.unit, j.unit_price::text, j.total_amount::text, j.order_date, j.delivery_date, j.status, j.notes, j.created_at, j.updated_at, c.company_name FROM jobs j JOIN customers c ON c.id=j.customer_id WHERE ($1='' OR j.status=$1) AND ($2='' OR j.job_number ILIKE '%'||$2||'%' OR j.pattern_code ILIKE '%'||$2||'%') ORDER BY j.delivery_date, j.created_at DESC`
	rows, err := repository.pool.Query(ctx, query, filters.Status, filters.Search)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]ListItem, 0)
	for rows.Next() {
		var item ListItem
		if err := scanListItem(rows, &item); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (repository *PostgresRepository) FindByID(ctx context.Context, id uuid.UUID) (Job, error) {
	const query = `SELECT id, customer_id, job_number, pattern_name, pattern_code, pattern_reference, fabric_info, print_type, color_info, quantity::text, unit, unit_price::text, total_amount::text, order_date, delivery_date, status, notes, created_at, updated_at FROM jobs WHERE id=$1`
	return scanJob(repository.pool.QueryRow(ctx, query, id))
}

func (repository *PostgresRepository) ChangeStatus(ctx context.Context, id uuid.UUID, input ChangeStatusInput) (Job, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Job{}, err
	}
	defer tx.Rollback(ctx)
	var previous string
	if err = tx.QueryRow(ctx, `SELECT status FROM jobs WHERE id=$1 FOR UPDATE`, id).Scan(&previous); err != nil {
		return Job{}, mapError(err)
	}
	const query = `UPDATE jobs SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING id, customer_id, job_number, pattern_name, pattern_code, pattern_reference, fabric_info, print_type, color_info, quantity::text, unit, unit_price::text, total_amount::text, order_date, delivery_date, status, notes, created_at, updated_at`
	job, err := scanJob(tx.QueryRow(ctx, query, id, input.Status))
	if err != nil {
		return Job{}, err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO job_status_history (job_id, previous_status, new_status, note) VALUES ($1,$2,$3,$4)`, id, previous, input.Status, input.Note); err != nil {
		return Job{}, err
	}
	if err = tx.Commit(ctx); err != nil {
		return Job{}, err
	}
	return job, nil
}

type scanner interface{ Scan(...any) error }

func scanJob(row scanner) (Job, error) {
	var job Job
	if err := scanJobFields(row, &job); err != nil {
		return Job{}, mapError(err)
	}
	return job, nil
}
func scanJobFields(row scanner, job *Job) error {
	return row.Scan(&job.ID, &job.CustomerID, &job.JobNumber, &job.PatternName, &job.PatternCode, &job.PatternReference, &job.FabricInfo, &job.PrintType, &job.ColorInfo, &job.Quantity, &job.Unit, &job.UnitPrice, &job.TotalAmount, &job.OrderDate, &job.DeliveryDate, &job.Status, &job.Notes, &job.CreatedAt, &job.UpdatedAt)
}
func scanListItem(row scanner, item *ListItem) error {
	return row.Scan(&item.ID, &item.CustomerID, &item.JobNumber, &item.PatternName, &item.PatternCode, &item.PatternReference, &item.FabricInfo, &item.PrintType, &item.ColorInfo, &item.Quantity, &item.Unit, &item.UnitPrice, &item.TotalAmount, &item.OrderDate, &item.DeliveryDate, &item.Status, &item.Notes, &item.CreatedAt, &item.UpdatedAt, &item.CustomerName)
}
func mapError(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return ErrDuplicateJobNumber
	}
	return err
}
