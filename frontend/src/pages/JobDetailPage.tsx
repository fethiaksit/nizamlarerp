import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatTRY, formatDate, formatDateTime } from '../lib/money'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent, MetricCard } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge, jobStatusBadgeVariant } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Icons } from '../components/ui/Icons'
import { useToast } from '../components/ui/Toast'
import type { Job } from '../types'

const statusLabels: Record<string, string> = {
  yeni: 'Yeni',
  desen_hazirlaniyor: 'Desen Hazırlanıyor',
  onay_bekliyor: 'Onay Bekliyor',
  baskida: 'Baskıda',
  hazir: 'Hazır',
  teslim_edildi: 'Teslim Edildi',
  iptal_edildi: 'İptal Edildi',
}

const pipelineSteps = [
  { id: 'yeni', label: '1. Yeni Sipariş' },
  { id: 'desen_hazirlaniyor', label: '2. Desen Hazırlığı' },
  { id: 'onay_bekliyor', label: '3. Onay Bekliyor' },
  { id: 'baskida', label: '4. Baskıda' },
  { id: 'hazir', label: '5. Hazır' },
  { id: 'teslim_edildi', label: '6. Teslim Edildi' },
]

export const JobDetailPage: React.FC = () => {
  const { id = '' } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { showToast } = useToast()
  const navigate = useNavigate()

  const loadJob = () => {
    setIsLoading(true)
    api<Job>(`/jobs/${id}`)
      .then((data) => {
        setJob(data)
        setError('')
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadJob()
  }, [id])

  const handlePromptChangeStatus = (newStatus: string) => {
    setTargetStatus(newStatus)
    setStatusNote('')
    setStatusModalOpen(true)
  }

  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const updated = await api<Job>(`/jobs/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: targetStatus,
          note: statusNote,
        }),
      })
      setJob(updated)
      showToast(`İş durumu "${statusLabels[targetStatus] || targetStatus}" olarak güncellendi.`)
      setStatusModalOpen(false)
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form)

    try {
      const updated = await api<Job>(`/jobs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      setJob(updated)
      showToast('Sipariş detayları güncellendi.')
      setEditModalOpen(false)
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="İş Detayı" />
        <p className="loading">Sipariş detayları yükleniyor...</p>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div>
        <PageHeader title="İş Detayı" />
        <div className="table-error-box">
          <Icons.Alert size={20} />
          <span>Sipariş bulunamadı: {error}</span>
        </div>
      </div>
    )
  }

  const currentStepIdx = pipelineSteps.findIndex((s) => s.id === job.status)

  return (
    <div>
      <PageHeader
        title={`İş ${job.job_number}`}
        subtitle={`Müşteri: ${job.customer_name || 'Cari'} · Teslim: ${formatDate(job.delivery_date)}`}
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" icon={<Icons.Edit size={16} />} onClick={() => setEditModalOpen(true)}>
              Siparişi Düzenle
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/customers/${job.customer_id}`)}>
              Müşteri Cari Detayı
            </Button>
          </div>
        }
      />

      {/* Visual Pipeline Tracker */}
      <div className="pipeline-tracker">
        {pipelineSteps.map((step, idx) => {
          const isCompleted = currentStepIdx > idx
          const isCurrent = currentStepIdx === idx
          return (
            <div
              key={step.id}
              className={`pipeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
            >
              <div className="pipeline-step-dot">
                {isCompleted ? '✓' : idx + 1}
              </div>
              <span className="pipeline-step-label">{step.label}</span>
            </div>
          )
        })}
      </div>

      {/* Status Quick Change Actions */}
      <Card style={{ marginBottom: '24px' }}>
        <CardHeader>
          <CardTitle>Üretim & Durum Yönetimi</CardTitle>
          <Badge variant={jobStatusBadgeVariant(job.status)} size="md">
            Mevcut Durum: {statusLabels[job.status] || job.status}
          </Badge>
        </CardHeader>
        <CardContent style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {Object.entries(statusLabels).map(([stKey, stLabel]) => (
            <Button
              key={stKey}
              variant={job.status === stKey ? 'primary' : 'outline'}
              size="sm"
              disabled={job.status === stKey}
              onClick={() => handlePromptChangeStatus(stKey)}
            >
              {stLabel}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Specifications & Customer Metrics */}
      <div className="metrics-grid">
        <MetricCard
          title="TOPLAM SİPARİŞ TUTARI"
          value={formatTRY(job.total_amount)}
          subtitle={`${job.quantity} ${job.unit} × ${formatTRY(job.unit_price)}`}
          tone="accent"
        />
        <MetricCard
          title="DESEN BİLGİSİ"
          value={job.pattern_name || job.pattern_code || 'Desen Belirtilmemiş'}
          subtitle={job.pattern_reference ? `Ref: ${job.pattern_reference}` : 'Desen kodu yok'}
          tone="blue"
        />
        <MetricCard
          title="KUMAŞ & BASKI BİLGİSİ"
          value={job.fabric_info || 'Kumaş Yok'}
          subtitle={`${job.print_type || 'Baskı Türü Yok'} · ${job.color_info || 'Renk Yok'}`}
          tone="default"
        />
      </div>

      <div className="grid-col-2" style={{ alignItems: 'start' }}>
        {/* Job Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Sipariş Detay Özeti</CardTitle>
          </CardHeader>
          <CardContent style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>İŞ / SİPARİŞ NO</div>
              <div style={{ fontWeight: 700 }}>{job.job_number}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>MÜŞTERİ</div>
              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{job.customer_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SİPARİŞ TARİHİ</div>
              <div>{formatDate(job.order_date)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TESLİM TARİHİ</div>
              <div style={{ fontWeight: 700 }}>{formatDate(job.delivery_date)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>MİKTAR VE BİRİM</div>
              <div>{job.quantity} {job.unit}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>BİRİM FİYAT</div>
              <div>{formatTRY(job.unit_price)}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>DESEN REFERANSI</div>
              <div>{job.pattern_reference || '-'}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ÜRETİM NOTLARI</div>
              <div>{job.notes || 'Not bulunmuyor.'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Status Change History */}
        <Card>
          <CardHeader>
            <CardTitle>Durum Değişiklik Geçmişi</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {job.status_history && job.status_history.length > 0 ? (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>TARİH</th>
                      <th>DURUM</th>
                      <th>NOT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.status_history.map((h) => (
                      <tr key={h.id}>
                        <td style={{ fontSize: '12px' }}>{formatDateTime(h.created_at)}</td>
                        <td>
                          <Badge variant={jobStatusBadgeVariant(h.new_status)} size="sm">
                            {statusLabels[h.new_status] || h.new_status}
                          </Badge>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {h.note || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ padding: '20px', color: 'var(--text-muted)' }}>Henüz geçmiş kaydı yok.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Status Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Durum Güncelleme"
        subtitle={`Sipariş durumunu "${statusLabels[targetStatus] || targetStatus}" olarak değiştiriyorsunuz.`}
      >
        <form onSubmit={handleConfirmStatusChange} className="quick-form">
          <Textarea
            label="Durum Değişikliği Notu (İsteğe Bağlı)"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="Örn: Desen müşteri tarafından onaylandı, baskı makinesine verildi."
          />
          <div className="modal-actions-right">
            <Button type="button" variant="ghost" onClick={() => setStatusModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Durumu Güncelle
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Job Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Siparişi Düzenle"
      >
        <form onSubmit={handleUpdateJob} className="quick-form">
          <Input label="İş Numarası" name="job_number" defaultValue={job.job_number} required />
          <div className="grid-col-2">
            <Input label="Desen Adı / Kodu" name="pattern_name" defaultValue={job.pattern_name} />
            <Input label="Desen Kodu" name="pattern_code" defaultValue={job.pattern_code} />
          </div>
          <div className="grid-col-3">
            <Input label="Kumaş Bilgisi" name="fabric_info" defaultValue={job.fabric_info} />
            <Input label="Baskı Türü" name="print_type" defaultValue={job.print_type} />
            <Input label="Renk" name="color_info" defaultValue={job.color_info} />
          </div>
          <div className="grid-col-3">
            <Input label="Miktar" name="quantity" defaultValue={job.quantity} required inputMode="decimal" />
            <Select label="Birim" name="unit" defaultValue={job.unit}>
              <option value="metre">Metre</option>
              <option value="kg">Kg</option>
              <option value="adet">Adet</option>
            </Select>
            <Input label="Birim Fiyat (₺)" name="unit_price" defaultValue={job.unit_price} required inputMode="decimal" />
          </div>
          <div className="grid-col-2">
            <Input label="Sipariş Tarihi" type="date" name="order_date" defaultValue={job.order_date.split('T')[0]} required />
            <Input label="Teslim Tarihi" type="date" name="delivery_date" defaultValue={job.delivery_date.split('T')[0]} required />
          </div>
          <Input label="Desen Referansı" name="pattern_reference" defaultValue={job.pattern_reference} />
          <Textarea label="Notlar" name="notes" defaultValue={job.notes} />

          <div className="modal-actions-right">
            <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Siparişi Güncelle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
