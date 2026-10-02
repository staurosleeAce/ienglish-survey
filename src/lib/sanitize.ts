export function sanitizeText(input: string, maxLength: number): string {
  // 移除控制字元，避免塞入奇怪內容 / CSV 注入
  // oxlint-disable-next-line no-control-regex
  const controlChars = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
  const cleaned = (input ?? '')
    .replace(controlChars, '')
    .replace(/^\s+|\s+$/g, '')
    .slice(0, maxLength)

  // 防 CSV / Excel 公式注入：若以 = + - @ 開頭，加上單引號
  if (/^[=+\-@]/.test(cleaned)) {
    return `'${cleaned}`
  }
  return cleaned
}

const SLOP_WORDS = ['測試', 'test', 'spam', 'http://', 'https://', 'www.']

export function looksLikeSpam(feedback: string, parentName: string): boolean {
  const text = `${feedback} ${parentName}`.toLowerCase()
  return SLOP_WORDS.some((w) => text.includes(w.toLowerCase()))
}