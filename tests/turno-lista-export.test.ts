import { describe, expect, it } from 'vitest'
import { Workbook } from 'exceljs'
import { archivoListaTurno, crearExcelListaTurno, crearPdfListaTurno, nombresListaTurno } from '@/lib/turno-lista-export'

const turno = {
  nombre: 'Mañana / Básquet', hora: '08:00',
  deportistas: [
    { nombre: 'José', apellidos: 'Zúñiga', email: 'privado@example.com', saldo: 180 },
    { nombre: 'Ana María', apellidos: 'Álvarez', email: 'otro@example.com', saldo: 90 },
    { nombre: '=SUM(A1:A2)', apellidos: 'Prueba', email: 'formula@example.com', saldo: 0 },
  ],
}

describe('listas de turno descargables', () => {
  it('genera un XLSX con nombres ordenados, acentos y sin datos de contacto o saldos', async () => {
    const original = turno.deportistas.map((d) => d.nombre)
    const buffer = await crearExcelListaTurno(turno)
    const workbook = new Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.getWorksheet('Deportistas')!
    expect(sheet.columnCount).toBe(1)
    expect(sheet.rowCount).toBe(5)
    expect(sheet.getCell('A3').value).toBe('Ana María Álvarez')
    expect(sheet.getCell('A4').value).toBe('=SUM(A1:A2) Prueba')
    expect(sheet.getCell('A4').type).toBe(3) // Texto, nunca una fórmula ejecutable.
    expect(sheet.getCell('A5').value).toBe('José Zúñiga')
    expect(JSON.stringify(sheet.getSheetValues())).not.toContain('@example.com')
    expect(turno.deportistas.map((d) => d.nombre)).toEqual(original)
    expect(sheet.pageSetup.printTitlesRow).toBe('1:2')
  })

  it('genera un PDF con varias páginas sin omitir el último deportista', async () => {
    const pdf = await crearPdfListaTurno({ ...turno, deportistas: Array.from({ length: 100 }, (_, i) => ({ nombre: `Persona ${String(i).padStart(3, '0')}`, apellidos: 'Apellido de prueba largo para la lista' })) })
    expect(pdf.getNumberOfPages()).toBeGreaterThan(1)
    const content = pdf.output()
    expect(content.startsWith('%PDF-')).toBe(true)
    expect(content).toContain('Persona 000')
    expect(content).toContain('Persona 099')
    expect(content).not.toContain('@example.com')
  })

  it('produce nombres de archivo válidos y admite listas vacías', () => {
    expect(archivoListaTurno(turno)).toBe('lista-Manana-Basquet-08-00')
    expect(nombresListaTurno({ ...turno, deportistas: [] })).toEqual([])
  })
})
