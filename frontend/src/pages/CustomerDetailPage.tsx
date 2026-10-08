import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatTRY, formatDate } from '../lib/money'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent, MetricCard } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge, jobStatusBadgeVariant } from '../components/ui/Badge'
import { DataTable, Column } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Tabs } from '../components/ui/Tabs'
import { Icons } from '../components/ui/Icons'
import { useToast } from '../components/ui/Toast'
import type { Customer, CustomerTransaction, Job } from '../types'

const transactionLabels: Record<string, string> = {
  job_sale: 'İş Satışı',
  collection: 'Tahsilat Alındı',
  payment: 'Ödeme Yapıldı',
  received_check: 'Alınan Çek',
  issued_check: 'Verilen Çek',
  adjustment: 'Hesap Düzeltme',
}

export const CustomerDetailPage: React.FC = () => {
  const { id = '' } = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerJobs, setCustomerJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('transactions')

  // Modals state
  const [txModalOpen, setTxModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [reverseTxId, setReverseTxId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { showToast } = useToast()
  const navigate = useNavigate()

  const loadDetail = () => {
    setIsLoading(true)
    api<Customer>(`/customers/${id}`)
      .then((data) => {
        setCustomer(data)
        setError('')
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false))

    // Load customer jobs
    api<Job[]>(`/jobs?customer_id=${id}`)
      .then(setCustomerJobs)
      .catch(() => {})
  }

  useEffect(() => {
    loadDetail()
  }, [id])

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form)

    // Determine direction automatically if not selected
    let direction = payload.direction as string
    if (!direction) {
      if (payload.entry_type === 'collection' || payload.entry_type === 'received_check') {
        direction = 'credit' // Borcu düşer
      } else {
        direction = 'debit' // Borcu artar
      }
    }

    try {
      await api(`/customers/${id}/transactions`, {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          direction,
        }),
      })
      showToast('Hesap hareketi eklendi.')
      setTxModalOpen(false)
      loadDetail()
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form)

    try {
      const updated = await api<Customer>(`/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      setCustomer(updated)
      showToast('Müşteri bilgileri güncellendi.')
      setEditModalOpen(false)
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReverseTransaction = async () => {
    if (!reverseTxId) return
    setIsSubmitting(true)
    try {
      await api(`/customers/${id}/transactions/${reverseTxId}/reverse`, {
        method: 'POST',
      })
      showToast('İşlem kaydı ters kayıt ile iptal edildi.')
      setReverseTxId(null)
      loadDetail()
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Müşteri Detayı" />
        <p className="loading">Müşteri detayları yükleniyor...</p>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div>
        <PageHeader title="Müşteri Detayı" />
        <div className="table-error-box">
          <Icons.Alert size={20} />
          <span>Müşteri bilgisi alınamadı: {error}</span>
        </div>
      </div>
    )
  }

  const txColumns: Column<CustomerTransaction>[] = [
    {
      key: 'transaction_date',
      header: 'TARİH',
      render: (t) => formatDate(t.transaction_date),
    },
    {
      key: 'entry_type',
      header: 'İŞLEM TÜRÜ',
      render: (t) => (
        <Badge
          variant={
            t.direction === 'debit' ? 'warning' : 'success'
          }
        >
          {transactionLabels[t.entry_type] || t.entry_type}
        </Badge>
      ),
    },
    {
      key: 'description',
      header: 'AÇIKLAMA',
      render: (t) => t.description || '-',
    },
    {
      key: 'direction',
      header: 'BORÇ / ALACAK',
      render: (t) => (
        <span style={{ fontWeight: 600, color: t.direction === 'debit' ? '#b91c1c' : '#15803d' }}>
          {t.direction === 'debit' ? 'Borç (+ Alacak Kaydı)' : 'Alacak (- Tahsilat)'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'TUTAR',
      align: 'right',
      render: (t) => (
        <span style={{ fontWeight: 700 }}>{formatTRY(t.amount)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'İŞLEM',
      align: 'right',
      render: (t) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setReverseTxId(t.id)}
          title="İşlemi İptal Et / Ters Kayıt At"
        >
          <Icons.Trash size={14} style={{ color: '#ef4444' }} />
        </Button>
      ),
    },
  ]

  const jobColumns: Column<Job>[] = [
    {
      key: 'job_number',
      header: 'İŞ NO',
      render: (j) => <span style={{ fontWeight: 700 }}>{j.job_number}</span>,
    },
    {
      key: 'pattern_name',
      header: 'DESEN / KUMAŞ',
      render: (j) => (
        <div>
          <div>{j.pattern_name || j.pattern_code || 'Desen Adı Yok'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{j.fabric_info}</div>
        </div>
      ),
    },
    {
      key: 'delivery_date',
      header: 'TESLİM TARİHİ',
      render: (j) => formatDate(j.delivery_date),
    },
    {
      key: 'status',
      header: 'DURUM',
      render: (j) => (
        <Badge variant={jobStatusBadgeVariant(j.status)}>
          {j.status}
        </Badge>
      ),
    },
    {
      key: 'total_amount',
      header: 'TOPLAM TUTAR',
      align: 'right',
      render: (j) => formatTRY(j.total_amount),
    },
  ]

  return (
    <div>
      <PageHeader
        title={customer.company_name}
        subtitle={`${customer.contact_name || 'Yetkili eklenmemiş'} ${customer.phone ? `· ${customer.phone}` : ''}`}
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outline"
              icon={<Icons.Edit size={16} />}
              onClick={() => setEditModalOpen(true)}
            >
              Düzenle
            </Button>
            <Button
              variant="secondary"
              icon={<Icons.Plus size={16} />}
              onClick={() => setTxModalOpen(true)}
            >
              Tahsilat / Ödeme Ekle
            </Button>
            <Button
              icon={<Icons.Plus size={16} />}
              onClick={() => navigate(`/jobs/new?customer_id=${customer.id}`)}
            >
              Yeni İş Aç
            </Button>
          </div>
        }
      />

      {/* Financial Overview Metrics */}
      <div className="metrics-grid">
        <MetricCard
          title="BİZE OLAN NET BORCU (AÇIK BAKİYE)"
          value={formatTRY(customer.open_balance)}
          subtitle={
            parseFloat(customer.open_balance) > 0
              ? 'Müşteriden tahsil edilmesi gereken alacak bakiye'
              : 'Müşterinin borcu bulunmuyor'
          }
          tone={parseFloat(customer.open_balance) > 0 ? 'accent' : 'success'}
        />
        <MetricCard
          title="VERGİ DAİRESİ & NO"
          value={customer.tax_office ? customer.tax_office : 'Belirtilmedi'}
          subtitle={customer.tax_number ? `VKN/TC: ${customer.tax_number}` : 'Vergi no eklenmedi'}
          tone="blue"
        />
        <MetricCard
          title="ADRES & İLETİŞİM"
          value={customer.phone ? customer.phone : 'Telefon Yok'}
          subtitle={customer.address ? customer.address : 'Adres bilgisi girilmedi'}
          tone="default"
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'transactions', label: 'Hesap Hareketleri', count: customer.transactions?.length || 0 },
          { id: 'jobs', label: 'İşler & Siparişler', count: customerJobs.length },
          { id: 'info', label: 'Firma Detayları' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'transactions' && (
        <DataTable
          columns={txColumns}
          data={customer.transactions || []}
          emptyTitle="Henüz hesap hareketi bulunmuyor"
          emptyDescription="İş siparişleri oluşturuldukça borç kayıtları, tahsilatlar alındıkça alacak kayıtları burada görünür."
          emptyAction={
            <Button icon={<Icons.Plus size={16} />} onClick={() => setTxModalOpen(true)}>
              Tahsilat / Haraket Ekle
            </Button>
          }
        />
      )}

      {activeTab === 'jobs' && (
        <DataTable
          columns={jobColumns}
          data={customerJobs}
          emptyTitle="Bu müşteriye ait henüz sipariş yok"
          emptyAction={
            <Button icon={<Icons.Plus size={16} />} onClick={() => navigate(`/jobs/new?customer_id=${customer.id}`)}>
              Yeni Sipariş Oluştur
            </Button>
          }
          onRowClick={(j) => navigate(`/jobs/${j.id}`)}
        />
      )}

      {activeTab === 'info' && (
        <Card>
          <CardHeader>
            <CardTitle>Firma & İletişim Bilgileri</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
              Düzenle
            </Button>
          </CardHeader>
          <CardContent className="grid-col-2">
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>FİRMA UNVANI</div>
              <div style={{ fontWeight: 700, fontSize: '15px', marginTop: '2px' }}>{customer.company_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>YETKİLİ KİŞİ</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{customer.contact_name || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TELEFON</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{customer.phone || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>VERGİ BİLGİLERİ</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>
                {customer.tax_office} {customer.tax_number ? `(${customer.tax_number})` : ''}
              </div>
            </div>
            <div className="col-span-2">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AÇIK ADRES</div>
              <div style={{ marginTop: '2px' }}>{customer.address || '-'}</div>
            </div>
            <div className="col-span-2">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>NOTLAR</div>
              <div style={{ marginTop: '2px' }}>{customer.notes || '-'}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        title="Tahsilat / Ödeme / Düzeltme Girişi"
        subtitle={`${customer.company_name} carisi için hesap hareketi kaydedin.`}
      >
        <form onSubmit={handleAddTransaction} className="quick-form">
          <Select label="İşlem Türü" name="entry_type" required>
            <option value="collection">Tahsilat Alındı (- Borç Düşer)</option>
            <option value="payment">Ödeme Yapıldı (+ Borç Ekle)</option>
            <option value="received_check">Alınan Çek (- Borç Düşer)</option>
            <option value="issued_check">Verilen Çek (+ Borç Ekle)</option>
            <option value="adjustment">Hesap Düzeltme</option>
          </Select>
          <Input label="Tutar (₺)" name="amount" required inputMode="decimal" placeholder="1000.00" />
          <Input label="İşlem Tarihi" type="date" name="transaction_date" defaultValue={new Date().toISOString().split('T')[0]} required />
          <Input label="Açıklama" name="description" placeholder="Ziraat Bankası havale / nakit tahsilat" />

          <div className="modal-actions-right">
            <Button type="button" variant="ghost" onClick={() => setTxModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Müşteri Bilgilerini Düzenle"
      >
        <form onSubmit={handleUpdateCustomer} className="quick-form">
          <Input label="Firma / Cari Unvanı" name="company_name" defaultValue={customer.company_name} required />
          <div className="grid-col-2">
            <Input label="Yetkili Kişi" name="contact_name" defaultValue={customer.contact_name} />
            <Input label="Telefon" name="phone" defaultValue={customer.phone} />
          </div>
          <div className="grid-col-2">
            <Input label="Vergi Dairesi" name="tax_office" defaultValue={customer.tax_office} />
            <Input label="Vergi Numarası" name="tax_number" defaultValue={customer.tax_number} />
          </div>
          <Textarea label="Adres" name="address" defaultValue={customer.address} />
          <Textarea label="Notlar" name="notes" defaultValue={customer.notes} />

          <div className="modal-actions-right">
            <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Güncelle
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reverse Transaction Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!reverseTxId}
        onClose={() => setReverseTxId(null)}
        onConfirm={handleReverseTransaction}
        title="İşlem İptali (Ters Kayıt)"
        message="Bu hesap hareketini iptal etmek istediğinizden emin misiniz? Cari bakiyesini güncelleyecek bir ters kayıt oluşturulacaktır."
        confirmText="İşlemi İptal Et"
        isLoading={isSubmitting}
      />
    </div>
  )
}
