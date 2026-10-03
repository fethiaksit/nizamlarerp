package reports

import (
	"context"
	"testing"
)

type repoStub struct{}

func (s *repoStub) CustomerBalanceReport(context.Context) ([]CustomerReportItem, error) {
	return []CustomerReportItem{{CompanyName: "ABC Tekstil"}}, nil
}
func (s *repoStub) FinancialSummaryReport(context.Context) (FinancialSummaryReport, error) {
	return FinancialSummaryReport{TotalIncome: "100.00"}, nil
}
func (s *repoStub) ProductionSummaryReport(context.Context) ([]ProductionReportItem, error) {
	return []ProductionReportItem{{Status: "yeni", Count: 5}}, nil
}

func TestCustomerBalanceReport(t *testing.T) {
	service := NewService(&repoStub{})
	items, err := service.CustomerBalanceReport(context.Background())
	if err != nil || len(items) != 1 {
		t.Fatalf("CustomerBalanceReport() failed")
	}
}
