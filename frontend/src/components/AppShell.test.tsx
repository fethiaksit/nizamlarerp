import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'
import { ToastProvider } from './ui/Toast'
import { AuthProvider } from '../context/AuthContext'

it('shows the primary ERP navigation', () => {
  render(
    <ToastProvider>
      <AuthProvider>
        <MemoryRouter>
          <AppShell>
            <p>İçerik</p>
          </AppShell>
        </MemoryRouter>
      </AuthProvider>
    </ToastProvider>
  )
  expect(screen.getByRole('link', { name: /Ana Sayfa/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Siparişler \/ İşler/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Cariler \/ Müşteriler/i })).toBeInTheDocument()
})

it('shows logout buttons and triggers logout', () => {
  render(
    <ToastProvider>
      <AuthProvider>
        <MemoryRouter>
          <AppShell>
            <p>İçerik</p>
          </AppShell>
        </MemoryRouter>
      </AuthProvider>
    </ToastProvider>
  )

  const logoutBtns = screen.getAllByRole('button', { name: /Çıkış Yap/i })
  expect(logoutBtns.length).toBeGreaterThan(0)

  // Clicking logout should work without throwing
  fireEvent.click(logoutBtns[0])
})
