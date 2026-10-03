package checks

import (
	"time"

	"github.com/google/uuid"
)

type Check struct {
	ID           uuid.UUID `json:"id"`
	CustomerID   *uuid.UUID `json:"customer_id,omitempty"`
	CustomerName string    `json:"customer_name,omitempty"`
	CheckNumber  string    `json:"check_number"`
	BankName     string    `json:"bank_name"`
	Drawer       string    `json:"drawer"`
	Amount       string    `json:"amount"`
	Currency     string    `json:"currency"`
	IssueDate    time.Time `json:"issue_date"`
	DueDate      time.Time `json:"due_date"`
	CheckType    string    `json:"check_type"` // 'alacak', 'borc'
	Status       string    `json:"status"`     // 'portfoyde', 'tahsil_edildi', 'odendi', 'karsiliksiz', 'iadeli'
	Notes        string    `json:"notes"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateCheckInput struct {
	CustomerID  *uuid.UUID `json:"customer_id,omitempty"`
	CheckNumber string     `json:"check_number"`
	BankName    string     `json:"bank_name"`
	Drawer      string     `json:"drawer"`
	Amount      string     `json:"amount"`
	Currency    string     `json:"currency"`
	IssueDate   string     `json:"issue_date"`
	DueDate     string     `json:"due_date"`
	CheckType   string     `json:"check_type"`
	Status      string     `json:"status"`
	Notes       string     `json:"notes"`
}

type UpdateCheckStatusInput struct {
	Status    string     `json:"status"`
	AccountID *uuid.UUID `json:"account_id,omitempty"` // If tahsil_edildi/odendi, deposit/withdraw to this cash/bank account!
	Notes     string     `json:"notes"`
}

type Filters struct {
	CheckType string
	Status    string
	Search    string
}
