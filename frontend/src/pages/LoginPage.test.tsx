import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginPage } from './LoginPage'
import { AuthProvider } from '../context/AuthContext'

// Mock fetch globally
const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch.mockReset()
  })

  it('renders login form elements with Turkish labels and placeholders', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    expect(screen.getByText('Nizamlar Tekstil')).toBeInTheDocument()
    expect(screen.getByText('Baskı ERP Yönetim Paneli')).toBeInTheDocument()
    expect(screen.getByLabelText(/Kullanıcı Adı veya E-posta/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Şifre$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Giriş Yap/i })).toBeInTheDocument()
  })

  it('shows Turkish error message when submitting empty fields', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Giriş Yap/i }))

    expect(
      await screen.findByText('Lütfen kullanıcı adı ve şifrenizi girin.')
    ).toBeInTheDocument()
  })

  it('toggles password visibility when clicking eye button', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    const passwordInput = screen.getByLabelText(/^Şifre$/i) as HTMLInputElement
    expect(passwordInput.type).toBe('password')

    const toggleBtn = screen.getByLabelText(/Şifreyi göster/i)
    fireEvent.click(toggleBtn)

    expect(passwordInput.type).toBe('text')

    const hideBtn = screen.getByLabelText(/Şifreyi gizle/i)
    fireEvent.click(hideBtn)
    expect(passwordInput.type).toBe('password')
  })

  it('shows friendly Turkish error message on invalid credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Kullanıcı adı veya şifre hatalı.' }),
    })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    fireEvent.change(screen.getByLabelText(/Kullanıcı Adı veya E-posta/i), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByLabelText(/^Şifre$/i), {
      target: { value: 'yanlis_sifre' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Giriş Yap/i }))

    expect(
      await screen.findByText('Kullanıcı adı veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.')
    ).toBeInTheDocument()
  })

  it('successfully logs in and stores token on valid credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        token: 'valid-jwt-token-123',
        user: {
          id: 'user-1',
          username: 'admin',
          email: 'admin@nizamlar.com',
          full_name: 'Sistem Yöneticisi',
          role: 'admin',
        },
      }),
    })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>Ana Sayfa Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    fireEvent.change(screen.getByLabelText(/Kullanıcı Adı veya E-posta/i), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByLabelText(/^Şifre$/i), {
      target: { value: 'dogru_sifre' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Giriş Yap/i }))

    await waitFor(() => {
      expect(screen.getByText('Ana Sayfa Dashboard')).toBeInTheDocument()
    })

    expect(localStorage.getItem('nizamlar_erp_token')).toBe('valid-jwt-token-123')
  })
})
