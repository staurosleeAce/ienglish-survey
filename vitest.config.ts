import { defineConfig } from 'vitest/config'

// 測試用獨立設定：不載入 react plugin，避免與 vite 版本衝突
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})