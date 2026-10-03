export function formatTRY(amount?: string | number | null): string {
  if (amount === undefined || amount === null || amount === '') return '0,00 ₺'
  const num = typeof amount === 'number' ? amount : parseFloat(amount)
  if (isNaN(num)) return '0,00 ₺'
  
  const isNegative = num < 0
  const absNum = Math.abs(num)
  const parts = absNum.toFixed(2).split('.')
  const whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const fraction = parts[1]

  const formatted = `${whole},${fraction} ₺`
  return isNegative ? `-${formatted}` : formatted
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '-'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateString
  }
}
