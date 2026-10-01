package dashboard

type Summary struct {
	ActiveJobs int    `json:"active_jobs"`
	DueToday   int    `json:"due_today"`
	Overdue    int    `json:"overdue"`
	Ready      int    `json:"ready"`
	Receivable string `json:"receivable"`
}
