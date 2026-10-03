package customers

import (
	"context"
	"errors"
	"strings"

	"github.com/fethiaksit/nizamlar-erp/backend/internal/ledger"
	"github.com/google/uuid"
)

type Service struct {
	repository Repository
	ledger     ledger.Manager
}

func NewService(repository Repository, ledgerManager ledger.Manager) *Service {
	return &Service{repository: repository, ledger: ledgerManager}
}

func (service *Service) CreateCustomer(ctx context.Context, input CreateCustomerInput) (Customer, error) {
	input = trimInput(input)
	if input.CompanyName == "" {
		return Customer{}, errors.New("Firma adı zorunludur.")
	}

	customer, err := service.repository.Create(ctx, input)
	if errors.Is(err, ErrDuplicateCompany) {
		return Customer{}, errors.New("Bu firma adıyla kayıt zaten var.")
	}
	return customer, err
}

func (service *Service) ListCustomers(ctx context.Context, query string) ([]CustomerListItem, error) {
	return service.repository.List(ctx, strings.TrimSpace(query))
}

func (service *Service) GetCustomerDetail(ctx context.Context, id uuid.UUID) (CustomerDetail, error) {
	customer, err := service.repository.FindByID(ctx, id)
	if err != nil {
		return CustomerDetail{}, err
	}
	balance, err := service.ledger.OpenBalance(ctx, id)
	if err != nil {
		return CustomerDetail{}, err
	}
	transactions, err := service.ledger.ListByCustomer(ctx, id)
	if err != nil {
		return CustomerDetail{}, err
	}
	return CustomerDetail{Customer: customer, OpenBalance: balance, Transactions: transactions}, nil
}

func (service *Service) UpdateCustomer(ctx context.Context, id uuid.UUID, input UpdateCustomerInput) (Customer, error) {
	input = trimInput(input)
	if input.CompanyName == "" {
		return Customer{}, errors.New("Firma adı zorunludur.")
	}
	customer, err := service.repository.Update(ctx, id, input)
	if errors.Is(err, ErrDuplicateCompany) {
		return Customer{}, errors.New("Bu firma adıyla kayıt zaten var.")
	}
	return customer, err
}

func (service *Service) Transactions(ctx context.Context, id uuid.UUID) ([]ledger.Transaction, error) {
	return service.ledger.ListByCustomer(ctx, id)
}

func (service *Service) AddTransaction(ctx context.Context, customerID uuid.UUID, input ledger.CreateTransactionInput) (ledger.Transaction, error) {
	input.CustomerID = customerID
	return service.ledger.CreateTransaction(ctx, input)
}

func (service *Service) ReverseTransaction(ctx context.Context, txID uuid.UUID) error {
	return service.ledger.ReverseTransaction(ctx, txID)
}

func trimInput(input CreateCustomerInput) CreateCustomerInput {
	input.CompanyName = strings.TrimSpace(input.CompanyName)
	input.ContactName = strings.TrimSpace(input.ContactName)
	input.Phone = strings.TrimSpace(input.Phone)
	input.Address = strings.TrimSpace(input.Address)
	input.TaxOffice = strings.TrimSpace(input.TaxOffice)
	input.TaxNumber = strings.TrimSpace(input.TaxNumber)
	input.Notes = strings.TrimSpace(input.Notes)
	return input
}
