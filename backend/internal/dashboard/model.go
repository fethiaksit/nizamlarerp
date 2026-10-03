package dashboard

import "time"

type RecentActivity struct {
	ID              string    `json:"id"`
	Type            string    `json:"type"` // 'job', 'transaction'
	Title           string    `json:"title"`
	Subtitle        string    `json:"subtitle"`
	Amount          string    `json:"amount"`
	Status          string    `json:"status,omitempty"`
	TransactionDate time.Time `json:"transaction_date"`
}

type Summary struct {
	ActiveJobs         int              `json:"active_jobs"`
	DueToday           int              `json:"due_today"`
	Overdue            int              `json:"overdue"`
	Ready              int              `json:"ready"`
	Receivable         string           `json:"receivable"`
	Payable            string           `json:"payable"`
	CashBalance        string           `json:"cash_balance"`
	BankBalance        string           `json:"bank_balance"`
	MonthlyIncome      string           `json:"monthly_income"`
	MonthlyExpense     string           `json:"monthly_expense"`
	UpcomingChecks     string           `json:"upcoming_checks"`
	ActiveCustomers    int              `json:"active_customers"`
	RecentActivities   []RecentActivity `json:"recent_activities"`
}
