package settings

import (
	"context"
	"errors"
	"strings"
)

type Service struct{ repo Repository }

func NewService(repo Repository) *Service { return &Service{repo: repo} }

func (s *Service) Get(ctx context.Context) (CompanySettings, error) {
	return s.repo.Get(ctx)
}

func (s *Service) Update(ctx context.Context, input CompanySettings) (CompanySettings, error) {
	input.CompanyTitle = strings.TrimSpace(input.CompanyTitle)
	if input.CompanyTitle == "" {
		return CompanySettings{}, errors.New("Firma unvanı zorunludur.")
	}
	if input.Currency == "" {
		input.Currency = "TRY"
	}
	return s.repo.Update(ctx, input)
}
