package ledger

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Transaction struct {
	ID              uuid.UUID `json:"id"`
	EntryType       string    `json:"entry_type"`
	Direction       string    `json:"direction"`
	Amount          string    `json:"amount"`
	Currency        string    `json:"currency"`
	TransactionDate time.Time `json:"transaction_date"`
	Description     string    `json:"description"`
}

type Reader interface {
	OpenBalance(ctx context.Context, customerID uuid.UUID) (string, error)
	ListByCustomer(ctx context.Context, customerID uuid.UUID) ([]Transaction, error)
}
