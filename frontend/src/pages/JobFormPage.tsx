import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatTRY } from '../lib/money'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'
import type { Customer, Job } from '../types'

export const JobFormPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const defaultCustomerId = searchParams.get('customer') || searchParams.get('customer_id') || ''

  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState(defaultCustomerId)
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [computedTotal, setComputedTotal] = useState('0.00')

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    api<Customer[]>('/customers')
      .then((data) => {
        setCustomers(data)
        if (!selectedCustomerId && data.length > 0) {
          setSelectedCustomerId(data[0].id)
        }
      })
      .catch((e: Error) => showToast(e.message, 'error'))
  }, [])

  // Auto calculate total amount
  useEffect(() => {
    const q = parseFloat(quantity)
    const p = parseFloat(unitPrice)
    if (!isNaN(q) && !isNaN(p) && q > 0 && p >= 0) {
      setComputedTotal((q * p).toFixed(2))
    } else {
      setComputedTotal('0.00')
    }
  }, [quantity, unitPrice])

  const generateRandomJobNo = () => {
    const num = Math.floor(1000 + Math.random() * 9000)
    return `IS-2026-${num}`
  }

  const [jobNumber, setJobNumber] = useState(generateRandomJobNo())

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form)

    try {
      const job = await api<Job>('/jobs', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      showToast('Sipariş kaydı ve müşteri borç hareketi oluşturuldu.')
      navigate(`/jobs/${job.id}`)
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <PageHeader
        title="Yeni Sipariş / İş Oluştur"
        subtitle="Müşteri baskı siparişini detayları ile kaydedin."
        action={
          <Button variant="outline" onClick={() => navigate('/jobs')}>
            Vazgeç
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Sipariş & Baskı Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="quick-form">
            <Select
              label="Müşteri / Cari Seçimi"
              name="customer_id"
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="" disabled>
                Müşteri Seçin
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </Select>

            <div className="grid-col-2">
              <Input
                label="İş / Sipariş Numarası"
                name="job_number"
                required
                value={jobNumber}
                onChange={(e) => setJobNumber(e.target.value)}
                hint="Sistem tarafından benzersiz iş no önerilmiştir."
              />
              <Input
                label="Desen Adı / Kodu"
                name="pattern_name"
                placeholder="Örn: Paşabahçe Lale Desen"
              />
            </div>

            <div className="grid-col-3">
              <Input
                label="Kumaş Bilgisi"
                name="fabric_info"
                placeholder="Süprem 30/1 Pamuk"
              />
              <Input
                label="Baskı Türü"
                name="print_type"
                placeholder="Rotasyon / Dijital"
              />
              <Input
                label="Renk Bilgisi"
                name="color_info"
                placeholder="4 Renk / Beyaz Zemin"
              />
            </div>

            <div className="grid-col-3">
              <Input
                label="Miktar"
                name="quantity"
                required
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1000"
              />
              <Select label="Birim" name="unit">
                <option value="metre">Metre</option>
                <option value="kg">Kg</option>
                <option value="adet">Adet</option>
              </Select>
              <Input
                label="Birim Fiyat (₺)"
                name="unit_price"
                required
                inputMode="decimal"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="35.00"
              />
            </div>

            {/* Total Amount Preview Card */}
            <div
              style={{
                backgroundColor: 'var(--primary-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                  HESAPLANAN TOPLAM İŞ TUTARI
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Miktar × Birim Fiyat Otomatik Çarpımı
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>
                {formatTRY(computedTotal)}
              </div>
            </div>

            <div className="grid-col-2">
              <Input
                label="Sipariş Tarihi"
                type="date"
                name="order_date"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
              />
              <Input
                label="Teslim Tarihi"
                type="date"
                name="delivery_date"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <Input
              label="Desen Referansı / Bağlantı"
              name="pattern_reference"
              placeholder="Dosya bağlantısı veya desen raf no"
            />
            <Textarea label="Sipariş Notları" name="notes" placeholder="Özel üretim ve ambalaj talimatları..." />

            <div className="modal-actions-right">
              <Button type="button" variant="outline" onClick={() => navigate('/jobs')}>
                Vazgeç
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Siparişi Kaydet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
