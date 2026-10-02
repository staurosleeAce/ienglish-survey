import { describe, expect, it } from 'vitest'
import { looksLikeSpam, sanitizeText } from '../src/lib/sanitize'

describe('sanitizeText', () => {
  it('trims whitespace and limits length', () => {
    expect(sanitizeText('  安安  ', 10)).toBe('安安')
    expect(sanitizeText('abcdefghijklmnop', 5)).toBe('abcde')
  })

  it('removes control characters', () => {
    expect(sanitizeText('a\u0000b\u0007c', 10)).toBe('abc')
  })

  it('neutralizes formula injection for CSV/Excel', () => {
    expect(sanitizeText('=SUM(1,2)', 20)).toBe("'=SUM(1,2)")
    expect(sanitizeText('+111', 20)).toBe("'+111")
    expect(sanitizeText('-abc', 20)).toBe("'-abc")
    expect(sanitizeText('@x', 20)).toBe("'@x")
  })
})

describe('looksLikeSpam', () => {
  it('detects common spam keywords', () => {
    expect(looksLikeSpam('請看 http://evil.com', 'Miffy')).toBe(true)
    expect(looksLikeSpam('this is a test', '')).toBe(true)
    expect(looksLikeSpam('', 'linda')).toBe(false)
    expect(looksLikeSpam('孩子很喜歡閱讀', 'Miffy媽咪')).toBe(false)
  })
})