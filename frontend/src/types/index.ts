export interface DashboardSummary {
  active_jobs: number
  due_today: number
  overdue: number
  ready: number
  receivable: string
  payable: string
  cash_balance: string
  bank_balance: string
  monthly_income: string
  monthly_expense: string
  upcoming_checks: string
  active_customers: number
  recent_activities?: RecentActivity[]
}

export interface RecentActivity {
  id: string
  type: 'job' | 'transaction'
  title: string
  subtitle: string
  amount: string
  status?: string
  transaction_date: string
}

export interface Customer {
  id: string
  company_name: string
  contact_name: string
  phone: string
  address: string
  tax_office: string
  tax_number: string
  notes: string
  is_active: boolean
  open_balance: string
  created_at: string
  updated_at: string
  transactions?: CustomerTransaction[]
}

export interface CustomerTransaction {
  id: string
  customer_id: string
  job_id?: string
  entry_type: 'job_sale' | 'collection' | 'payment' | 'received_check' | 'issued_check' | 'adjustment'
  direction: 'debit' | 'credit'
  amount: string
  currency: string
  transaction_date: string
  description: string
  created_at: string
}

export interface JobStatusHistory {
  id: string
  job_id: string
  previous_status?: string
  new_status: string
  note: string
  created_at: string
}

export interface Job {
  id: string
  customer_id: string
  customer_name?: string
  job_number: string
  pattern_name: string
  pattern_code: string
  pattern_reference: string
  fabric_info: string
  print_type: string
  color_info: string
  quantity: string
  unit: string
  unit_price: string
  total_amount: string
  order_date: string
  delivery_date: string
  status: 'yeni' | 'desen_hazirlaniyor' | 'onay_bekliyor' | 'baskida' | 'hazir' | 'teslim_edildi' | 'iptal_edildi'
  notes: string
  created_at: string
  updated_at: string
  status_history?: JobStatusHistory[]
}

export interface CashBankAccount {
  id: string
  name: string
  account_type: 'kasa' | 'banka'
  bank_name: string
  iban: string
  currency: string
  balance: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FinanceTransaction {
  id: string
  account_id?: string
  account_name?: string
  customer_id?: string
  customer_name?: string
  entry_type: 'gelir' | 'gider' | 'tahsilat' | 'odeme'
  category: string
  amount: string
  currency: string
  transaction_date: string
  description: string
  created_at: string
}

export interface CheckItem {
  id: string
  customer_id?: string
  customer_name?: string
  check_number: string
  bank_name: string
  drawer: string
  amount: string
  currency: string
  issue_date: string
  due_date: string
  check_type: 'alacak' | 'borc'
  status: 'portfoyde' | 'tahsil_edildi' | 'odendi' | 'karsiliksiz' | 'iadeli'
  notes: string
  created_at: string
  updated_at: string
}

export interface Personnel {
  id: string
  full_name: string
  title: string
  phone: string
  email: string
  monthly_salary: string
  start_date: string
  is_active: boolean
  notes: string
  created_at: string
  updated_at: string
  payments?: PersonnelPayment[]
}

export interface PersonnelPayment {
  id: string
  personnel_id: string
  account_id?: string
  account_name?: string
  payment_type: 'maas' | 'avans' | 'prim'
  amount: string
  payment_date: string
  description: string
  created_at: string
}

export interface CustomerReportItem {
  id: string
  company_name: string
  phone: string
  total_debit: string
  total_credit: string
  balance: string
}

export interface FinancialSummaryReport {
  total_income: string
  total_expense: string
  net_profit: string
  total_assets: string
  receivables: string
}

export interface ProductionReportItem {
  status: string
  status_label: string
  count: number
  total_amount: string
}

export interface CompanySettings {
  id: number
  company_title: string
  phone: string
  email: string
  address: string
  tax_office: string
  tax_number: string
  currency: string
  updated_at: string
}

export interface User {
  id: string
  username: string
  email: string
  full_name: string
  role: string
}

export interface LoginResponse {
  token: string
  user: User
}

