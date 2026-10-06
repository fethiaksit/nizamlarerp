package auth

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrUserNotFound = errors.New("Kullanıcı bulunamadı")
)

// Repository manages database operations for users.
type Repository interface {
	GetByUsernameOrEmail(ctx context.Context, identifier string) (*User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	CreateUser(ctx context.Context, user *User) error
	CountUsers(ctx context.Context) (int, error)
}

type pgxRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &pgxRepository{db: db}
}

func (r *pgxRepository) GetByUsernameOrEmail(ctx context.Context, identifier string) (*User, error) {
	trimmed := strings.TrimSpace(identifier)
	if trimmed == "" {
		return nil, ErrUserNotFound
	}

	query := `
		SELECT id, email, COALESCE(username, email) AS username, COALESCE(full_name, '') AS full_name,
		       COALESCE(role, 'admin') AS role, password_hash, created_at, updated_at
		FROM users
		WHERE lower(email) = lower($1) OR (username IS NOT NULL AND lower(username) = lower($1))
		LIMIT 1;
	`

	var u User
	err := r.db.QueryRow(ctx, query, trimmed).Scan(
		&u.ID,
		&u.Email,
		&u.Username,
		&u.FullName,
		&u.Role,
		&u.PasswordHash,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return &u, nil
}

func (r *pgxRepository) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	query := `
		SELECT id, email, COALESCE(username, email) AS username, COALESCE(full_name, '') AS full_name,
		       COALESCE(role, 'admin') AS role, password_hash, created_at, updated_at
		FROM users
		WHERE id = $1
		LIMIT 1;
	`

	var u User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID,
		&u.Email,
		&u.Username,
		&u.FullName,
		&u.Role,
		&u.PasswordHash,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return &u, nil
}

func (r *pgxRepository) CreateUser(ctx context.Context, user *User) error {
	query := `
		INSERT INTO users (id, email, username, full_name, role, password_hash, created_at, updated_at)
		VALUES (COALESCE(NULLIF($1, '00000000-0000-0000-0000-000000000000'::uuid), gen_random_uuid()), $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id, created_at, updated_at;
	`

	return r.db.QueryRow(ctx, query,
		user.ID,
		user.Email,
		user.Username,
		user.FullName,
		user.Role,
		user.PasswordHash,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

func (r *pgxRepository) CountUsers(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM users;").Scan(&count)
	return count, err
}
