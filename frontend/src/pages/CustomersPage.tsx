import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatTRY } from '../lib/money'
import { PageHeader } from '../components/ui/PageHeader'
import { DataTable, Column } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Textarea } from '../components/ui/Input'
import { Icons } from '../components/ui/Icons'
import { useToast } from '../components/ui/Toast'
import type { Customer } from '../types'

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { showToast } = useToast()
  const navigate = useNavigate()

  const loadCustomers = (query = '') => {
    setIsLoading(true)
    api<Customer[]>(`/customers?search=${encodeURIComponent(query)}`)
      .then((data) => {
        setCustomers(data)
        setError('')
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const handleSearchChange = (q: string) => {
    setSearch(q)
    loadCustomers(q)
  }

  const handleCreateCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form)

    try {
      const customer = await api<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      showToast('Müşteri kaydı başarıyla oluşturuldu.')
      setIsModalOpen(false)
      loadCustomers()
      navigate(`/customers/${customer.id}`)
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<Customer>[] = [
    {
      key: 'company_name',
      header: 'FİRMA ADI',
      sortable: true,
      render: (c) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{c.company_name}</div>
          {c.contact_name && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Yetkili: {c.contact_name}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'TELEFON',
      render: (c) => c.phone || <span style={{ color: 'var(--text-light)' }}>-</span>,
    },
    {
      key: 'tax_office',
      header: 'VERGİ BİLGİSİ',
      render: (c) =>
        c.tax_office || c.tax_number ? (
          <span style={{ fontSize: '13px' }}>
            {c.tax_office} {c.tax_number ? `(${c.tax_number})` : ''}
          </span>
        ) : (
          <span style={{ color: 'var(--text-light)' }}>-</span>
        ),
    },
    {
      key: 'open_balance',
      header: 'GÜNCEL BAKİYE (ALACAK)',
      align: 'right',
      sortable: true,
      render: (c) => (
        <span
          style={{
            fontWeight: 700,
            color: parseFloat(c.open_balance) > 0 ? 'var(--primary)' : 'var(--text-main)',
          }}
        >
          {formatTRY(c.open_balance)}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Cariler / Müşteriler"
        subtitle="Müşteri hesapları, cari bakiyeler ve iletişim rehberi."
        action={
          <Button icon={<Icons.Plus size={16} />} onClick={() => setIsModalOpen(true)}>
            + Yeni Müşteri Kaydet
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        error={error}
        searchQuery={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Firma adı veya telefon ara..."
        emptyTitle="Henüz müşteri kaydı bulunmuyor"
        emptyDescription="Sisteme ilk müşterinizi ekleyerek sipariş ve cari hareket oluşturmaya başlayın."
        emptyAction={
          <Button icon={<Icons.Plus size={16} />} onClick={() => setIsModalOpen(true)}>
            + Müşteri Ekle
          </Button>
        }
        onRowClick={(c) => navigate(`/customers/${c.id}`)}
      />

      {/* New Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Müşteri Kaydı"
        subtitle="Müşterinizin firma ve iletişim bilgilerini tanımlayın."
      >
        <form onSubmit={handleCreateCustomer} className="quick-form">
          <Input label="Firma / Cari Unvanı" name="company_name" required autoFocus placeholder="Örn: ABC Tekstil San. Ltd. Şti." />
          <div className="grid-col-2">
            <Input label="Yetkili Kişi" name="contact_name" placeholder="Ahmet Yılmaz" />
            <Input label="Telefon" name="phone" placeholder="0532 000 0000" />
          </div>
          <div className="grid-col-2">
            <Input label="Vergi Dairesi" name="tax_office" placeholder="Esenler" />
            <Input label="Vergi Numarası" name="tax_number" placeholder="1234567890" />
          </div>
          <Textarea label="Adres" name="address" placeholder="Firma açık adresi..." />
          <Textarea label="Notlar" name="notes" placeholder="Özel notlar..." />

          <div className="modal-actions-right">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Müşteriyi Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
