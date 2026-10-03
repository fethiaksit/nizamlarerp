import { describe, expect, it } from 'vitest'
import { formatTRY } from './money'

describe('formatTRY', () => {
  it('formats a decimal API amount as Turkish lira', () => {
    expect(formatTRY('184500.00')).toBe('184.500,00 ₺')
  })
})
