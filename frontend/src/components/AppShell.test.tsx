import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { AppShell } from './AppShell'
import { ToastProvider } from './ui/Toast'

it('shows the primary ERP navigation', () => {
  render(
    <ToastProvider>
      <MemoryRouter>
        <AppShell>
          <p>İçerik</p>
        </AppShell>
      </MemoryRouter>
    </ToastProvider>
  )
  expect(screen.getByRole('link', { name: /Ana Sayfa/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Siparişler \/ İşler/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Cariler \/ Müşteriler/i })).toBeInTheDocument()
})
