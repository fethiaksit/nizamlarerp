import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatTRY, formatDate } from '../lib/money'
import { PageHeader } from '../components/ui/PageHeader'
import { MetricCard, Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge, jobStatusBadgeVariant } from '../components/ui/Badge'
import { Icons } from '../components/ui/Icons'
import { Skeleton } from '../components/ui/Skeleton'
import type { DashboardSummary, RecentActivity } from '../types'

const statusLabels: Record<string, string> = {
  yeni: 'Yeni',
  desen_hazirlaniyor: 'Desen Hazırlanıyor',
  onay_bekliyor: 'Onay Bekliyor',
  baskida: 'Baskıda',
  hazir: 'Hazır',
  teslim_edildi: 'Teslim Edildi',
  iptal_edildi: 'İptal Edildi',
  job_sale: 'İş Satışı',
  collection: 'Tahsilat',
  payment: 'Ödeme',
  received_check: 'Alınan Çek',
  issued_check: 'Verilen Çek',
  adjustment: 'Düzeltme',
  gelir: 'Gelir',
  gider: 'Gider',
}

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api<DashboardSummary>('/dashboard')
      .then(setSummary)
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Ana Sayfa" subtitle="Yönetici operasyonel kontrol paneli" />
        <div className="metrics-grid">
          <Skeleton height="110px" />
          <Skeleton height="110px" />
          <Skeleton height="110px" />
          <Skeleton height="110px" />
        </div>
        <Skeleton height="300px" />
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div>
        <PageHeader title="Ana Sayfa" />
        <div className="table-error-box">
          <Icons.Alert size={20} />
          <span>Dashboard verileri yüklenirken sorun oluştu: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <PageHeader
        title="Günaydın, Yönetici"
        subtitle="İşletmenizin anlık finansal ve üretim durumu."
        action={
          <Button icon={<Icons.Plus size={16} />} onClick={() => navigate('/jobs/new')}>
            Yeni Sipariş / İş Ekle
          </Button>
        }
      />

      {/* Primary Executive Metric Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="MÜŞTERİ ALACAKLARI"
          value={formatTRY(summary.receivable)}
          subtitle="Toplam açık cari alacak"
          tone="accent"
          icon={<Icons.Wallet size={20} />}
          onClick={() => navigate('/customers')}
        />
        <MetricCard
          title="KASA & BANKA BAKİYESİ"
          value={formatTRY(
            (parseFloat(summary.cash_balance) + parseFloat(summary.bank_balance)).toString()
          )}
          subtitle={`Kasa: ${formatTRY(summary.cash_balance)} · Banka: ${formatTRY(summary.bank_balance)}`}
          tone="success"
          icon={<Icons.Finance size={20} />}
          onClick={() => navigate('/finance/cash-bank')}
        />
        <MetricCard
          title="BU AYKİ GELİR"
          value={formatTRY(summary.monthly_income)}
          subtitle={`Gider: ${formatTRY(summary.monthly_expense)}`}
          tone="blue"
          icon={<Icons.TrendingUp size={20} />}
          onClick={() => navigate('/finance/transactions')}
        />
        <MetricCard
          title="PORTFÖYDEKİ ÇEKLER"
          value={formatTRY(summary.upcoming_checks)}
          subtitle="Vadesi yaklaşan alacak çekleri"
          tone="warning"
          icon={<Icons.Check size={20} />}
          onClick={() => navigate('/finance/checks')}
        />
      </div>

      {/* Operational Job Cards */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <MetricCard
          title="AKTİF İŞLER"
          value={summary.active_jobs}
          subtitle="Devam eden toplam iş"
          tone="accent"
          onClick={() => navigate('/jobs')}
        />
        <MetricCard
          title="BUGÜN TESLİM"
          value={summary.due_today}
          subtitle="Bugün teslim edilecek"
          tone="blue"
          onClick={() => navigate('/jobs?status=baskida')}
        />
        <MetricCard
          title="GECİKEN İŞLER"
          value={summary.overdue}
          subtitle="Teslim tarihi geçen"
          tone="danger"
          onClick={() => navigate('/jobs')}
        />
        <MetricCard
          title="TESLİME HAZIR"
          value={summary.ready}
          subtitle="Müşteriye teslime hazır"
          tone="success"
          onClick={() => navigate('/jobs?status=hazir')}
        />
      </div>

      {/* Recent Activity Table & Quick Shortcuts */}
      <div className="grid-col-2" style={{ alignItems: 'start', marginTop: '16px' }}>
        <Card>
          <CardHeader>
            <CardTitle>Son Hareketler & İşlemler</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/finance/transactions')}>
              Tümünü Gör
            </Button>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {summary.recent_activities && summary.recent_activities.length > 0 ? (
              <div className="table-responsive">
                <table className="data-table">
                  <tbody>
                    {summary.recent_activities.map((act) => (
                      <tr key={act.id} className="clickable-row">
                        <td style={{ width: '40px' }}>
                          {act.type === 'job' ? (
                            <Icons.Jobs size={18} style={{ color: 'var(--primary)' }} />
                          ) : (
                            <Icons.Finance size={18} style={{ color: '#10b981' }} />
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{act.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {act.subtitle} · {formatDate(act.transaction_date)}
                          </div>
                        </td>
                        <td>
                          {act.status && (
                            <Badge variant={jobStatusBadgeVariant(act.status)} size="sm">
                              {statusLabels[act.status] || act.status}
                            </Badge>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                          {formatTRY(act.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ padding: '20px', color: 'var(--text-muted)' }}>Henüz işlem kaydı bulunmuyor.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hızlı Kısayollar</CardTitle>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              to="/jobs/new"
              className="btn btn-outline"
              style={{ justifyContent: 'flex-start', padding: '14px 18px' }}
            >
              <Icons.Plus size={18} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontWeight: 700 }}>+ Yeni Müşteri Siparişi Aç</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Desen, kumaş ve miktar bilgisi girin.</div>
              </div>
            </Link>

            <Link
              to="/customers/new"
              className="btn btn-outline"
              style={{ justifyContent: 'flex-start', padding: '14px 18px' }}
            >
              <Icons.Customers size={18} style={{ color: '#0284c7' }} />
              <div>
                <div style={{ fontWeight: 700 }}>+ Yeni Müşteri / Cari Kaydet</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Firma adı ve vergi bilgilerini ekleyin.</div>
              </div>
            </Link>

            <Link
              to="/finance/payments"
              className="btn btn-outline"
              style={{ justifyContent: 'flex-start', padding: '14px 18px' }}
            >
              <Icons.Wallet size={18} style={{ color: '#16a34a' }} />
              <div>
                <div style={{ fontWeight: 700 }}>+ Tahsilat & Ödeme Girişi</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Müşteriden tahsilat al veya ödeme yap.</div>
              </div>
            </Link>

            <Link
              to="/finance/checks"
              className="btn btn-outline"
              style={{ justifyContent: 'flex-start', padding: '14px 18px' }}
            >
              <Icons.Check size={18} style={{ color: '#d97706' }} />
              <div>
                <div style={{ fontWeight: 700 }}>+ Alacak / Borç Çeki Ekle</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Müşteri çekini portföye kaydedin.</div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
