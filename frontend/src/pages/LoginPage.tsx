import React, { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Icons } from '../components/ui/Icons'

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'
  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const cleanUsername = username.trim()
    if (!cleanUsername || !password) {
      setError('Lütfen kullanıcı adı ve şifrenizi girin.')
      return
    }

    setIsSubmitting(true)
    try {
      await login(cleanUsername, password)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || ''
      if (
        errorMsg.includes('401') ||
        errorMsg.includes('hatalı') ||
        errorMsg.includes('bulunamadı') ||
        errorMsg.includes('geçersiz')
      ) {
        setError('Kullanıcı adı veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.')
      } else if (errorMsg.includes('Sunucuya ulaşılamadı') || errorMsg.includes('Failed to fetch')) {
        setError('Giriş sunucusuna ulaşılamadı. Lütfen ağ bağlantınızı kontrol edin.')
      } else {
        setError('Giriş yapılamadı. Lütfen kullanıcı adı ve şifrenizi kontrol edin.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        {/* Brand header */}
        <div className="auth-brand">
          <div className="auth-logo-badge">N</div>
          <h1 className="auth-title">Nizamlar Tekstil</h1>
          <p className="auth-subtitle">Baskı ERP Yönetim Paneli</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="auth-error-banner" role="alert">
            <span className="auth-error-icon">
              <Icons.Alert size={18} />
            </span>
            <span className="auth-error-text">{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label htmlFor="username" className="auth-label">
              Kullanıcı Adı veya E-posta
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Icons.User size={18} />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                className="auth-input"
                placeholder="Örn: admin veya e-posta"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              Şifre
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Icons.Lock size={18} />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="auth-input with-toggle"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="auth-btn-spinner" />
                <span>Giriş Yapılıyor...</span>
              </>
            ) : (
              <span>Giriş Yap</span>
            )}
          </button>
        </form>

        <div className="auth-footer-note">
          <p>Yalnızca yetkili fabrika ve ofis personeli kullanımı içindir.</p>
        </div>
      </div>
    </div>
  )
}
