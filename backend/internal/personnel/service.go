package personnel

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
)

type Service struct{ repo Repository }

func NewService(repo Repository) *Service { return &Service{repo: repo} }

func (s *Service) List(ctx context.Context, search string) ([]Personnel, error) {
	return s.repo.List(ctx, strings.TrimSpace(search))
}

func (s *Service) Get(ctx context.Context, id uuid.UUID) (Personnel, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *Service) Create(ctx context.Context, input CreatePersonnelInput) (Personnel, error) {
	input.FullName = strings.TrimSpace(input.FullName)
	if input.FullName == "" {
		return Personnel{}, errors.New("Ad soyad alanı zorunludur.")
	}
	return s.repo.Create(ctx, input)
}

func (s *Service) CreatePayment(ctx context.Context, input CreatePaymentInput) (PaymentHistory, error) {
	if input.PersonnelID == uuid.Nil {
		return PaymentHistory{}, errors.New("Personel seçilmelidir.")
	}
	return s.repo.CreatePayment(ctx, input)
}
