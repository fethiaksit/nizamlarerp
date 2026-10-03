import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Textarea, Select } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'
import type { CompanySettings } from '../types'

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { showToast } = useToast()

  useEffect(() => {
    api<CompanySettings>('/settings')
      .then(setSettings)
      .catch((e: Error) => showToast(e.message, 'error'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form)

    try {
      const updated = await api<CompanySettings>('/settings', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setSettings(updated)
      showToast('Firma ayarları başarıyla güncellendi.')
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Sistem Ayarları" />
        <p className="loading">Ayarlar yükleniyor...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <PageHeader
        title="Sistem ve Firma Ayarları"
        subtitle="İşletme unvanı, evrak ve fatura basım bilgileri."
      />

      <Card>
        <CardHeader>
          <CardTitle>Firma & Evrak Yapılandırması</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="quick-form">
            <Input
              label="Firma Resmi Unvanı"
              name="company_title"
              defaultValue={settings?.company_title}
              required
            />

            <div className="grid-col-2">
              <Input label="Telefon" name="phone" defaultValue={settings?.phone} />
              <Input label="E-posta" type="email" name="email" defaultValue={settings?.email} />
            </div>

            <div className="grid-col-2">
              <Input label="Vergi Dairesi" name="tax_office" defaultValue={settings?.tax_office} />
              <Input label="Vergi Numarası" name="tax_number" defaultValue={settings?.tax_number} />
            </div>

            <Select label="Sistem Para Birimi" name="currency" defaultValue={settings?.currency || 'TRY'}>
              <option value="TRY">Türk Lirası (₺ - TRY)</option>
              <option value="USD">Amerikan Doları ($ - USD)</option>
              <option value="EUR">Euro (€ - EUR)</option>
            </Select>

            <Textarea label="Firma Açık Adresi" name="address" defaultValue={settings?.address} />

            <div className="modal-actions-right">
              <Button type="submit" isLoading={isSubmitting}>
                Ayarları Kaydet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
