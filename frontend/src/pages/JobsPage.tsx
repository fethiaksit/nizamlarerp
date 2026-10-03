import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatTRY, formatDate } from '../lib/money'
import { PageHeader } from '../components/ui/PageHeader'
import { DataTable, Column } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Badge, jobStatusBadgeVariant } from '../components/ui/Badge'
import { Tabs } from '../components/ui/Tabs'
import { Icons } from '../components/ui/Icons'
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

export const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const loadJobs = (q = '', s = statusFilter) => {
    setIsLoading(true)
    const stParam = s === 'all' ? '' : s
    api<Job[]>(`/jobs?search=${encodeURIComponent(q)}&status=${stParam}`)
      .then((data) => {
        setJobs(data)
        setError('')
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadJobs(search, statusFilter)
  }, [statusFilter])

  const handleSearchChange = (q: string) => {
    setSearch(q)
    loadJobs(q, statusFilter)
  }

  const handleTabChange = (tabId: string) => {
    setStatusFilter(tabId)
  }

  const columns: Column<Job>[] = [
    {
      key: 'job_number',
      header: 'İŞ NO & MÜŞTERİ',
      sortable: true,
      render: (j) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
            {j.job_number}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
            {j.customer_name || 'Müşteri'}
          </div>
        </div>
      ),
    },
    {
      key: 'pattern_name',
      header: 'DESEN & KUMAŞ BİLGİSİ',
      render: (j) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {j.pattern_name || j.pattern_code || 'Desen Belirtilmemiş'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {j.fabric_info} {j.print_type ? `· ${j.print_type}` : ''} {j.color_info ? `· ${j.color_info}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'MİKTAR',
      render: (j) => (
        <span>
          {j.quantity} {j.unit}
        </span>
      ),
    },
    {
      key: 'delivery_date',
      header: 'TESLİM TARİHİ',
      sortable: true,
      render: (j) => (
        <div>
          <div>{formatDate(j.delivery_date)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Sipariş: {formatDate(j.order_date)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'DURUM',
      render: (j) => (
        <Badge variant={jobStatusBadgeVariant(j.status)}>
          {statusLabels[j.status] || j.status}
        </Badge>
      ),
    },
    {
      key: 'total_amount',
      header: 'TOPLAM TUTAR',
      align: 'right',
      sortable: true,
      render: (j) => (
        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
          {formatTRY(j.total_amount)}
        </span>
      ),
    },
  ]

  const statusCounts = {
    all: jobs.length,
    yeni: jobs.filter((j) => j.status === 'yeni').length,
    baskida: jobs.filter((j) => j.status === 'baskida').length,
    hazir: jobs.filter((j) => j.status === 'hazir').length,
    teslim_edildi: jobs.filter((j) => j.status === 'teslim_edildi').length,
  }

  return (
    <div>
      <PageHeader
        title="Siparişler / İş Takibi"
        subtitle="Tekstil baskı iş emri takibi ve üretim süreçleri."
        action={
          <Button icon={<Icons.Plus size={16} />} onClick={() => navigate('/jobs/new')}>
            + Yeni Sipariş / İş Ekle
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: 'all', label: 'Tüm İşler' },
          { id: 'yeni', label: 'Yeni Siparişler', count: statusCounts.yeni },
          { id: 'baskida', label: 'Baskıda Olanlar', count: statusCounts.baskida },
          { id: 'hazir', label: 'Teslime Hazır', count: statusCounts.hazir },
          { id: 'teslim_edildi', label: 'Teslim Edilenler' },
        ]}
        activeTab={statusFilter}
        onChange={handleTabChange}
      />

      <DataTable
        columns={columns}
        data={jobs}
        isLoading={isLoading}
        error={error}
        searchQuery={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="İş no, desen, kumaş veya müşteri ara..."
        emptyTitle="Kayıtlı iş bulunamadı"
        emptyDescription="Filtrelere uygun iş bulunmuyor veya sisteme henüz iş eklenmemiş."
        emptyAction={
          <Button icon={<Icons.Plus size={16} />} onClick={() => navigate('/jobs/new')}>
            + Yeni İş Oluştur
          </Button>
        }
        onRowClick={(j) => navigate(`/jobs/${j.id}`)}
      />
    </div>
  )
}
