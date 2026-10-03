package finance

import (
	"context"
	"errors"
	"strings"
)

type Service struct{ repo Repository }

func NewService(repo Repository) *Service { return &Service{repo: repo} }

func (s *Service) ListAccounts(ctx context.Context) ([]CashBankAccount, error) {
	return s.repo.ListAccounts(ctx)
}

func (s *Service) CreateAccount(ctx context.Context, input CashBankAccount) (CashBankAccount, error) {
	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" {
		return CashBankAccount{}, errors.New("Hesap adı zorunludur.")
	}
	if input.AccountType != "kasa" && input.AccountType != "banka" {
		input.AccountType = "kasa"
	}
	if input.Balance == "" {
		input.Balance = "0.00"
	}
	return s.repo.CreateAccount(ctx, input)
}

func (s *Service) ListTransactions(ctx context.Context, filters Filters) ([]FinanceTransaction, error) {
	filters.EntryType = strings.TrimSpace(filters.EntryType)
	filters.Category = strings.TrimSpace(filters.Category)
	filters.Search = strings.TrimSpace(filters.Search)
	return s.repo.ListTransactions(ctx, filters)
}

func (s *Service) CreateTransaction(ctx context.Context, input CreateFinanceInput) (FinanceTransaction, error) {
	input.EntryType = strings.TrimSpace(input.EntryType)
	input.Category = strings.TrimSpace(input.Category)
	input.Description = strings.TrimSpace(input.Description)

	if input.EntryType == "" {
		return FinanceTransaction{}, errors.New("İşlem türü (gelir, gider, tahsilat, ödeme) seçilmelidir.")
	}

	return s.repo.CreateTransaction(ctx, input)
}
