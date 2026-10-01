package dashboard

import (
	"context"
	"time"
)

type Repository interface {
	Get(context.Context, time.Time) (Summary, error)
}
type Service struct{ repository Repository }

func NewService(repository Repository) *Service { return &Service{repository: repository} }
func (service *Service) GetDashboard(ctx context.Context, today time.Time) (Summary, error) {
	return service.repository.Get(ctx, today)
}
