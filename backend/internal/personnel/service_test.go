package personnel

import (
	"context"
	"testing"

	"github.com/google/uuid"
)

type repoStub struct{}

func (s *repoStub) List(context.Context, string) ([]Personnel, error)             { return nil, nil }
func (s *repoStub) FindByID(context.Context, uuid.UUID) (Personnel, error)         { return Personnel{}, nil }
func (s *repoStub) Create(_ context.Context, input CreatePersonnelInput) (Personnel, error) { return Personnel{FullName: input.FullName}, nil }
func (s *repoStub) CreatePayment(_ context.Context, input CreatePaymentInput) (PaymentHistory, error) {
	return PaymentHistory{Amount: input.Amount}, nil
}

func TestCreatePersonnelRequiresFullName(t *testing.T) {
	service := NewService(&repoStub{})
	_, err := service.Create(context.Background(), CreatePersonnelInput{FullName: "  "})
	if err == nil || err.Error() != "Ad soyad alanı zorunludur." {
		t.Fatalf("Create() error = %v, want full name error", err)
	}
}
