import type { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'

export function AppShell({ children }: PropsWithChildren) {
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">N</span><span>Nizamlar <b>ERP</b></span></div>
      <nav><NavLink to="/">Ana Sayfa</NavLink><NavLink to="/jobs">İşler</NavLink><NavLink to="/customers">Müşteriler</NavLink></nav>
      <p className="sidebar-note">Tekstil baskı yönetimi</p>
    </aside>
    <main>{children}</main>
  </div>
}
