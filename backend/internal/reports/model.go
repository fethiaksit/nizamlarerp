package reports

type CustomerReportItem struct {
	ID          string `json:"id"`
	CompanyName string `json:"company_name"`
	Phone       string `json:"phone"`
	TotalDebit  string `json:"total_debit"`
	TotalCredit string `json:"total_credit"`
	Balance     string `json:"balance"`
}

type FinancialSummaryReport struct {
	TotalIncome  string `json:"total_income"`
	TotalExpense string `json:"total_expense"`
	NetProfit    string `json:"net_profit"`
	TotalAssets  string `json:"total_assets"`
	Receivables  string `json:"receivables"`
}

type ProductionReportItem struct {
	Status      string `json:"status"`
	StatusLabel string `json:"status_label"`
	Count       int    `json:"count"`
	TotalAmount string `json:"total_amount"`
}
