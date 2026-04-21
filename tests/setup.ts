import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

if (typeof window !== 'undefined') {
  window.alert = vi.fn()
  window.confirm = vi.fn(() => true)
}
