package personnel

import (
	"time"

	"github.com/google/uuid"
)

type Personnel struct {
	ID            uuid.UUID        `json:"id"`
	FullName      string           `json:"full_name"`
	Title         string           `json:"title"`
	Phone         string           `json:"phone"`
	Email         string           `json:"email"`
	MonthlySalary string           `json:"monthly_salary"`
	StartDate     time.Time        `json:"start_date"`
	IsActive      bool             `json:"is_active"`
	Notes         string           `json:"notes"`
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`
	Payments      []PaymentHistory `json:"payments,omitempty"`
}

type PaymentHistory struct {
	ID          uuid.UUID  `json:"id"`
	PersonnelID uuid.UUID  `json:"personnel_id"`
	AccountID   *uuid.UUID `json:"account_id,omitempty"`
	AccountName string     `json:"account_name,omitempty"`
	PaymentType string     `json:"payment_type"` // 'maas', 'avans', 'prim'
	Amount      string     `json:"amount"`
	PaymentDate time.Time  `json:"payment_date"`
	Description string     `json:"description"`
	CreatedAt   time.Time  `json:"created_at"`
}

type CreatePersonnelInput struct {
	FullName      string `json:"full_name"`
	Title         string `json:"title"`
	Phone         string `json:"phone"`
	Email         string `json:"email"`
	MonthlySalary string `json:"monthly_salary"`
	StartDate     string `json:"start_date"`
	Notes         string `json:"notes"`
}

type CreatePaymentInput struct {
	PersonnelID uuid.UUID  `json:"personnel_id"`
	AccountID   *uuid.UUID `json:"account_id,omitempty"`
	PaymentType string     `json:"payment_type"`
	Amount      string     `json:"amount"`
	PaymentDate string     `json:"payment_date"`
	Description string     `json:"description"`
}
