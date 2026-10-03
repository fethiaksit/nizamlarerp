package reports

import "context"

type Service struct{ repo Repository }

func NewService(repo Repository) *Service { return &Service{repo: repo} }

func (s *Service) CustomerBalanceReport(ctx context.Context) ([]CustomerReportItem, error) {
	return s.repo.CustomerBalanceReport(ctx)
}

func (s *Service) FinancialSummaryReport(ctx context.Context) (FinancialSummaryReport, error) {
	return s.repo.FinancialSummaryReport(ctx)
}

func (s *Service) ProductionSummaryReport(ctx context.Context) ([]ProductionReportItem, error) {
	return s.repo.ProductionSummaryReport(ctx)
}
