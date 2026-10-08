import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProtectedRoute } from './ProtectedRoute'
import { AuthProvider } from '../context/AuthContext'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch.mockReset()
  })

  it('redirects unauthenticated user to /login', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<div>Login Ekranı</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Korumalı Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Login Ekranı')).toBeInTheDocument()
    })
    expect(screen.queryByText('Korumalı Dashboard')).not.toBeInTheDocument()
  })

  it('renders protected content when user has valid token in storage', async () => {
    localStorage.setItem('nizamlar_erp_token', 'saved-test-token')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'u-1',
        username: 'admin',
        email: 'admin@nizamlar.com',
        full_name: 'Sistem Yöneticisi',
        role: 'admin',
      }),
    })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<div>Login Ekranı</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Korumalı Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Korumalı Dashboard')).toBeInTheDocument()
    })
  })
})
