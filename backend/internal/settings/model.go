package settings

import "time"

type CompanySettings struct {
	ID           int       `json:"id"`
	CompanyTitle string    `json:"company_title"`
	Phone        string    `json:"phone"`
	Email        string    `json:"email"`
	Address      string    `json:"address"`
	TaxOffice    string    `json:"tax_office"`
	TaxNumber    string    `json:"tax_number"`
	Currency     string    `json:"currency"`
	UpdatedAt    time.Time `json:"updated_at"`
}
