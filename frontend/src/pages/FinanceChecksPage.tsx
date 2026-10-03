import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatTRY, formatDate } from '../lib/money'
import { PageHeader } from '../components/ui/PageHeader'
import { MetricCard } from '../components/ui/Card'
import { DataTable, Column } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Tabs } from '../components/ui/Tabs'
import { Icons } from '../components/ui/Icons'
import { useToast } from '../components/ui/Toast'
import type { CheckItem, Customer, CashBankAccount } from '../types'

const statusLabels: Record<string, string> = {
  portfoyde: 'Portföyde (Bekliyor)',
  tahsil_edildi: 'Tahsil Edildi',
  odendi: 'Ödendi',
  karsiliksiz: 'Karşılıksız',
  iadeli: 'İade Edildi',
}

export const FinanceChecksPage: React.FC = () => {
  const [checks, setChecks] = useState<CheckItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [accounts, setAccounts] = useState<CashBankAccount[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('portfoyde')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedCheck, setSelectedCheck] = useState<CheckItem | null>(null)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { showToast } = useToast()

  const loadChecks = () => {
    setIsLoading(true)
    const st = activeTab === 'all' ? '' : activeTab
    api<CheckItem[]>(`/checks?status=${st}&search=${encodeURIComponent(search)}`)
      .then((data) => {
        setChecks(data)
        setError('')
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadChecks()
  }, [activeTab])

  useEffect(() => {
    api<Customer[]>('/customers').then(setCustomers).catch(() => {})
    api<CashBankAccount[]>('/finance/accounts').then(setAccounts).catch(() => {})
  }, [])

  const handleCreateCheck = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form)

    try {
      await api('/checks', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      showToast('Çek portföye eklendi ve cari borç hesabı güncellendi.')
      setIsNewModalOpen(false)
      loadChecks()
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCheckStatus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCheck) return
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form)

    try {
      await api(`/checks/${selectedCheck.id}/status`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      showToast('Çek durumu güncellendi.')
      setIsStatusModalOpen(false)
      setSelectedCheck(null)
      loadChecks()
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<CheckItem>[] = [
    {
      key: 'check_number',
      header: 'ÇEK NO & BANKA',
      sortable: true,
      render: (ch) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
            {ch.check_number}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {ch.bank_name} {ch.drawer ? `· Keşideci: ${ch.drawer}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'customer_name',
      header: 'MÜŞTERİ / CARİ',
      render: (ch) => (
        <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
          {ch.customer_name || 'Cari Belirtilmemiş'}
        </div>
      ),
    },
    {
      key: 'due_date',
      header: 'VADE TARİHİ',
      sortable: true,
      render: (ch) => (
        <div>
          <div style={{ fontWeight: 700 }}>{formatDate(ch.due_date)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Keşide: {formatDate(ch.issue_date)}
          </div>
        </div>
      ),
    },
    {
      key: 'check_type',
      header: 'ÇEK TÜRÜ',
      render: (ch) => (
        <Badge variant={ch.check_type === 'alacak' ? 'blue' : 'warning'}>
          {ch.check_type === 'alacak' ? 'Alacak Çeki' : 'Borç Çeki'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'DURUM',
      render: (ch) => (
        <Badge
          variant={
            ch.status === 'tahsil_edildi' || ch.status === 'odendi'
              ? 'success'
              : ch.status === 'karsiliksiz'
              ? 'danger'
              : 'warning'
          }
        >
          {statusLabels[ch.status] || ch.status}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'TUTAR',
      align: 'right',
      sortable: true,
      render: (ch) => (
        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
          {formatTRY(ch.amount)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'İŞLEM',
      align: 'right',
      render: (ch) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedCheck(ch)
            setIsStatusModalOpen(true)
          }}
        >
          Durum Değiştir
        </Button>
      ),
    },
  ]

  const totalPortfoy = checks
    .filter((c) => c.status === 'portfoyde')
    .reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0)

  return (
    <div>
      <PageHeader
        title="Çek İşlemleri Yönetimi"
        subtitle="Alınan müşteri çekleri, verilen borç çekleri ve tahsilat takibi."
        action={
          <Button icon={<Icons.Plus size={16} />} onClick={() => setIsNewModalOpen(true)}>
            + Yeni Çek Girişi
          </Button>
        }
      />

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <MetricCard
          title="PORTFÖYDEKİ ALACAK ÇEKLERİ"
          value={formatTRY(totalPortfoy.toString())}
          subtitle="Vadesi bekleyen çekler"
          tone="warning"
          icon={<Icons.Check size={20} />}
        />
      </div>

      <Tabs
        tabs={[
          { id: 'portfoyde', label: 'Portföydeki Çekler' },
          { id: 'tahsil_edildi', label: 'Tahsil Edilenler' },
          { id: 'all', label: 'Tüm Çek Kayıtları' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <DataTable
        columns={columns}
        data={checks}
        isLoading={isLoading}
        error={error}
        searchQuery={search}
        onSearchChange={(q) => {
          setSearch(q)
          loadChecks()
        }}
        searchPlaceholder="Çek no, banka veya müşteri adı ara..."
        emptyTitle="Henüz çek kaydı bulunmuyor"
        emptyDescription="Müşterilerden aldığınız çekleri veya verdiğiniz çekleri ekleyebilirsiniz."
        emptyAction={
          <Button icon={<Icons.Plus size={16} />} onClick={() => setIsNewModalOpen(true)}>
            + Çek Ekle
          </Button>
        }
      />

      {/* New Check Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Yeni Çek Girişi"
      >
        <form onSubmit={handleCreateCheck} className="quick-form">
          <Select label="Çek Türü" name="check_type" required>
            <option value="alacak">Alacak Çeki (Müşteriden Alınan)</option>
            <option value="borc">Borç Çeki (Verilen Çek)</option>
          </Select>

          <Select label="Müşteri / Cari" name="customer_id">
            <option value="">Müşteri Seçin (Opsiyonel)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </Select>

          <div className="grid-col-2">
            <Input label="Çek Numarası" name="check_number" required placeholder="0012345" />
            <Input label="Banka Adı" name="bank_name" placeholder="Garanti BBVA" />
          </div>

          <div className="grid-col-2">
            <Input label="Keşideci (Veren Kişi/Firma)" name="drawer" placeholder="Firma / Şahıs Unvanı" />
            <Input label="Çek Tutarı (₺)" name="amount" required inputMode="decimal" placeholder="10000.00" />
          </div>

          <div className="grid-col-2">
            <Input label="Keşide (Keşide Olma) Tarihi" type="date" name="issue_date" defaultValue={new Date().toISOString().split('T')[0]} required />
            <Input label="Vade Tarihi" type="date" name="due_date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>

          <Textarea label="Notlar" name="notes" placeholder="Ek notlar..." />

          <div className="modal-actions-right">
            <Button type="button" variant="ghost" onClick={() => setIsNewModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Çeki Kaydet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Status Modal */}
      {selectedCheck && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title={`Çek Durumunu Değiştir (${selectedCheck.check_number})`}
          subtitle={`Tutar: ${formatTRY(selectedCheck.amount)} · Vade: ${formatDate(selectedCheck.due_date)}`}
        >
          <form onSubmit={handleUpdateCheckStatus} className="quick-form">
            <Select label="Yeni Durum" name="status" defaultValue={selectedCheck.status} required>
              <option value="portfoyde">Portföyde (Bekliyor)</option>
              <option value="tahsil_edildi">Tahsil Edildi (Kasaya / Bankaya Yatırıldı)</option>
              <option value="odendi">Ödendi</option>
              <option value="karsiliksiz">Karşılıksız Çıktı</option>
              <option value="iadeli">İade Edildi</option>
            </Select>

            <Select label="Aktarılacak Kasa / Banka Hesabı" name="account_id">
              <option value="">Hesap Seçin (Tahsilat/Ödeme durumunda bakiyeye yansır)</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatTRY(a.balance)})
                </option>
              ))}
            </Select>

            <Textarea label="Açıklama / Not" name="notes" placeholder="Tahsilat dekont no vb..." />

            <div className="modal-actions-right">
              <Button type="button" variant="ghost" onClick={() => setIsStatusModalOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Durumu Güncelle
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
