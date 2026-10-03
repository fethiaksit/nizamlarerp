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
import type { FinanceTransaction, CashBankAccount } from '../types'

const categoryLabels: Record<string, string> = {
  genel: 'Genel',
  baski_satisi: 'Baskı Satışı',
  hammadde: 'Boya / Hammadde',
  kira: 'Kira & Ofis',
  fatura: 'Fatura & Elektrik',
  maas: 'Maaş & Personel',
  yakit: 'Yakıt & Lojistik',
  cek_tahsilati: 'Çek Tahsilatı',
  diger: 'Diğer',
}

export const FinanceTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [accounts, setAccounts] = useState<CashBankAccount[]>([])
  const [search, setSearch] = useState('')
  const [entryTypeFilter, setEntryTypeFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { showToast } = useToast()

  const loadTransactions = (q = search, type = entryTypeFilter) => {
    setIsLoading(true)
    api<FinanceTransaction[]>(`/finance/transactions?search=${encodeURIComponent(q)}&entry_type=${type}`)
      .then((data) => {
        setTransactions(data)
        setError('')
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadTransactions()
    api<CashBankAccount[]>('/finance/accounts').then(setAccounts).catch(() => {})
  }, [])

  const handleCreateTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form)

    try {
      await api('/finance/transactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      showToast('Finans hareketi eklendi.')
      setIsModalOpen(false)
      loadTransactions()
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
      render: (t) => formatDate(t.transaction_date),
    },
    {
      key: 'entry_type',
      header: 'TÜR & KATEGORİ',
      render: (t) => (
        <div>
          <Badge variant={t.entry_type === 'gelir' || t.entry_type === 'tahsilat' ? 'success' : 'danger'}>
            {t.entry_type === 'gelir' ? 'Gelir' : t.entry_type === 'gider' ? 'Gider' : t.entry_type === 'tahsilat' ? 'Tahsilat' : 'Ödeme'}
          </Badge>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
            {categoryLabels[t.category] || t.category}
          </span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'AÇIKLAMA / İLGİLİ CARİ',
      render: (t) => (
        <div>
          <div style={{ fontWeight: 600 }}>{t.description || '-'}</div>
          {t.customer_name && (
            <div style={{ fontSize: '12px', color: 'var(--primary)' }}>Cari: {t.customer_name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'account_name',
      header: 'KASA / BANKA',
      render: (t) => t.account_name || <span style={{ color: 'var(--text-light)' }}>-</span>,
    },
    {
      key: 'amount',
      header: 'TUTAR',
      align: 'right',
      sortable: true,
      render: (t) => (
        <span
          style={{
            fontWeight: 700,
            color: t.entry_type === 'gelir' || t.entry_type === 'tahsilat' ? '#16a34a' : '#dc2626',
          }}
        >
          {t.entry_type === 'gelir' || t.entry_type === 'tahsilat' ? '+' : '-'}{formatTRY(t.amount)}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Gelir & Gider Hareketleri"
        subtitle="İşletmenin tüm kasaya ve bankaya giren/çıkan para kayıtları."
        action={
          <Button icon={<Icons.Plus size={16} />} onClick={() => setIsModalOpen(true)}>
            + Yeni Gelir / Gider Ekle
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={transactions}
        isLoading={isLoading}
        error={error}
        searchQuery={search}
        onSearchChange={(q) => {
          setSearch(q)
          loadTransactions(q, entryTypeFilter)
        }}
        filters={[
          {
            key: 'entry_type',
            label: 'Tür',
            value: entryTypeFilter,
            onChange: (val) => {
              setEntryTypeFilter(val)
              loadTransactions(search, val)
            },
            options: [
              { value: '', label: 'Tüm İşlem Türleri' },
              { value: 'gelir', label: 'Gelirler' },
              { value: 'gider', label: 'Giderler' },
              { value: 'tahsilat', label: 'Tahsilatlar' },
              { value: 'odeme', label: 'Ödemeler' },
            ],
          },
        ]}
        emptyTitle="Finans kaydı bulunamadı"
        emptyDescription="Kriterlerinize uygun gelir veya gider kaydı bulunmuyor."
        emptyAction={
          <Button icon={<Icons.Plus size={16} />} onClick={() => setIsModalOpen(true)}>
            + Kayıt Ekle
          </Button>
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Gelir / Gider Kaydı"
      >
        <form onSubmit={handleCreateTransaction} className="quick-form">
          <div className="grid-col-2">
            <Select label="İşlem Türü" name="entry_type" required>
              <option value="gider">Gider Kaydı (- Para Çıkışı)</option>
              <option value="gelir">Gelir Kaydı (+ Para Girişi)</option>
            </Select>
            <Select label="Kategori" name="category" required>
              <option value="genel">Genel</option>
              <option value="baski_satisi">Baskı Satısı</option>
              <option value="hammadde">Boya / Hammadde</option>
              <option value="kira">Kira & Ofis</option>
              <option value="fatura">Fatura & Elektrik</option>
              <option value="maas">Maaş & Personel</option>
              <option value="yakit">Yakıt & Lojistik</option>
              <option value="diger">Diğer</option>
            </Select>
          </div>

          <Select label="Kasa / Banka Hesabı" name="account_id">
            <option value="">Hesap Seçin (Opsiyonel)</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatTRY(a.balance)})
              </option>
            ))}
          </Select>

          <Input label="Tutar (₺)" name="amount" required inputMode="decimal" placeholder="500.00" />
          <Input label="İşlem Tarihi" type="date" name="transaction_date" defaultValue={new Date().toISOString().split('T')[0]} required />
          <Input label="Açıklama" name="description" required placeholder="Fatura no / harcama detayı" />

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
