import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Icons } from './ui/Icons'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Input, Select } from './ui/Input'
import { useToast } from './ui/Toast'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Customer } from '../types'

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [financeMenuOpen, setFinanceMenuOpen] = useState(true)
  const [quickModalOpen, setQuickModalOpen] = useState(false)

  // Quick Action Form state
  const [quickType, setQuickType] = useState<'job' | 'collection' | 'expense'>('job')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    showToast('Başarıyla çıkış yapıldı.')
    navigate('/login')
  }

  const loadCustomers = async () => {
    try {
      const list = await api<Customer[]>('/customers')
      setCustomers(list)
    } catch {
      // ignore
    }
  }

  const handleOpenQuickModal = () => {
    loadCustomers()
    setQuickModalOpen(true)
  }

  const handleQuickSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form)

    try {
      if (quickType === 'job') {
        const job = await api<{ id: string }>('/jobs', {
          method: 'POST',
          body: JSON.stringify(data),
        })
        showToast('Yeni iş başarıyla kaydedildi.')
        setQuickModalOpen(false)
        navigate(`/jobs/${job.id}`)
      } else if (quickType === 'collection') {
        await api('/finance/transactions', {
          method: 'POST',
          body: JSON.stringify({
            customer_id: data.customer_id,
            entry_type: 'tahsilat',
            category: 'tahsilat',
            amount: data.amount,
            transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
            description: data.description || 'Hızlı Tahsilat Alındı',
          }),
        })
        showToast('Tahsilat kaydı başarıyla oluşturuldu.')
        setQuickModalOpen(false)
        navigate('/finance/payments')
      } else if (quickType === 'expense') {
        await api('/finance/transactions', {
          method: 'POST',
          body: JSON.stringify({
            entry_type: 'gider',
            category: data.category || 'genel',
            amount: data.amount,
            transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
            description: data.description,
          }),
        })
        showToast('Gider kaydı başarıyla oluşturuldu.')
        setQuickModalOpen(false)
        navigate('/finance/transactions')
      }
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFinanceActive = location.pathname.startsWith('/finance')

  return (
    <div className={`app-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className="mobile-backdrop" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar-v2 ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">N</div>
          {!isCollapsed && (
            <div className="brand-text">
              <span className="brand-title">Nizamlar</span>
              <span className="brand-subtitle">ERP YÖNETİMİ</span>
            </div>
          )}
          <button
            className="collapse-toggle desktop-only"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Genişlet' : 'Daralt'}
          >
            {isCollapsed ? <Icons.ChevronRight size={16} /> : <Icons.ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileOpen(false)}
          >
            <Icons.Dashboard size={18} />
            {!isCollapsed && <span>Ana Sayfa</span>}
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileOpen(false)}
          >
            <Icons.Customers size={18} />
            {!isCollapsed && <span>Cariler / Müşteriler</span>}
          </NavLink>

          <NavLink
            to="/jobs"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileOpen(false)}
          >
            <Icons.Jobs size={18} />
            {!isCollapsed && <span>Siparişler / İşler</span>}
          </NavLink>

          {/* Finans Group */}
          <div className="nav-group">
            <button
              className={`nav-item nav-group-header ${isFinanceActive ? 'active' : ''}`}
              onClick={() => setFinanceMenuOpen(!financeMenuOpen)}
            >
              <div className="nav-item-content">
                <Icons.Finance size={18} />
                {!isCollapsed && <span>Finans</span>}
              </div>
              {!isCollapsed && (
                <span className={`chevron ${financeMenuOpen ? 'open' : ''}`}>
                  <Icons.ChevronDown size={14} />
                </span>
              )}
            </button>

            {financeMenuOpen && !isCollapsed && (
              <div className="nav-sub-items">
                <NavLink
                  to="/finance/cash-bank"
                  className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span>Kasa & Banka</span>
                </NavLink>
                <NavLink
                  to="/finance/transactions"
                  className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span>Gelir & Giderler</span>
                </NavLink>
                <NavLink
                  to="/finance/payments"
                  className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span>Tahsilat & Ödemeler</span>
                </NavLink>
                <NavLink
                  to="/finance/checks"
                  className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span>Çek İşlemleri</span>
                </NavLink>
              </div>
            )}
          </div>

          <NavLink
            to="/personnel"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileOpen(false)}
          >
            <Icons.Personnel size={18} />
            {!isCollapsed && <span>Personel</span>}
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileOpen(false)}
          >
            <Icons.Reports size={18} />
            {!isCollapsed && <span>Raporlar</span>}
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileOpen(false)}
          >
            <Icons.Settings size={18} />
            {!isCollapsed && <span>Ayarlar</span>}
          </NavLink>
        </nav>

        {!isCollapsed && (
          <div className="sidebar-footer">
            <div className="user-badge">
              <div className="avatar">
                {user?.full_name ? user.full_name[0].toUpperCase() : (user?.username ? user.username[0].toUpperCase() : 'Y')}
              </div>
              <div className="user-info">
                <span className="user-name" title={user?.full_name || user?.username || 'Sistem Yöneticisi'}>
                  {user?.full_name || user?.username || 'Sistem Yöneticisi'}
                </span>
                <span className="user-role">{user?.role === 'admin' ? 'Yönetici' : (user?.role || 'Kullanıcı')}</span>
              </div>
              <button
                type="button"
                className="sidebar-logout-btn"
                onClick={handleLogout}
                title="Güvenli Çıkış Yap"
                aria-label="Çıkış Yap"
              >
                <Icons.LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <header className="top-navbar">
          <button
            className="mobile-menu-btn mobile-only"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            <Icons.Menu size={20} />
          </button>

          <div className="top-navbar-title">
            <span className="system-status-dot" />
            <span className="system-name">Nizamlar ERP Production System</span>
          </div>

          <div className="top-navbar-actions">
            <Button
              size="sm"
              icon={<Icons.Plus size={16} />}
              onClick={handleOpenQuickModal}
            >
              Hızlı İşlem
            </Button>
            <button
              type="button"
              className="navbar-logout-btn"
              onClick={handleLogout}
              title="Çıkış Yap"
              aria-label="Çıkış Yap"
            >
              <Icons.LogOut size={16} />
              <span className="desktop-only">Çıkış</span>
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="main-content">{children}</main>
      </div>

      {/* Quick Action Modal */}
      <Modal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        title="Hızlı İşlem Oluştur"
        subtitle="Müşteri siparişi, tahsilat veya gider kaydını hızlıca yapın."
      >
        <div className="quick-action-tabs">
          <button
            className={`quick-tab ${quickType === 'job' ? 'active' : ''}`}
            onClick={() => setQuickType('job')}
          >
            + Yeni Sipariş / İş
          </button>
          <button
            className={`quick-tab ${quickType === 'collection' ? 'active' : ''}`}
            onClick={() => setQuickType('collection')}
          >
            + Hızlı Tahsilat
          </button>
          <button
            className={`quick-tab ${quickType === 'expense' ? 'active' : ''}`}
            onClick={() => setQuickType('expense')}
          >
            + Yeni Gider
          </button>
        </div>

        <form onSubmit={handleQuickSubmit} className="quick-form">
          {quickType === 'job' && (
            <>
              <Select label="Müşteri" name="customer_id" required>
                <option value="">Müşteri Seçin</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </Select>
              <div className="grid-col-2">
                <Input label="İş Numarası" name="job_number" required placeholder="Örn: IS-2026-001" />
                <Input label="Desen Adı / Kodu" name="pattern_name" placeholder="Desen A1" />
              </div>
              <div className="grid-col-3">
                <Input label="Miktar" name="quantity" required inputMode="decimal" placeholder="1000" />
                <Select label="Birim" name="unit">
                  <option value="metre">Metre</option>
                  <option value="kg">Kg</option>
                  <option value="adet">Adet</option>
                </Select>
                <Input label="Birim Fiyat (₺)" name="unit_price" required inputMode="decimal" placeholder="25.50" />
              </div>
              <div className="grid-col-2">
                <Input label="Sipariş Tarihi" type="date" name="order_date" defaultValue={new Date().toISOString().split('T')[0]} required />
                <Input label="Teslim Tarihi" type="date" name="delivery_date" defaultValue={new Date().toISOString().split('T')[0]} required />
              </div>
            </>
          )}

          {quickType === 'collection' && (
            <>
              <Select label="Müşteri" name="customer_id" required>
                <option value="">Müşteri Seçin</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} (Bakiye: {c.open_balance} ₺)
                  </option>
                ))}
              </Select>
              <Input label="Tahsilat Tutarı (₺)" name="amount" required inputMode="decimal" placeholder="5000.00" />
              <Input label="İşlem Tarihi" type="date" name="transaction_date" defaultValue={new Date().toISOString().split('T')[0]} required />
              <Input label="Açıklama" name="description" placeholder="Nakit / Havale tahsilatı" />
            </>
          )}

          {quickType === 'expense' && (
            <>
              <Select label="Gider Kategorisi" name="category" required>
                <option value="hammadde">Baskı Boyası / Hammadde</option>
                <option value="kira">Kira & Ofis</option>
                <option value="fatura">Elektrik & Su & Fatura</option>
                <option value="maas">Personel & Maaş</option>
                <option value="yakit">Yakıt & Lojistik</option>
                <option value="diger">Diğer Giderler</option>
              </Select>
              <Input label="Gider Tutarı (₺)" name="amount" required inputMode="decimal" placeholder="1250.00" />
              <Input label="İşlem Tarihi" type="date" name="transaction_date" defaultValue={new Date().toISOString().split('T')[0]} required />
              <Input label="Açıklama" name="description" required placeholder="Fatura / Malzeme açıklaması" />
            </>
          )}

          <div className="modal-actions-right">
            <Button type="button" variant="ghost" onClick={() => setQuickModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
