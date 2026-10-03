import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatTRY, formatDate } from '../lib/money'
import { PageHeader } from '../components/ui/PageHeader'
import { DataTable, Column } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'
import { Icons } from '../components/ui/Icons'
import { useToast } from '../components/ui/Toast'
import type { FinanceTransaction, Customer, CashBankAccount } from '../types'

export const FinancePaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<FinanceTransaction[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [accounts, setAccounts] = useState<CashBankAccount[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { showToast } = useToast()

  const loadData = () => {
    setIsLoading(true)
    api<FinanceTransaction[]>('/finance/transactions?entry_type=tahsilat')
      .then((tahsilatData) => {
        api<FinanceTransaction[]>('/finance/transactions?entry_type=odeme')
          .then((odemeData) => {
            const combined = [...tahsilatData, ...odemeData].sort(
              (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
            )
            setPayments(combined)
            setError('')
          })
          .catch((e: Error) => setError(e.message))
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadData()
    api<Customer[]>('/customers').then(setCustomers).catch(() => {})
    api<CashBankAccount[]>('/finance/accounts').then(setAccounts).catch(() => {})
  }, [])

  const handleCreatePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form)

    try {
      await api('/finance/transactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      showToast('Tahsilat / Ödeme kaydı başarıyla oluşturuldu.')
      setIsModalOpen(false)
      loadData()
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<FinanceTransaction>[] = [
    {
      key: 'transaction_date',
      header: 'TARİH',
      sortable: true,
      render: (p) => formatDate(p.transaction_date),
    },
    {
      key: 'entry_type',
      header: 'İŞLEM TÜRÜ',
      render: (p) => (
        <Badge variant={p.entry_type === 'tahsilat' ? 'success' : 'warning'}>
          {p.entry_type === 'tahsilat' ? 'Tahsilat Alındı' : 'Ödeme Yapıldı'}
        </Badge>
      ),
    },
    {
      key: 'customer_name',
      header: 'MÜŞTERİ / CARİ',
      render: (p) => (
        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
          {p.customer_name || 'Cari Belirtilmemiş'}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'AÇIKLAMA',
      render: (p) => p.description || '-',
    },
    {
      key: 'account_name',
      header: 'KASA / BANKA',
      render: (p) => p.account_name || '-',
    },
    {
      key: 'amount',
      header: 'TUTAR',
      align: 'right',
      sortable: true,
      render: (p) => (
        <span style={{ fontWeight: 700, color: p.entry_type === 'tahsilat' ? '#16a34a' : '#b45309' }}>
          {formatTRY(p.amount)}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Tahsilat & Ödemeler"
        subtitle="Müşteri tahsilatları ve cari ödeme hareketleri."
        action={
          <Button icon={<Icons.Plus size={16} />} onClick={() => setIsModalOpen(true)}>
            + Yeni Tahsilat / Ödeme Girişi
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={payments}
        isLoading={isLoading}
        error={error}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Müşteri adı veya açıklama ara..."
        emptyTitle="Henüz tahsilat veya ödeme kaydı bulunmuyor"
        emptyAction={
          <Button icon={<Icons.Plus size={16} />} onClick={() => setIsModalOpen(true)}>
            + Tahsilat Girişi Yap
          </Button>
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tahsilat / Ödeme Girişi"
      >
        <form onSubmit={handleCreatePayment} className="quick-form">
          <Select label="İşlem Türü" name="entry_type" required>
            <option value="tahsilat">Tahsilat Alındı (Müşteriden + Borç Düşer)</option>
            <option value="odeme">Ödeme Yapıldı (Cariye Ödeme)</option>
          </Select>

          <Select label="Müşteri / Cari" name="customer_id" required>
            <option value="">Müşteri Seçin</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name} (Bakiye: {formatTRY(c.open_balance)})
              </option>
            ))}
          </Select>

          <Select label="Kasa / Banka Hesabı" name="account_id">
            <option value="">Hesap Seçin (Opsiyonel)</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatTRY(a.balance)})
              </option>
            ))}
          </Select>

          <Input label="Tutar (₺)" name="amount" required inputMode="decimal" placeholder="2500.00" />
          <Input label="İşlem Tarihi" type="date" name="transaction_date" defaultValue={new Date().toISOString().split('T')[0]} required />
          <Input label="Açıklama" name="description" placeholder="Banka havalesi / Elden tahsilat" />

          <div className="modal-actions-right">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
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
