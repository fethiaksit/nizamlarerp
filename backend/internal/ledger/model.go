package ledger

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Transaction struct {
	ID              uuid.UUID  `json:"id"`
	CustomerID      uuid.UUID  `json:"customer_id"`
	JobID           *uuid.UUID `json:"job_id,omitempty"`
	EntryType       string     `json:"entry_type"`
	Direction       string     `json:"direction"`
	Amount          string     `json:"amount"`
	Currency        string     `json:"currency"`
	TransactionDate time.Time  `json:"transaction_date"`
	Description     string     `json:"description"`
	CreatedAt       time.Time  `json:"created_at"`
}

type CreateTransactionInput struct {
	CustomerID      uuid.UUID  `json:"customer_id"`
	JobID           *uuid.UUID `json:"job_id,omitempty"`
	EntryType       string     `json:"entry_type"`
	Direction       string     `json:"direction"`
	Amount          string     `json:"amount"`
	Currency        string     `json:"currency"`
	TransactionDate string     `json:"transaction_date"`
	Description     string     `json:"description"`
}

type Reader interface {
	OpenBalance(ctx context.Context, customerID uuid.UUID) (string, error)
	ListByCustomer(ctx context.Context, customerID uuid.UUID) ([]Transaction, error)
}

type Manager interface {
	Reader
	CreateTransaction(ctx context.Context, input CreateTransactionInput) (Transaction, error)
	ReverseTransaction(ctx context.Context, id uuid.UUID) error
}
