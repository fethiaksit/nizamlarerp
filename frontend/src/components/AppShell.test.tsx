import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { AppShell } from './AppShell'

it('shows the primary ERP navigation', () => {
  render(<MemoryRouter><AppShell><p>İçerik</p></AppShell></MemoryRouter>)
  expect(screen.getByRole('link', { name: 'Ana Sayfa' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'İşler' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Müşteriler' })).toBeInTheDocument()
})
