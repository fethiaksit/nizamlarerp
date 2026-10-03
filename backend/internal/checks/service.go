package checks

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
)

type Service struct{ repo Repository }

func NewService(repo Repository) *Service { return &Service{repo: repo} }

func (s *Service) List(ctx context.Context, filters Filters) ([]Check, error) {
	filters.CheckType = strings.TrimSpace(filters.CheckType)
	filters.Status = strings.TrimSpace(filters.Status)
	filters.Search = strings.TrimSpace(filters.Search)
	return s.repo.List(ctx, filters)
}

func (s *Service) Get(ctx context.Context, id uuid.UUID) (Check, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *Service) Create(ctx context.Context, input CreateCheckInput) (Check, error) {
	input.CheckNumber = strings.TrimSpace(input.CheckNumber)
	input.BankName = strings.TrimSpace(input.BankName)
	input.Drawer = strings.TrimSpace(input.Drawer)
	input.Notes = strings.TrimSpace(input.Notes)

	if input.CheckNumber == "" {
		return Check{}, errors.New("Çek numarası zorunludur.")
	}
	if input.CheckType != "alacak" && input.CheckType != "borc" {
		input.CheckType = "alacak"
	}

	return s.repo.Create(ctx, input)
}

func (s *Service) UpdateStatus(ctx context.Context, id uuid.UUID, input UpdateCheckStatusInput) (Check, error) {
	input.Status = strings.TrimSpace(input.Status)
	if input.Status == "" {
		return Check{}, errors.New("Geçerli bir durum seçin.")
	}
	return s.repo.UpdateStatus(ctx, id, input)
}
