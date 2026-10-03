package checks

import (
	"context"
	"testing"

	"github.com/google/uuid"
)

type repoStub struct{}

func (s *repoStub) List(context.Context, Filters) ([]Check, error)                 { return nil, nil }
func (s *repoStub) FindByID(context.Context, uuid.UUID) (Check, error)             { return Check{}, nil }
func (s *repoStub) Create(_ context.Context, input CreateCheckInput) (Check, error) { return Check{CheckNumber: input.CheckNumber}, nil }
func (s *repoStub) UpdateStatus(_ context.Context, _ uuid.UUID, input UpdateCheckStatusInput) (Check, error) {
	return Check{Status: input.Status}, nil
}

func TestCreateCheckRequiresNumber(t *testing.T) {
	service := NewService(&repoStub{})
	_, err := service.Create(context.Background(), CreateCheckInput{CheckNumber: "   "})
	if err == nil || err.Error() != "Çek numarası zorunludur." {
		t.Fatalf("Create() error = %v, want check number error", err)
	}
}

func TestUpdateStatusRequiresStatus(t *testing.T) {
	service := NewService(&repoStub{})
	_, err := service.UpdateStatus(context.Background(), uuid.New(), UpdateCheckStatusInput{Status: ""})
	if err == nil {
		t.Fatalf("UpdateStatus() expected error for empty status")
	}
}
