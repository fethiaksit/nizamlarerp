package customers

import (
	"errors"
	"time"

	"github.com/fethiaksit/nizamlar-erp/backend/internal/ledger"
	"github.com/google/uuid"
)

var (
	ErrDuplicateCompany = errors.New("duplicate company")
	ErrNotFound         = errors.New("customer not found")
)

type Customer struct {
	ID          uuid.UUID `json:"id"`
	CompanyName string    `json:"company_name"`
	ContactName string    `json:"contact_name"`
	Phone       string    `json:"phone"`
	Address     string    `json:"address"`
	TaxOffice   string    `json:"tax_office"`
	TaxNumber   string    `json:"tax_number"`
	Notes       string    `json:"notes"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateCustomerInput struct {
	CompanyName string `json:"company_name"`
	ContactName string `json:"contact_name"`
	Phone       string `json:"phone"`
	Address     string `json:"address"`
	TaxOffice   string `json:"tax_office"`
	TaxNumber   string `json:"tax_number"`
	Notes       string `json:"notes"`
}

type UpdateCustomerInput = CreateCustomerInput

type CustomerListItem struct {
	ID          uuid.UUID `json:"id"`
	CompanyName string    `json:"company_name"`
	ContactName string    `json:"contact_name"`
	Phone       string    `json:"phone"`
	OpenBalance string    `json:"open_balance"`
}

type CustomerDetail struct {
	Customer
	OpenBalance  string               `json:"open_balance"`
	Transactions []ledger.Transaction `json:"transactions"`
}

type Transaction = ledger.Transaction
