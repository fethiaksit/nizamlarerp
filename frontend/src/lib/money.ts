export function formatTRY(amount: string): string {
  const [whole = '0', fraction = '00'] = amount.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `₺${grouped},${fraction.padEnd(2, '0').slice(0, 2)}`
}
