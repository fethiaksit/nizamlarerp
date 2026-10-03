import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ToastProvider } from './components/ui/Toast'

import { DashboardPage } from './pages/DashboardPage'
import { CustomersPage } from './pages/CustomersPage'
import { CustomerDetailPage } from './pages/CustomerDetailPage'
import { JobsPage } from './pages/JobsPage'
import { JobFormPage } from './pages/JobFormPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { FinanceCashBankPage } from './pages/FinanceCashBankPage'
import { FinanceTransactionsPage } from './pages/FinanceTransactionsPage'
import { FinancePaymentsPage } from './pages/FinancePaymentsPage'
import { FinanceChecksPage } from './pages/FinanceChecksPage'
import { PersonnelPage } from './pages/PersonnelPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <ToastProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/new" element={<JobFormPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/finance/cash-bank" element={<FinanceCashBankPage />} />
          <Route path="/finance/transactions" element={<FinanceTransactionsPage />} />
          <Route path="/finance/payments" element={<FinancePaymentsPage />} />
          <Route path="/finance/checks" element={<FinanceChecksPage />} />
          <Route path="/personnel" element={<PersonnelPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </ToastProvider>
  )
}
