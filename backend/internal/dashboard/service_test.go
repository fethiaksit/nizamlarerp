package dashboard

import (
	"context"
	"testing"
	"time"
)

type repositoryStub struct{ summary Summary }

func (stub repositoryStub) Get(context.Context, time.Time) (Summary, error) { return stub.summary, nil }

func TestGetDashboardReturnsJobAndReceivableMetrics(t *testing.T) {
	service := NewService(repositoryStub{summary: Summary{ActiveJobs: 4, DueToday: 2, Overdue: 1, Ready: 3, Receivable: "184500.00"}})
	summary, err := service.GetDashboard(context.Background(), time.Date(2026, 10, 2, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("GetDashboard() error = %v", err)
	}
	if summary.Overdue != 1 || summary.Receivable != "184500.00" {
		t.Fatalf("summary = %+v", summary)
	}
}
