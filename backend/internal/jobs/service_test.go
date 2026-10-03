package jobs

import (
	"context"
	"testing"

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

func (stub *repositoryStub) Update(_ context.Context, _ uuid.UUID, _ UpdateJobInput) (Job, error) {
	return stub.job, nil
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
		t.Fatalf("CreateJob() error = %v", err)
	}
}

func TestCreateJobCalculatesTotalAmountBeforeSaving(t *testing.T) {
	repository := &repositoryStub{}
	service := NewService(repository)

	_, err := service.CreateJob(context.Background(), validCreateJobInput("100.5", "12.50"))

	if err != nil {
		t.Fatalf("CreateJob() error = %v", err)
	}
	if repository.createdInput.TotalAmount != "1256.25" {
		t.Fatalf("TotalAmount = %q, want 1256.25", repository.createdInput.TotalAmount)
	}
}

func TestCreateJobRejectsDeliveryBeforeOrderDate(t *testing.T) {
	repository := &repositoryStub{}
	service := NewService(repository)
	input := validCreateJobInput("100", "12.50")
	input.OrderDate = "2026-10-10"
	input.DeliveryDate = "2026-10-09"

	_, err := service.CreateJob(context.Background(), input)

	if err == nil || err.Error() != "Teslim tarihi sipariş tarihinden önce olamaz." {
		t.Fatalf("CreateJob() error = %v, want date order error", err)
	}
}

func TestChangeStatusRejectsInvalidStatus(t *testing.T) {
	service := NewService(&repositoryStub{})

	_, err := service.ChangeStatus(context.Background(), uuid.New(), ChangeStatusInput{Status: "gecersiz"})

	if err == nil || err.Error() != "Geçerli bir iş durumu seçin." {
		t.Fatalf("ChangeStatus() error = %v", err)
	}
}

func validCreateJobInput(quantity, unitPrice string) CreateJobInput {
	return CreateJobInput{
		CustomerID:   uuid.New(),
		JobNumber:    "IS-001",
		Unit:         "metre",
		Quantity:     quantity,
		UnitPrice:    unitPrice,
		OrderDate:    "2026-10-02",
		DeliveryDate: "2026-10-05",
	}
}
