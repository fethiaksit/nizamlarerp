package customers

import (
	"context"
	"errors"
	"testing"

	"github.com/fethiaksit/nizamlar-erp/backend/internal/ledger"
	"github.com/google/uuid"
)

type customerRepositoryStub struct {
	createdInput CreateCustomerInput
	createResult Customer
	createErr    error
	customer     Customer
}

func (stub *customerRepositoryStub) Create(_ context.Context, input CreateCustomerInput) (Customer, error) {
	stub.createdInput = input
	return stub.createResult, stub.createErr
}

func (stub *customerRepositoryStub) List(context.Context, string) ([]CustomerListItem, error) {
	return nil, nil
}

func (stub *customerRepositoryStub) FindByID(context.Context, uuid.UUID) (Customer, error) {
	return stub.customer, nil
}

func (stub *customerRepositoryStub) Update(context.Context, uuid.UUID, UpdateCustomerInput) (Customer, error) {
	return Customer{}, nil
}

type ledgerReaderStub struct {
	balance string
}

func (stub ledgerReaderStub) OpenBalance(context.Context, uuid.UUID) (string, error) {
	return stub.balance, nil
}

func (stub ledgerReaderStub) ListByCustomer(context.Context, uuid.UUID) ([]Transaction, error) {
	return nil, nil
}

func (stub ledgerReaderStub) CreateTransaction(context.Context, ledger.CreateTransactionInput) (ledger.Transaction, error) {
	return ledger.Transaction{}, nil
}

func (stub ledgerReaderStub) ReverseTransaction(context.Context, uuid.UUID) error {
	return nil
}

func TestCreateCustomerRejectsBlankCompanyName(t *testing.T) {
	service := NewService(&customerRepositoryStub{}, ledgerReaderStub{})

	_, err := service.CreateCustomer(context.Background(), CreateCustomerInput{CompanyName: "   "})

	if err == nil || err.Error() != "Firma adı zorunludur." {
		t.Fatalf("CreateCustomer() error = %v, want Firma adı zorunludur.", err)
	}
}

func TestCreateCustomerTrimsCompanyNameBeforeSaving(t *testing.T) {
	repository := &customerRepositoryStub{createResult: Customer{ID: uuid.New(), CompanyName: "ABC Tekstil"}}
	service := NewService(repository, ledgerReaderStub{})

	_, err := service.CreateCustomer(context.Background(), CreateCustomerInput{CompanyName: "  ABC Tekstil  "})

	if err != nil {
		t.Fatalf("CreateCustomer() error = %v", err)
	}
	if repository.createdInput.CompanyName != "ABC Tekstil" {
		t.Fatalf("saved company = %q, want trimmed name", repository.createdInput.CompanyName)
	}
}

func TestCreateCustomerExplainsDuplicateCompanyName(t *testing.T) {
	repository := &customerRepositoryStub{createErr: ErrDuplicateCompany}
	service := NewService(repository, ledgerReaderStub{})

	_, err := service.CreateCustomer(context.Background(), CreateCustomerInput{CompanyName: "ABC Tekstil"})

	if err == nil || err.Error() != "Bu firma adıyla kayıt zaten var." {
		t.Fatalf("CreateCustomer() error = %v, want duplicate company message", err)
	}
}

func TestGetCustomerDetailReportsZeroBalanceForNewCustomer(t *testing.T) {
	customerID := uuid.New()
	repository := &customerRepositoryStub{customer: Customer{ID: customerID, CompanyName: "ABC Tekstil"}}
	service := NewService(repository, ledgerReaderStub{balance: "0.00"})

	detail, err := service.GetCustomerDetail(context.Background(), customerID)

	if err != nil {
		t.Fatalf("GetCustomerDetail() error = %v", err)
	}
	if detail.OpenBalance != "0.00" {
		t.Fatalf("OpenBalance = %q, want 0.00", detail.OpenBalance)
	}
}

func TestCreateCustomerPassesThroughUnexpectedRepositoryError(t *testing.T) {
	repository := &customerRepositoryStub{createErr: errors.New("bağlantı koptu")}
	service := NewService(repository, ledgerReaderStub{})

	_, err := service.CreateCustomer(context.Background(), CreateCustomerInput{CompanyName: "ABC Tekstil"})

	if err == nil || err.Error() != "bağlantı koptu" {
		t.Fatalf("CreateCustomer() error = %v, want repository error", err)
	}
}
