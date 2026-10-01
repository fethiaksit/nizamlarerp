import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { CustomerDetailPage, CustomerFormPage, CustomersPage, DashboardPage, JobDetailPage, JobFormPage, JobsPage } from './pages'

export default function App() { return <AppShell><Routes><Route path="/" element={<DashboardPage/>}/><Route path="/customers" element={<CustomersPage/>}/><Route path="/customers/new" element={<CustomerFormPage/>}/><Route path="/customers/:id" element={<CustomerDetailPage/>}/><Route path="/jobs" element={<JobsPage/>}/><Route path="/jobs/new" element={<JobFormPage/>}/><Route path="/jobs/:id" element={<JobDetailPage/>}/></Routes></AppShell> }
