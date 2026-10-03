package finance

import (
	"time"

	"github.com/google/uuid"
)

type CashBankAccount struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	AccountType string    `json:"account_type"` // 'kasa', 'banka'
	BankName    string    `json:"bank_name"`
	IBAN        string    `json:"iban"`
	Currency    string    `json:"currency"`
	Balance     string    `json:"balance"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type FinanceTransaction struct {
	ID              uuid.UUID  `json:"id"`
	AccountID       *uuid.UUID `json:"account_id,omitempty"`
	AccountName     string     `json:"account_name,omitempty"`
	CustomerID      *uuid.UUID `json:"customer_id,omitempty"`
	CustomerName    string     `json:"customer_name,omitempty"`
	EntryType       string     `json:"entry_type"` // 'gelir', 'gider', 'tahsilat', 'odeme'
	Category        string     `json:"category"`   // 'baski_satisi', 'hammadde', 'kira', 'fatura', 'maas', 'yakit', 'diger'
	Amount          string     `json:"amount"`
	Currency        string     `json:"currency"`
	TransactionDate time.Time  `json:"transaction_date"`
	Description     string     `json:"description"`
	CreatedAt       time.Time  `json:"created_at"`
}

type CreateFinanceInput struct {
	AccountID       *uuid.UUID `json:"account_id,omitempty"`
	CustomerID      *uuid.UUID `json:"customer_id,omitempty"`
	EntryType       string     `json:"entry_type"`
	Category        string     `json:"category"`
	Amount          string     `json:"amount"`
	Currency        string     `json:"currency"`
	TransactionDate string     `json:"transaction_date"`
	Description     string     `json:"description"`
}

type Filters struct {
	EntryType string
	Category  string
	Search    string
}
