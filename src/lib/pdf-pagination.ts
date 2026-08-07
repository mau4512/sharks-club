export interface PdfPageSlice {
  start: number
  height: number
}

interface PdfPageSliceOptions {
  contentHeight: number
  maxPageHeight: number
  breakpoints?: number[]
  minimumFillRatio?: number
}

export function calculatePdfPageSlices({
  contentHeight,
  maxPageHeight,
  breakpoints = [],
  minimumFillRatio = 0.35,
}: PdfPageSliceOptions): PdfPageSlice[] {
  if (contentHeight <= 0 || maxPageHeight <= 0) return []

  const safeBreakpoints = Array.from(new Set(breakpoints))
    .filter((point) => Number.isFinite(point) && point > 0 && point < contentHeight)
    .sort((a, b) => a - b)
  const slices: PdfPageSlice[] = []
  let start = 0

  while (start < contentHeight) {
    const hardEnd = Math.min(start + maxPageHeight, contentHeight)
    if (hardEnd === contentHeight) {
      slices.push({ start, height: contentHeight - start })
      break
    }

    const minimumUsefulEnd = start + maxPageHeight * minimumFillRatio
    const preferredEnd = safeBreakpoints.reduce((selected, point) => {
      return point >= minimumUsefulEnd && point <= hardEnd ? point : selected
    }, 0)
    const end = preferredEnd || hardEnd

    slices.push({ start, height: end - start })
    start = end
  }

  return slices
}
