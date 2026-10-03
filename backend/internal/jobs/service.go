package jobs

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type Repository interface {
	Create(ctx context.Context, input CreateJobInput) (Job, error)
	Update(ctx context.Context, id uuid.UUID, input UpdateJobInput) (Job, error)
	List(ctx context.Context, filters Filters) ([]ListItem, error)
	FindByID(ctx context.Context, id uuid.UUID) (Job, error)
	ChangeStatus(ctx context.Context, id uuid.UUID, input ChangeStatusInput) (Job, error)
}

type Service struct{ repository Repository }

func NewService(repository Repository) *Service {
	return &Service{repository: repository}
}

func (service *Service) CreateJob(ctx context.Context, input CreateJobInput) (Job, error) {
	input = trimInput(input)

	if input.CustomerID == uuid.Nil {
		return Job{}, errors.New("Müşteri seçin.")
	}

	if input.JobNumber == "" {
		return Job{}, errors.New("İş numarası zorunludur.")
	}

	if input.Unit == "" {
		return Job{}, errors.New("Birim seçin.")
	}

	quantity, err := decimal.NewFromString(input.Quantity)
	if err != nil || !quantity.GreaterThan(decimal.Zero) {
		return Job{}, errors.New("Miktar sıfırdan büyük olmalıdır.")
	}

	unitPrice, err := decimal.NewFromString(input.UnitPrice)
	if err != nil || !unitPrice.GreaterThan(decimal.Zero) {
		return Job{}, errors.New("Birim fiyat sıfırdan büyük olmalıdır.")
	}

	if input.OrderDate == "" || input.DeliveryDate == "" {
		return Job{}, errors.New("Sipariş ve teslim tarihi zorunludur.")
	}

	orderDate, err := time.Parse("2006-01-02", input.OrderDate)
	if err != nil {
		return Job{}, errors.New("Geçerli sipariş tarihi girin.")
	}

	deliveryDate, err := time.Parse("2006-01-02", input.DeliveryDate)
	if err != nil {
		return Job{}, errors.New("Geçerli teslim tarihi girin.")
	}

	if deliveryDate.Before(orderDate) {
		return Job{}, errors.New("Teslim tarihi sipariş tarihinden önce olamaz.")
	}

	input.TotalAmount = quantity.Mul(unitPrice).Round(2).StringFixed(2)

	job, err := service.repository.Create(ctx, input)
	if errors.Is(err, ErrDuplicateJobNumber) {
		return Job{}, errors.New("Bu iş numarası zaten kullanılıyor.")
	}

	return job, err
}

func (service *Service) UpdateJob(ctx context.Context, id uuid.UUID, input UpdateJobInput) (Job, error) {
	input.JobNumber = strings.TrimSpace(input.JobNumber)
	input.PatternName = strings.TrimSpace(input.PatternName)
	input.PatternCode = strings.TrimSpace(input.PatternCode)
	input.PatternReference = strings.TrimSpace(input.PatternReference)
	input.FabricInfo = strings.TrimSpace(input.FabricInfo)
	input.PrintType = strings.TrimSpace(input.PrintType)
	input.ColorInfo = strings.TrimSpace(input.ColorInfo)
	input.Quantity = strings.TrimSpace(input.Quantity)
	input.Unit = strings.TrimSpace(input.Unit)
	input.UnitPrice = strings.TrimSpace(input.UnitPrice)
	input.OrderDate = strings.TrimSpace(input.OrderDate)
	input.DeliveryDate = strings.TrimSpace(input.DeliveryDate)
	input.Notes = strings.TrimSpace(input.Notes)

	if input.JobNumber == "" {
		return Job{}, errors.New("İş numarası zorunludur.")
	}

	quantity, err := decimal.NewFromString(input.Quantity)
	if err != nil || !quantity.GreaterThan(decimal.Zero) {
		return Job{}, errors.New("Miktar sıfırdan büyük olmalıdır.")
	}

	unitPrice, err := decimal.NewFromString(input.UnitPrice)
	if err != nil || !unitPrice.GreaterThan(decimal.Zero) {
		return Job{}, errors.New("Birim fiyat sıfırdan büyük olmalıdır.")
	}

	orderDate, err := time.Parse("2006-01-02", input.OrderDate)
	if err != nil {
		return Job{}, errors.New("Geçerli sipariş tarihi girin.")
	}

	deliveryDate, err := time.Parse("2006-01-02", input.DeliveryDate)
	if err != nil {
		return Job{}, errors.New("Geçerli teslim tarihi girin.")
	}

	if deliveryDate.Before(orderDate) {
		return Job{}, errors.New("Teslim tarihi sipariş tarihinden önce olamaz.")
	}

	input.TotalAmount = quantity.Mul(unitPrice).Round(2).StringFixed(2)

	job, err := service.repository.Update(ctx, id, input)
	if errors.Is(err, ErrDuplicateJobNumber) {
		return Job{}, errors.New("Bu iş numarası zaten kullanılıyor.")
	}

	return job, err
}

func (service *Service) ListJobs(ctx context.Context, filters Filters) ([]ListItem, error) {
	filters.Search = strings.TrimSpace(filters.Search)
	filters.Status = strings.TrimSpace(filters.Status)
	filters.CustomerID = strings.TrimSpace(filters.CustomerID)
	return service.repository.List(ctx, filters)
}

func (service *Service) GetJob(ctx context.Context, id uuid.UUID) (Job, error) {
	return service.repository.FindByID(ctx, id)
}

func (service *Service) ChangeStatus(ctx context.Context, id uuid.UUID, input ChangeStatusInput) (Job, error) {
	input.Status = strings.TrimSpace(input.Status)
	input.Note = strings.TrimSpace(input.Note)

	if !IsValidStatus(input.Status) {
		return Job{}, errors.New("Geçerli bir iş durumu seçin.")
	}

	return service.repository.ChangeStatus(ctx, id, input)
}

func trimInput(input CreateJobInput) CreateJobInput {
	input.JobNumber = strings.TrimSpace(input.JobNumber)
	input.PatternName = strings.TrimSpace(input.PatternName)
	input.PatternCode = strings.TrimSpace(input.PatternCode)
	input.PatternReference = strings.TrimSpace(input.PatternReference)
	input.FabricInfo = strings.TrimSpace(input.FabricInfo)
	input.PrintType = strings.TrimSpace(input.PrintType)
	input.ColorInfo = strings.TrimSpace(input.ColorInfo)
	input.Quantity = strings.TrimSpace(input.Quantity)
	input.Unit = strings.TrimSpace(input.Unit)
	input.UnitPrice = strings.TrimSpace(input.UnitPrice)
	input.OrderDate = strings.TrimSpace(input.OrderDate)
	input.DeliveryDate = strings.TrimSpace(input.DeliveryDate)
	input.Notes = strings.TrimSpace(input.Notes)

	return input
}
