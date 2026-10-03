import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatTRY, formatDate } from '../lib/money'
import { PageHeader } from '../components/ui/PageHeader'
import { DataTable, Column } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Icons } from '../components/ui/Icons'
import { useToast } from '../components/ui/Toast'
import type { Personnel, CashBankAccount } from '../types'

export const PersonnelPage: React.FC = () => {
  const [personnelList, setPersonnelList] = useState<Personnel[]>([])
  const [accounts, setAccounts] = useState<CashBankAccount[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { showToast } = useToast()

  const loadPersonnel = () => {
    setIsLoading(true)
    api<Personnel[]>(`/personnel?search=${encodeURIComponent(search)}`)
      .then((data) => {
        setPersonnelList(data)
        setError('')
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadPersonnel()
    api<CashBankAccount[]>('/finance/accounts').then(setAccounts).catch(() => {})
  }, [])

  const handleCreatePersonnel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form)

    try {
      await api('/personnel', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      showToast('Personel kaydı oluşturuldu.')
      setIsAddModalOpen(false)
      loadPersonnel()
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreatePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedPersonnel) return
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form)

    try {
      await api(`/personnel/${selectedPersonnel.id}/payments`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      showToast(`${selectedPersonnel.full_name} için maaş/avans ödemesi kaydedildi.`)
      setIsPayModalOpen(false)
      setSelectedPersonnel(null)
      loadPersonnel()
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<Personnel>[] = [
    {
      key: 'full_name',
      header: 'AD SOYAD & UNVAN',
      sortable: true,
      render: (p) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.full_name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.title || 'Çalışan'}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'İLETİŞİM',
      render: (p) => (
        <div>
          <div>{p.phone || '-'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.email}</div>
        </div>
      ),
    },
    {
      key: 'start_date',
      header: 'BAŞLANGIÇ TARİHİ',
      render: (p) => formatDate(p.start_date),
    },
    {
      key: 'monthly_salary',
      header: 'AYLIK MAAŞ',
      align: 'right',
      sortable: true,
      render: (p) => <span style={{ fontWeight: 700 }}>{formatTRY(p.monthly_salary)}</span>,
    },
    {
      key: 'actions',
      header: 'İŞLEM',
      align: 'right',
      render: (p) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedPersonnel(p)
            setIsPayModalOpen(true)
          }}
        >
          Maaş / Avans Öde
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Personel Yönetimi"
        subtitle="İşletme çalışanları, maaş tanımları ve avans ödeme takibi."
        action={
          <Button icon={<Icons.Plus size={16} />} onClick={() => setIsAddModalOpen(true)}>
            + Yeni Personel Ekle
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={personnelList}
        isLoading={isLoading}
        error={error}
        searchQuery={search}
        onSearchChange={(q) => {
          setSearch(q)
          loadPersonnel()
        }}
        searchPlaceholder="Personel adı veya unvan ara..."
        emptyTitle="Kayıtlı personel bulunamadı"
        emptyDescription="İşletme çalışanlarınızı ekleyerek maaş ve avans ödemelerini takip edin."
        emptyAction={
          <Button icon={<Icons.Plus size={16} />} onClick={() => setIsAddModalOpen(true)}>
            + Personel Ekle
          </Button>
        }
      />

      {/* Add Personnel Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Yeni Personel Kaydı"
      >
        <form onSubmit={handleCreatePersonnel} className="quick-form">
          <Input label="Ad Soyad" name="full_name" required placeholder="Ahmet Yılmaz" />
          <div className="grid-col-2">
            <Input label="Görevi / Unvanı" name="title" placeholder="Baskı Ustası / Ofis Sorumlusu" />
            <Input label="Aylık Maaş (₺)" name="monthly_salary" required inputMode="decimal" placeholder="30000.00" />
          </div>
          <div className="grid-col-2">
            <Input label="Telefon" name="phone" placeholder="0532 000 0000" />
            <Input label="E-posta" type="email" name="email" placeholder="personel@nizamlar.com" />
          </div>
          <Input label="İşe Başlama Tarihi" type="date" name="start_date" defaultValue={new Date().toISOString().split('T')[0]} required />
          <Textarea label="Notlar" name="notes" placeholder="SGK notları vb..." />

          <div className="modal-actions-right">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pay Personnel Modal */}
      {selectedPersonnel && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Maaş / Avans Ödemesi (${selectedPersonnel.full_name})`}
          subtitle={`Aylık Tanımlı Maaş: ${formatTRY(selectedPersonnel.monthly_salary)}`}
        >
          <form onSubmit={handleCreatePayment} className="quick-form">
            <Select label="Ödeme Türü" name="payment_type" required>
              <option value="maas">Maaş Ödemesi</option>
              <option value="avans">Avans Ödemesi</option>
              <option value="prim">Prim / İkramiye</option>
            </Select>

            <Select label="Ödemenin Yapılacağı Kasa / Banka" name="account_id" required>
              <option value="">Kasa veya Banka Hesabı Seçin</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (Mevcut Bakiye: {formatTRY(a.balance)})
                </option>
              ))}
            </Select>

            <Input label="Ödeme Tutarı (₺)" name="amount" defaultValue={selectedPersonnel.monthly_salary} required inputMode="decimal" />
            <Input label="Ödeme Tarihi" type="date" name="payment_date" defaultValue={new Date().toISOString().split('T')[0]} required />
            <Input label="Açıklama" name="description" placeholder="Ekim 2026 Maaş Ödemesi" />

            <div className="modal-actions-right">
              <Button type="button" variant="ghost" onClick={() => setIsPayModalOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Ödemeyi Yap ve Kaydet
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
