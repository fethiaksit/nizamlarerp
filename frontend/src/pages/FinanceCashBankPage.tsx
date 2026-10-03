import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatTRY } from '../lib/money'
import { PageHeader } from '../components/ui/PageHeader'
import { MetricCard, Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'
import { Icons } from '../components/ui/Icons'
import { useToast } from '../components/ui/Toast'
import type { CashBankAccount } from '../types'

export const FinanceCashBankPage: React.FC = () => {
  const [accounts, setAccounts] = useState<CashBankAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { showToast } = useToast()

  const loadAccounts = () => {
    setIsLoading(true)
    api<CashBankAccount[]>('/finance/accounts')
      .then((data) => {
        setAccounts(data)
        setError('')
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const handleCreateAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form)

    try {
      await api('/finance/accounts', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      showToast('Kasa / Banka hesabı eklendi.')
      setIsModalOpen(false)
      loadAccounts()
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const cashAccounts = accounts.filter((a) => a.account_type === 'kasa')
  const bankAccounts = accounts.filter((a) => a.account_type === 'banka')

  const totalCash = cashAccounts.reduce((sum, a) => sum + parseFloat(a.balance || '0'), 0)
  const totalBank = bankAccounts.reduce((sum, a) => sum + parseFloat(a.balance || '0'), 0)

  return (
    <div>
      <PageHeader
        title="Kasa & Banka Hesapları"
        subtitle="İşletmenin nakit kasaları ve banka hesap bakiyeleri."
        action={
          <Button icon={<Icons.Plus size={16} />} onClick={() => setIsModalOpen(true)}>
            + Yeni Hesap Ekle
          </Button>
        }
      />

      <div className="metrics-grid">
        <MetricCard
          title="TOPLAM LİKİDİTE"
          value={formatTRY((totalCash + totalBank).toString())}
          subtitle="Kasa ve Banka Toplam Mevduat"
          tone="success"
          icon={<Icons.Finance size={20} />}
        />
        <MetricCard
          title="TOPLAM NAKİT KASA"
          value={formatTRY(totalCash.toString())}
          subtitle={`${cashAccounts.length} adet aktif kasa`}
          tone="accent"
          icon={<Icons.Wallet size={20} />}
        />
        <MetricCard
          title="TOPLAM BANKA MEVDUATI"
          value={formatTRY(totalBank.toString())}
          subtitle={`${bankAccounts.length} adet aktif banka hesabı`}
          tone="blue"
          icon={<Icons.Building size={20} />}
        />
      </div>

      <div className="grid-col-2" style={{ alignItems: 'start' }}>
        <Card>
          <CardHeader>
            <CardTitle>Nakit Kasalar</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {cashAccounts.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>KASA ADI</th>
                    <th>PARA BİRİMİ</th>
                    <th style={{ textAlign: 'right' }}>BAKİYE</th>
                  </tr>
                </thead>
                <tbody>
                  {cashAccounts.map((acc) => (
                    <tr key={acc.id}>
                      <td style={{ fontWeight: 700 }}>{acc.name}</td>
                      <td>
                        <Badge variant="gray" size="sm">
                          {acc.currency}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                        {formatTRY(acc.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ padding: '20px', color: 'var(--text-muted)' }}>Henüz nakit kasa bulunmuyor.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banka Hesapları</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {bankAccounts.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>BANKA & HESAP ADI</th>
                    <th>IBAN</th>
                    <th style={{ textAlign: 'right' }}>BAKİYE</th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.map((acc) => (
                    <tr key={acc.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{acc.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{acc.bank_name}</div>
                      </td>
                      <td style={{ fontSize: '12px' }}>{acc.iban || '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                        {formatTRY(acc.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ padding: '20px', color: 'var(--text-muted)' }}>Henüz banka hesabı eklenmemiş.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Kasa / Banka Hesabı"
      >
        <form onSubmit={handleCreateAccount} className="quick-form">
          <Input label="Hesap Adı" name="name" required placeholder="Örn: Şube Kasası / Ziraat Ticari" />
          <Select label="Hesap Türü" name="account_type" required>
            <option value="kasa">Nakit Kasa</option>
            <option value="banka">Banka Hesabı</option>
          </Select>
          <Input label="Banka Adı (Banka İse)" name="bank_name" placeholder="Ziraat Bankası / Garanti BBVA" />
          <Input label="IBAN Numarası" name="iban" placeholder="TR00 0000 0000 0000 0000 0000 00" />
          <Input label="Açılış Bakiyesi (₺)" name="balance" defaultValue="0.00" inputMode="decimal" />

          <div className="modal-actions-right">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Hesabı Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
