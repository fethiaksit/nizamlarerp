package jobs

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
)

type repositoryStub struct {
	createdInput CreateJobInput
	createErr    error
	job          Job
}

func (stub *repositoryStub) Create(_ context.Context, input CreateJobInput) (Job, error) {
	stub.createdInput = input
	return stub.job, stub.createErr
}

func (stub *repositoryStub) List(context.Context, Filters) ([]ListItem, error) { return nil, nil }
func (stub *repositoryStub) FindByID(context.Context, uuid.UUID) (Job, error)  { return stub.job, nil }
func (stub *repositoryStub) ChangeStatus(context.Context, uuid.UUID, ChangeStatusInput) (Job, error) {
	return stub.job, nil
}

func TestCreateJobRejectsNonPositiveQuantity(t *testing.T) {
	service := NewService(&repositoryStub{})

	_, err := service.CreateJob(context.Background(), validCreateJobInput("0", "12.50"))

	if err == nil || err.Error() != "Miktar sıfırdan büyük olmalıdır." {
		t.Fatalf("CreateJob() error = %v, want quantity validation", err)
	}
}

func TestCreateJobRejectsNonPositiveUnitPrice(t *testing.T) {
	service := NewService(&repositoryStub{})

	_, err := service.CreateJob(context.Background(), validCreateJobInput("10", "0"))

	if err == nil || err.Error() != "Birim fiyat sıfırdan büyük olmalıdır." {
		t.Fatalf("CreateJob() error = %v, want unit price validation", err)
	}
}

func TestCreateJobCalculatesExactDecimalTotal(t *testing.T) {
	repository := &repositoryStub{job: Job{ID: uuid.New(), JobNumber: "IS-001"}}
	service := NewService(repository)

	_, err := service.CreateJob(context.Background(), validCreateJobInput("12.5", "19.99"))

	if err != nil {
		t.Fatalf("CreateJob() error = %v", err)
	}
	if repository.createdInput.TotalAmount != "249.88" {
		t.Fatalf("TotalAmount = %q, want 249.88", repository.createdInput.TotalAmount)
	}
}

func TestChangeStatusRejectsUnknownStatus(t *testing.T) {
	service := NewService(&repositoryStub{})

	_, err := service.ChangeStatus(context.Background(), uuid.New(), ChangeStatusInput{Status: "bilinmiyor"})

	if err == nil || err.Error() != "Geçerli bir iş durumu seçin." {
		t.Fatalf("ChangeStatus() error = %v, want status validation", err)
	}
}

func validCreateJobInput(quantity, unitPrice string) CreateJobInput {
	return CreateJobInput{
		CustomerID:   uuid.New(),
		JobNumber:    "IS-001",
		PatternName:  "Lale",
		Quantity:     quantity,
		Unit:         "metre",
		UnitPrice:    unitPrice,
		OrderDate:    time.Date(2026, 10, 2, 0, 0, 0, 0, time.UTC),
		DeliveryDate: time.Date(2026, 10, 10, 0, 0, 0, 0, time.UTC),
	}
}
