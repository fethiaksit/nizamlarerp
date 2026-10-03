import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatTRY } from '../lib/money'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent, MetricCard } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Tabs } from '../components/ui/Tabs'
import { Icons } from '../components/ui/Icons'
import type { CustomerReportItem, FinancialSummaryReport, ProductionReportItem } from '../types'

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('customers')
  const [customerReports, setCustomerReports] = useState<CustomerReportItem[]>([])
  const [financialReport, setFinancialReport] = useState<FinancialSummaryReport | null>(null)
  const [productionReports, setProductionReports] = useState<ProductionReportItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      api<CustomerReportItem[]>('/reports/customer-balance').catch(() => []),
      api<FinancialSummaryReport>('/reports/financial-summary').catch(() => null),
      api<ProductionReportItem[]>('/reports/production-summary').catch(() => []),
    ]).then(([cust, fin, prod]) => {
      setCustomerReports(cust)
      setFinancialReport(fin)
      setProductionReports(prod)
      setIsLoading(false)
    })
  }, [])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div>
      <PageHeader
        title="Raporlar ve Analizler"
        subtitle="İşletme finansal durum, cari bakiye ekstreleri ve üretim analizleri."
        action={
          <Button variant="outline" icon={<Icons.Download size={16} />} onClick={handlePrint}>
            Yazdır / PDF İndir
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: 'customers', label: 'Cari Bakiye Raporu' },
          { id: 'financial', label: 'Finansal Genel Özet' },
          { id: 'production', label: 'Üretim ve Sipariş Analizi' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'customers' && (
        <Card>
          <CardHeader>
            <CardTitle>Müşteri / Cari Hesap Ekstre Özeti</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>FİRMA UNVANI</th>
                    <th>TELEFON</th>
                    <th style={{ textAlign: 'right' }}>TOPLAM BORÇLANDIRMA</th>
                    <th style={{ textAlign: 'right' }}>TOPLAM TAHSİLAT</th>
                    <th style={{ textAlign: 'right' }}>GÜNCEL AÇIK BAKİYE</th>
                  </tr>
                </thead>
                <tbody>
                  {customerReports.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700 }}>{r.company_name}</td>
                      <td>{r.phone || '-'}</td>
                      <td style={{ textAlign: 'right', color: '#b91c1c' }}>{formatTRY(r.total_debit)}</td>
                      <td style={{ textAlign: 'right', color: '#15803d' }}>{formatTRY(r.total_credit)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }}>
                        {formatTRY(r.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'financial' && financialReport && (
        <div>
          <div className="metrics-grid">
            <MetricCard
              title="TOPLAM GELİR / TAHSİLAT"
              value={formatTRY(financialReport.total_income)}
              tone="success"
            />
            <MetricCard
              title="TOPLAM GİDER / ÖDEME"
              value={formatTRY(financialReport.total_expense)}
              tone="danger"
            />
            <MetricCard
              title="TOPLAM KASA & BANKA VARLIĞI"
              value={formatTRY(financialReport.total_assets)}
              tone="blue"
            />
            <MetricCard
              title="TOPLAM MÜŞTERİ ALACAKLARI"
              value={formatTRY(financialReport.receivables)}
              tone="accent"
            />
          </div>
        </div>
      )}

      {activeTab === 'production' && (
        <Card>
          <CardHeader>
            <CardTitle>Durumlara Göre Üretim & Sipariş Dağılımı</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ÜRETİM ADIMI / DURUM</th>
                    <th>SİPARİŞ ADEDİ</th>
                    <th style={{ textAlign: 'right' }}>TOPLAM PARASAL TUTAR</th>
                  </tr>
                </thead>
                <tbody>
                  {productionReports.map((p) => (
                    <tr key={p.status}>
                      <td style={{ fontWeight: 700 }}>{p.status_label}</td>
                      <td>{p.count} adet sipariş</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                        {formatTRY(p.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
