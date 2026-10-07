export interface ListaTurno {
  nombre: string
  hora: string
  deportistas: { nombre: string; apellidos: string }[]
}

export function nombresListaTurno(turno: ListaTurno) {
  return [...turno.deportistas]
    .sort((a, b) => `${a.apellidos} ${a.nombre}`.localeCompare(`${b.apellidos} ${b.nombre}`, 'es'))
    .map((deportista) => `${deportista.nombre.trim()} ${deportista.apellidos.trim()}`.trim())
}

export function archivoListaTurno(turno: ListaTurno) {
  const nombre = `${turno.nombre}-${turno.hora}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100)
  return `lista-${nombre || 'turno'}`
}

export async function crearExcelListaTurno(turno: ListaTurno) {
  const { Workbook } = await import('exceljs')
  const workbook = new Workbook()
  const sheet = workbook.addWorksheet('Deportistas', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  sheet.columns = [{ width: 65 }]
  sheet.addRow([`${turno.nombre} · ${turno.hora}`])
  sheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } }
  sheet.addRow(['Nombres y apellidos'])
  sheet.getRow(2).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
  for (const nombre of nombresListaTurno(turno)) sheet.addRow([nombre])
  sheet.eachRow((row) => {
    row.alignment = { vertical: 'middle', wrapText: true }
    // Permitir varias líneas al imprimir nombres largos.
    const text = String(row.getCell(1).value || '')
    row.height = Math.max(24, Math.ceil(text.length / 55) * 18)
  })
  sheet.views = [{ state: 'frozen', ySplit: 2 }]
  sheet.pageSetup.printTitlesRow = '1:2'
  sheet.pageSetup.printArea = `A1:A${sheet.rowCount}`
  return workbook.xlsx.writeBuffer()
}

export async function crearPdfListaTurno(turno: ListaTurno) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ format: 'a4', unit: 'mm' })
  pdf.setProperties({ title: `Lista de deportistas - ${turno.nombre}` })
  const margin = 16
  const width = pdf.internal.pageSize.getWidth() - margin * 2
  const bottom = pdf.internal.pageSize.getHeight() - 20
  let y = 0
  const encabezado = () => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(30, 58, 138)
    const titulo: string[] = pdf.splitTextToSize(`${turno.nombre} - ${turno.hora}`, width)
    pdf.text(titulo, margin, 20)
    y = 20 + titulo.length * 6 + 5
    pdf.setFillColor(30, 58, 138)
    pdf.rect(margin, y, width, 9, 'F')
    pdf.setFontSize(11)
    pdf.setTextColor(255, 255, 255)
    pdf.text('Nombres y apellidos', margin + 3, y + 6)
    y += 9
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(30, 41, 59)
  }
  encabezado()
  for (const nombre of nombresListaTurno(turno)) {
    const lineas: string[] = pdf.splitTextToSize(nombre, width - 6)
    const alto = Math.max(10, lineas.length * 5 + 5)
    if (y + alto > bottom) { pdf.addPage(); encabezado() }
    // También permitir nombres excepcionalmente largos sin cortarlos al pie de página.
    y += 5
    for (const linea of lineas) {
      if (y + 5 > bottom) { pdf.addPage(); encabezado(); y += 5 }
      pdf.text(linea, margin + 3, y)
      y += 5
    }
    pdf.setDrawColor(226, 232, 240)
    pdf.line(margin, y, margin + width, y)
  }
  const pages = pdf.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page)
    pdf.setFontSize(9)
    pdf.setTextColor(100, 116, 139)
    pdf.text(`${page} / ${pages}`, margin + width, bottom + 10, { align: 'right' })
  }
  return pdf
}
