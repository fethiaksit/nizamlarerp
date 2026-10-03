package finance

import (
	"context"
	"testing"
)

type repoStub struct{}

func (s *repoStub) ListAccounts(context.Context) ([]CashBankAccount, error) {
	return []CashBankAccount{{Name: "Kasa 1"}}, nil
}
func (s *repoStub) CreateAccount(_ context.Context, input CashBankAccount) (CashBankAccount, error) {
	return input, nil
}
func (s *repoStub) ListTransactions(context.Context, Filters) ([]FinanceTransaction, error) {
	return nil, nil
}
func (s *repoStub) CreateTransaction(_ context.Context, input CreateFinanceInput) (FinanceTransaction, error) {
	return FinanceTransaction{EntryType: input.EntryType, Amount: input.Amount}, nil
}

func TestCreateAccountRequiresName(t *testing.T) {
	service := NewService(&repoStub{})
	_, err := service.CreateAccount(context.Background(), CashBankAccount{Name: "   "})
	if err == nil || err.Error() != "Hesap adı zorunludur." {
		t.Fatalf("CreateAccount() error = %v, want name error", err)
	}
}

func TestCreateTransactionRequiresEntryType(t *testing.T) {
	service := NewService(&repoStub{})
	_, err := service.CreateTransaction(context.Background(), CreateFinanceInput{Amount: "100.00"})
	if err == nil {
		t.Fatalf("CreateTransaction() expected error for missing entry_type")
	}
}
