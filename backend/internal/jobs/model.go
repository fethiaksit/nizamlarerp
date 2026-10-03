package jobs

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrDuplicateJobNumber = errors.New("duplicate job number")
	ErrNotFound           = errors.New("job not found")
)

const (
	StatusNew              = "yeni"
	StatusPatternPreparing = "desen_hazirlaniyor"
	StatusAwaitingApproval = "onay_bekliyor"
	StatusPrinting         = "baskida"
	StatusReady            = "hazir"
	StatusDelivered        = "teslim_edildi"
	StatusCancelled        = "iptal_edildi"
)

type StatusHistoryItem struct {
	ID             uuid.UUID `json:"id"`
	JobID          uuid.UUID `json:"job_id"`
	PreviousStatus *string   `json:"previous_status"`
	NewStatus      string    `json:"new_status"`
	Note           string    `json:"note"`
	CreatedAt      time.Time `json:"created_at"`
}

type Job struct {
	ID               uuid.UUID           `json:"id"`
	CustomerID       uuid.UUID           `json:"customer_id"`
	CustomerName     string              `json:"customer_name,omitempty"`
	JobNumber        string              `json:"job_number"`
	PatternName      string              `json:"pattern_name"`
	PatternCode      string              `json:"pattern_code"`
	PatternReference string              `json:"pattern_reference"`
	FabricInfo       string              `json:"fabric_info"`
	PrintType        string              `json:"print_type"`
	ColorInfo        string              `json:"color_info"`
	Quantity         string              `json:"quantity"`
	Unit             string              `json:"unit"`
	UnitPrice        string              `json:"unit_price"`
	TotalAmount      string              `json:"total_amount"`
	OrderDate        time.Time           `json:"order_date"`
	DeliveryDate     time.Time           `json:"delivery_date"`
	Status           string              `json:"status"`
	Notes            string              `json:"notes"`
	CreatedAt        time.Time           `json:"created_at"`
	UpdatedAt        time.Time           `json:"updated_at"`
	StatusHistory    []StatusHistoryItem `json:"status_history,omitempty"`
}

type CreateJobInput struct {
	CustomerID       uuid.UUID `json:"customer_id"`
	JobNumber        string    `json:"job_number"`
	PatternName      string    `json:"pattern_name"`
	PatternCode      string    `json:"pattern_code"`
	PatternReference string    `json:"pattern_reference"`
	FabricInfo       string    `json:"fabric_info"`
	PrintType        string    `json:"print_type"`
	ColorInfo        string    `json:"color_info"`
	Quantity         string    `json:"quantity"`
	Unit             string    `json:"unit"`
	UnitPrice        string    `json:"unit_price"`
	TotalAmount      string    `json:"-"`
	OrderDate        string    `json:"order_date"`
	DeliveryDate     string    `json:"delivery_date"`
	Notes            string    `json:"notes"`
}

type UpdateJobInput struct {
	JobNumber        string `json:"job_number"`
	PatternName      string `json:"pattern_name"`
	PatternCode      string `json:"pattern_code"`
	PatternReference string `json:"pattern_reference"`
	FabricInfo       string `json:"fabric_info"`
	PrintType        string `json:"print_type"`
	ColorInfo        string `json:"color_info"`
	Quantity         string `json:"quantity"`
	Unit             string `json:"unit"`
	UnitPrice        string `json:"unit_price"`
	TotalAmount      string `json:"-"`
	OrderDate        string `json:"order_date"`
	DeliveryDate     string `json:"delivery_date"`
	Notes            string `json:"notes"`
}

type ChangeStatusInput struct {
	Status string `json:"status"`
	Note   string `json:"note"`
}

type Filters struct {
	Search     string
	Status     string
	CustomerID string
}

type ListItem struct {
	Job
	CustomerName string `json:"customer_name"`
}

func IsValidStatus(status string) bool {
	switch status {
	case StatusNew, StatusPatternPreparing, StatusAwaitingApproval, StatusPrinting, StatusReady, StatusDelivered, StatusCancelled:
		return true
	default:
		return false
	}
}
