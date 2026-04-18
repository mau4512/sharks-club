'use client'

import { useRef, useState, useEffect } from 'react'
import { Eraser, Trash2, Download, Undo } from 'lucide-react'
import { Button } from './ui/Button'

interface PizarraTacticaProps {
  tipo: 'media' | 'completa'
  onSave?: (imageData: string) => void
  initialData?: string
}

interface Stroke {
  points: { x: number; y: number }[]
  color: string
  lineWidth: number
  tool: 'pen' | 'eraser' | 'shape'
}

type ShapeType = 'ball' | 'cone' | 'player-offense' | 'player-defense' | 'arrow' | 'dashed-arrow'

interface Shape {
  type: ShapeType
  x: number
  y: number
  label?: string
}

export default function PizarraTactica({ tipo, onSave, initialData }: PizarraTacticaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#EF4444') // Rojo por defecto
  const [lineWidth, setLineWidth] = useState(3)
  const [tool, setTool] = useState<'pen' | 'eraser' | 'shape'>('pen')
  const [selectedShape, setSelectedShape] = useState<ShapeType | null>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [shapes, setShapes] = useState<Shape[]>([])
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([])
  const courtImageRef = useRef<HTMLImageElement | null>(null)

  const colors = [
    { name: 'Rojo', value: '#EF4444' },
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Amarillo', value: '#F59E0B' },
    { name: 'Negro', value: '#000000' },
    { name: 'Blanco', value: '#FFFFFF' }
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Cargar imagen de la cancha
    const img = new Image()
    img.onload = () => {
      courtImageRef.current = img
      redrawCanvas()
    }
    
    img.src = tipo === 'media' ? '/images/middle_court.jpg' : '/images/full_court.jpg'
  }, [tipo])

  useEffect(() => {
    if (courtImageRef.current) {
      redrawCanvas()
    }
  }, [strokes, shapes])

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.globalCompositeOperation = 'source-over'
    
    switch (shape.type) {
      case 'ball':
        // Balón de baloncesto
        ctx.fillStyle = '#FF6B35'
        ctx.beginPath()
        ctx.arc(shape.x, shape.y, 15, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 1
        ctx.stroke()
        // Líneas del balón
        ctx.beginPath()
        ctx.moveTo(shape.x - 15, shape.y)
        ctx.lineTo(shape.x + 15, shape.y)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(shape.x, shape.y, 15, -Math.PI/4, Math.PI/4)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(shape.x, shape.y, 15, 3*Math.PI/4, 5*Math.PI/4)
        ctx.stroke()
        break
        
      case 'cone':
        // Cono
        ctx.fillStyle = '#F59E0B'
        ctx.beginPath()
        ctx.moveTo(shape.x, shape.y - 20)
        ctx.lineTo(shape.x - 10, shape.y + 10)
        ctx.lineTo(shape.x + 10, shape.y + 10)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = '#DC2626'
        ctx.lineWidth = 2
        ctx.stroke()
        break
        
      case 'player-offense':
        // Jugador ofensivo (círculo azul)
        ctx.fillStyle = '#3B82F6'
        ctx.beginPath()
        ctx.arc(shape.x, shape.y, 18, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#1E40AF'
        ctx.lineWidth = 2
        ctx.stroke()
        if (shape.label) {
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 14px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(shape.label, shape.x, shape.y)
        }
        break
        
      case 'player-defense':
        // Jugador defensivo (círculo rojo)
        ctx.fillStyle = '#EF4444'
        ctx.beginPath()
        ctx.arc(shape.x, shape.y, 18, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#991B1B'
        ctx.lineWidth = 2
        ctx.stroke()
        if (shape.label) {
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 14px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(shape.label, shape.x, shape.y)
        }
        break
        
      case 'arrow':
        // Flecha sólida
        ctx.strokeStyle = '#000000'
        ctx.fillStyle = '#000000'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(shape.x, shape.y)
        ctx.lineTo(shape.x + 60, shape.y)
        ctx.stroke()
        // Punta de flecha
        ctx.beginPath()
        ctx.moveTo(shape.x + 60, shape.y)
        ctx.lineTo(shape.x + 50, shape.y - 8)
        ctx.lineTo(shape.x + 50, shape.y + 8)
        ctx.closePath()
        ctx.fill()
        break
        
      case 'dashed-arrow':
        // Flecha punteada (movimiento)
        ctx.strokeStyle = '#6B7280'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(shape.x, shape.y)
        ctx.lineTo(shape.x + 60, shape.y)
        ctx.stroke()
        ctx.setLineDash([])
        // Punta de flecha
        ctx.fillStyle = '#6B7280'
        ctx.beginPath()
        ctx.moveTo(shape.x + 60, shape.y)
        ctx.lineTo(shape.x + 50, shape.y - 8)
        ctx.lineTo(shape.x + 50, shape.y + 8)
        ctx.closePath()
        ctx.fill()
        break
    }
  }

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height)

    // Dibujar imagen de la cancha
    if (courtImageRef.current) {
      ctx.drawImage(courtImageRef.current, 0, 0, width, height)
    }

    // Redibujar todos los trazos guardados (excepto los de borrador)
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return
      
      // Saltar trazos de borrador, solo dibujar trazos de pen
      if (stroke.tool === 'eraser') return

      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.lineWidth
      
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      
      ctx.stroke()
    })

    // Dibujar todas las figuras
    shapes.forEach(shape => {
      drawShape(ctx, shape)
    })

    // Restaurar composición normal
    ctx.globalCompositeOperation = 'source-over'
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    // Si estamos en modo figura, colocar la figura
    if (tool === 'shape' && selectedShape) {
      const newShape: Shape = {
        type: selectedShape,
        x,
        y,
        label: selectedShape.includes('player') ? '1' : undefined
      }
      setShapes(prev => [...prev, newShape])
      return
    }

    // Si no, dibujar normalmente
    setIsDrawing(true)
    setCurrentStroke([{ x, y }])
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    setCurrentStroke(prev => [...prev, { x, y }])

    // Solo dibujar temporalmente si NO es borrador
    if (tool === 'eraser') {
      // Para el borrador, solo mostrar indicador visual sin borrar
      return
    }

    // Dibujar el segmento actual temporalmente para pen
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (currentStroke.length > 0) {
      const lastPoint = currentStroke[currentStroke.length - 1]
      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    
    if (currentStroke.length > 0 && tool !== 'eraser') {
      // Solo guardar trazos de pen, no de borrador
      const newStroke: Stroke = {
        points: currentStroke,
        color: color,
        lineWidth: lineWidth,
        tool: tool
      }
      setStrokes(prev => [...prev, newStroke])
      setCurrentStroke([])
    } else if (tool === 'eraser' && currentStroke.length > 0) {
      // Para el borrador, encontrar y eliminar elementos que intersectan
      removeIntersectingElements(currentStroke)
      setCurrentStroke([])
    }

    const canvas = canvasRef.current
    if (!canvas) return

    // Guardar el estado actual
    if (onSave) {
      const imageData = canvas.toDataURL()
      onSave(imageData)
    }
  }

  const removeIntersectingElements = (eraserPath: { x: number; y: number }[]) => {
    const eraserRadius = lineWidth * 3

    // Filtrar strokes que intersectan con el trazo del borrador
    const newStrokes = strokes.filter(stroke => {
      // Verificar si algún punto del stroke está cerca del trazo del borrador
      return !stroke.points.some(point => {
        return eraserPath.some(eraserPoint => {
          const distance = Math.sqrt(
            Math.pow(point.x - eraserPoint.x, 2) + Math.pow(point.y - eraserPoint.y, 2)
          )
          return distance < eraserRadius
        })
      })
    })

    // Filtrar shapes que intersectan con el trazo del borrador
    const newShapes = shapes.filter(shape => {
      return !eraserPath.some(eraserPoint => {
        const distance = Math.sqrt(
          Math.pow(shape.x - eraserPoint.x, 2) + Math.pow(shape.y - eraserPoint.y, 2)
        )
        return distance < 25 // Radio aproximado de las figuras
      })
    })

    setStrokes(newStrokes)
    setShapes(newShapes)
  }

  const undoLastAction = () => {
    // Deshacer el último trazo o figura
    if (shapes.length > 0 && strokes.length > 0) {
      // Comparar cuál fue el último agregado (simplificado)
      setShapes(prev => prev.slice(0, -1))
    } else if (shapes.length > 0) {
      setShapes(prev => prev.slice(0, -1))
    } else if (strokes.length > 0) {
      setStrokes(prev => prev.slice(0, -1))
    }
  }

  const clearCanvas = () => {
    setStrokes([])
    setShapes([])
    setCurrentStroke([])
    redrawCanvas()

    const canvas = canvasRef.current
    if (canvas && onSave) {
      const imageData = canvas.toDataURL()
      onSave(imageData)
    }
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `jugada-${tipo}-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="space-y-3">
      {/* Herramientas */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Colores */}
        <div className="flex gap-1">
          {colors.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setColor(c.value)
                setTool('pen')
                setSelectedShape(null)
              }}
              className={`w-8 h-8 rounded-full border-2 transition ${
                color === c.value && tool === 'pen'
                  ? 'border-primary-600 scale-110'
                  : 'border-gray-300 hover:scale-105'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>

        {/* Grosor */}
        <select
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="px-2 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="2">Fino</option>
          <option value="3">Medio</option>
          <option value="5">Grueso</option>
        </select>

        {/* Borrador */}
        <button
          onClick={() => {
            setTool(tool === 'eraser' ? 'pen' : 'eraser')
            setSelectedShape(null)
          }}
          className={`p-2 rounded ${
            tool === 'eraser'
              ? 'bg-primary-100 text-primary-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="Borrador"
        >
          <Eraser className="h-4 w-4" />
        </button>

        {/* Deshacer */}
        <button
          onClick={undoLastAction}
          disabled={strokes.length === 0 && shapes.length === 0}
          className={`p-2 rounded ${
            strokes.length === 0 && shapes.length === 0
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
          }`}
          title="Deshacer último"
        >
          <Undo className="h-4 w-4" />
        </button>

        {/* Limpiar */}
        <button
          onClick={clearCanvas}
          className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
          title="Limpiar todo"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Descargar */}
        <button
          onClick={downloadImage}
          className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
          title="Descargar imagen"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {/* Figuras predefinidas */}
      <div className="border-2 border-primary-200 bg-primary-50 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-700 mb-2">Herramientas de Entrenador:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setTool('shape')
              setSelectedShape('ball')
            }}
            className={`px-3 py-2 text-sm rounded border-2 transition ${
              selectedShape === 'ball'
                ? 'border-primary-600 bg-primary-100 font-semibold'
                : 'border-gray-300 bg-white hover:border-primary-400'
            }`}
          >
            🏀 Balón
          </button>
          <button
            onClick={() => {
              setTool('shape')
              setSelectedShape('cone')
            }}
            className={`px-3 py-2 text-sm rounded border-2 transition ${
              selectedShape === 'cone'
                ? 'border-primary-600 bg-primary-100 font-semibold'
                : 'border-gray-300 bg-white hover:border-primary-400'
            }`}
          >
            🔺 Cono
          </button>
          <button
            onClick={() => {
              setTool('shape')
              setSelectedShape('player-offense')
            }}
            className={`px-3 py-2 text-sm rounded border-2 transition ${
              selectedShape === 'player-offense'
                ? 'border-primary-600 bg-primary-100 font-semibold'
                : 'border-gray-300 bg-white hover:border-primary-400'
            }`}
          >
            🔵 Ataque
          </button>
          <button
            onClick={() => {
              setTool('shape')
              setSelectedShape('player-defense')
            }}
            className={`px-3 py-2 text-sm rounded border-2 transition ${
              selectedShape === 'player-defense'
                ? 'border-primary-600 bg-primary-100 font-semibold'
                : 'border-gray-300 bg-white hover:border-primary-400'
            }`}
          >
            🔴 Defensa
          </button>
          <button
            onClick={() => {
              setTool('shape')
              setSelectedShape('arrow')
            }}
            className={`px-3 py-2 text-sm rounded border-2 transition ${
              selectedShape === 'arrow'
                ? 'border-primary-600 bg-primary-100 font-semibold'
                : 'border-gray-300 bg-white hover:border-primary-400'
            }`}
          >
            ➡️ Flecha
          </button>
          <button
            onClick={() => {
              setTool('shape')
              setSelectedShape('dashed-arrow')
            }}
            className={`px-3 py-2 text-sm rounded border-2 transition ${
              selectedShape === 'dashed-arrow'
                ? 'border-primary-600 bg-primary-100 font-semibold'
                : 'border-gray-300 bg-white hover:border-primary-400'
            }`}
          >
            ⤏ Movimiento
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={tipo === 'media' ? 400 : 400}
          height={tipo === 'media' ? 300 : 600}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={tool === 'shape' ? 'cursor-pointer w-full' : 'cursor-crosshair w-full'}
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  )
}
