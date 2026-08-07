import { describe, expect, it } from 'vitest'
import { calculatePdfPageSlices } from '../src/lib/pdf-pagination'

describe('calculatePdfPageSlices', () => {
  it('uses row boundaries without dropping content', () => {
    const slices = calculatePdfPageSlices({
      contentHeight: 2600,
      maxPageHeight: 1000,
      breakpoints: [420, 790, 1180, 1650, 2100],
    })

    expect(slices).toEqual([
      { start: 0, height: 790 },
      { start: 790, height: 860 },
      { start: 1650, height: 950 },
    ])
    expect(slices.reduce((total, slice) => total + slice.height, 0)).toBe(2600)
  })

  it('falls back to a hard cut for content taller than one page', () => {
    expect(calculatePdfPageSlices({
      contentHeight: 2200,
      maxPageHeight: 1000,
      breakpoints: [100, 2100],
    })).toEqual([
      { start: 0, height: 1000 },
      { start: 1000, height: 1000 },
      { start: 2000, height: 200 },
    ])
  })
})
