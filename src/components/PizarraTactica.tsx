'use client'

import { useRef, useState, useEffect } from 'react'
import {
  Circle,
  Cone,
  Download,
  Eraser,
  MousePointer2,
  MoveRight,
  Pencil,
  RotateCcw,
  Trash2,
  Undo,
  Waves,
} from 'lucide-react'

interface PizarraTacticaProps {
  tipo: 'media' | 'completa'
  onSave?: (imageData: string) => void
  initialData?: string
}

interface Point {
  x: number
  y: number
}

interface Stroke {
  points: Point[]
  color: string
  lineWidth: number
}

type Tool = 'select' | 'pen' | 'eraser' | 'shape'
type ShapeType =
  | 'ball'
  | 'cone'
  | 'player-offense'
  | 'player-defense'
  | 'cut-arrow'
  | 'dribble-arrow'
  | 'pass-arrow'

interface Shape {
  type: ShapeType
  x: number
  y: number
  endX?: number
  endY?: number
  label?: string
}

type DragState =
  | { kind: 'stroke' }
  | { kind: 'shape'; index: number; offsetX: number; offsetY: number }
  | { kind: 'arrow-start'; index: number }
  | { kind: 'arrow-end'; index: number }
  | null

const ARROW_TYPES: ShapeType[] = ['cut-arrow', 'dribble-arrow', 'pass-arrow']
const PLAYER_RADIUS = 18
const HANDLE_RADIUS = 7

export default function PizarraTactica({ tipo, onSave }: PizarraTacticaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const courtImageRef = useRef<HTMLImageElement | null>(null)

  const [color, setColor] = useState('#EF4444')
  const [lineWidth, setLineWidth] = useState(3)
  const [tool, setTool] = useState<Tool>('select')
  const [selectedShape, setSelectedShape] = useState<ShapeType | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [shapes, setShapes] = useState<Shape[]>([])
  const [currentStroke, setCurrentStroke] = useState<Point[]>([])
  const [dragState, setDragState] = useState<DragState>(null)

  const colors = [
    { name: 'Rojo', value: '#EF4444' },
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Amarillo', value: '#F59E0B' },
    { name: 'Negro', value: '#000000' },
    { name: 'Blanco', value: '#FFFFFF' },
  ]

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      courtImageRef.current = img
      redrawCanvas()
    }
    img.src = tipo === 'media' ? '/images/middle_court.jpg' : '/images/full_court.jpg'
  }, [tipo])

  useEffect(() => {
    redrawCanvas()
  }, [strokes, shapes, selectedIndex])

  useEffect(() => {
    saveSnapshot()
  }, [strokes, shapes])

  const isArrow = (shape: Shape) => ARROW_TYPES.includes(shape.type)

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY

    if (clientX === undefined || clientY === undefined) return null

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

  const distanceToSegment = (point: Point, start: Point, end: Point) => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const lengthSq = dx * dx + dy * dy

    if (lengthSq === 0) return distance(point, start)

    const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq))
    return distance(point, { x: start.x + t * dx, y: start.y + t * dy })
  }

  const getArrowEnd = (shape: Shape): Point => ({
    x: shape.endX ?? shape.x + 70,
    y: shape.endY ?? shape.y,
  })

  const hitTestShape = (point: Point) => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i]

      if (isArrow(shape)) {
        const start = { x: shape.x, y: shape.y }
        const end = getArrowEnd(shape)
        if (distance(point, start) <= HANDLE_RADIUS + 4) return { index: i, part: 'start' as const }
        if (distance(point, end) <= HANDLE_RADIUS + 4) return { index: i, part: 'end' as const }
        if (distanceToSegment(point, start, end) <= 12) return { index: i, part: 'body' as const }
        continue
      }

      const radius = shape.type === 'cone' ? 22 : PLAYER_RADIUS + 4
      if (distance(point, shape) <= radius) return { index: i, part: 'body' as const }
    }

    return null
  }

  const drawArrowHead = (ctx: CanvasRenderingContext2D, start: Point, end: Point, colorValue: string) => {
    const angle = Math.atan2(end.y - start.y, end.x - start.x)
    const size = 12

    ctx.fillStyle = colorValue
    ctx.beginPath()
    ctx.moveTo(end.x, end.y)
    ctx.lineTo(end.x - size * Math.cos(angle - Math.PI / 6), end.y - size * Math.sin(angle - Math.PI / 6))
    ctx.lineTo(end.x - size * Math.cos(angle + Math.PI / 6), end.y - size * Math.sin(angle + Math.PI / 6))
    ctx.closePath()
    ctx.fill()
  }

  const drawDribbleArrow = (ctx: CanvasRenderingContext2D, start: Point, end: Point) => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.hypot(dx, dy)
    const angle = Math.atan2(dy, dx)
    const amplitude = 8
    const waves = Math.max(2, Math.floor(length / 35))
    const segments = waves * 18

    ctx.save()
    ctx.translate(start.x, start.y)
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(0, 0)

    for (let i = 1; i <= segments; i++) {
      const x = (length * i) / segments
      const y = Math.sin((i / segments) * waves * Math.PI * 2) * amplitude
      ctx.lineTo(x, y)
    }

    ctx.stroke()
    ctx.restore()
  }

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape, isSelected = false) => {
    ctx.globalCompositeOperation = 'source-over'
    ctx.setLineDash([])

    switch (shape.type) {
      case 'ball':
        ctx.fillStyle = '#FF6B35'
        ctx.beginPath()
        ctx.arc(shape.x, shape.y, 15, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(shape.x - 15, shape.y)
        ctx.lineTo(shape.x + 15, shape.y)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(shape.x, shape.y, 15, -Math.PI / 4, Math.PI / 4)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(shape.x, shape.y, 15, (3 * Math.PI) / 4, (5 * Math.PI) / 4)
        ctx.stroke()
        break

      case 'cone':
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
      case 'player-defense': {
        const offense = shape.type === 'player-offense'
        ctx.fillStyle = offense ? '#3B82F6' : '#EF4444'
        ctx.beginPath()
        ctx.arc(shape.x, shape.y, PLAYER_RADIUS, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = offense ? '#1E40AF' : '#991B1B'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(shape.label || '1', shape.x, shape.y)
        break
      }

      case 'cut-arrow':
      case 'pass-arrow':
      case 'dribble-arrow': {
        const start = { x: shape.x, y: shape.y }
        const end = getArrowEnd(shape)
        const arrowColor = shape.type === 'pass-arrow' ? '#6B7280' : '#000000'

        ctx.strokeStyle = arrowColor
        ctx.fillStyle = arrowColor
        ctx.lineWidth = shape.type === 'pass-arrow' ? 2.5 : 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.setLineDash(shape.type === 'pass-arrow' ? [8, 7] : [])

        if (shape.type === 'dribble-arrow') {
          ctx.setLineDash([])
          drawDribbleArrow(ctx, start, end)
        } else {
          ctx.beginPath()
          ctx.moveTo(start.x, start.y)
          ctx.lineTo(end.x, end.y)
          ctx.stroke()
        }

        ctx.setLineDash([])
        drawArrowHead(ctx, start, end, arrowColor)
        break
      }
    }

    if (isSelected) drawSelection(ctx, shape)
  }

  const drawSelection = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.save()
    ctx.strokeStyle = '#2563EB'
    ctx.fillStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])

    if (isArrow(shape)) {
      const start = { x: shape.x, y: shape.y }
      const end = getArrowEnd(shape)
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
      ctx.setLineDash([])
      ;[start, end].forEach((point) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, HANDLE_RADIUS, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      })
    } else {
      ctx.beginPath()
      ctx.arc(shape.x, shape.y, shape.type === 'cone' ? 24 : 24, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.restore()
  }

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (courtImageRef.current) {
      ctx.drawImage(courtImageRef.current, 0, 0, canvas.width, canvas.height)
    }

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return

      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.lineWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }

      ctx.stroke()
    })

    shapes.forEach((shape, index) => {
      drawShape(ctx, shape, selectedIndex === index)
    })

    ctx.globalCompositeOperation = 'source-over'
    ctx.setLineDash([])
  }

  const saveSnapshot = () => {
    const canvas = canvasRef.current
    if (canvas && onSave) onSave(canvas.toDataURL())
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e)
    if (!point) return

    if (tool === 'select') {
      const hit = hitTestShape(point)
      if (!hit) {
        setSelectedIndex(null)
        setDragState(null)
        return
      }

      setSelectedIndex(hit.index)
      const shape = shapes[hit.index]

      if (hit.part === 'start') {
        setDragState({ kind: 'arrow-start', index: hit.index })
      } else if (hit.part === 'end') {
        setDragState({ kind: 'arrow-end', index: hit.index })
      } else {
        setDragState({ kind: 'shape', index: hit.index, offsetX: point.x - shape.x, offsetY: point.y - shape.y })
      }
      return
    }

    if (tool === 'shape' && selectedShape) {
      const newShape: Shape = ARROW_TYPES.includes(selectedShape)
        ? { type: selectedShape, x: point.x, y: point.y, endX: point.x + 80, endY: point.y }
        : {
            type: selectedShape,
            x: point.x,
            y: point.y,
            label: selectedShape.includes('player') ? String(shapes.filter((shape) => shape.type === selectedShape).length + 1) : undefined,
          }

      setShapes((prev) => [...prev, newShape])
      setSelectedIndex(shapes.length)
      setTool('select')
      setSelectedShape(null)
      return
    }

    setCurrentStroke([point])
    setDragState({ kind: 'stroke' })
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e)
    if (!point || !dragState) return

    if (dragState.kind === 'shape') {
      setShapes((prev) => prev.map((shape, index) => {
        if (index !== dragState.index) return shape

        const nextX = point.x - dragState.offsetX
        const nextY = point.y - dragState.offsetY

        if (isArrow(shape)) {
          const dx = (shape.endX ?? shape.x + 70) - shape.x
          const dy = (shape.endY ?? shape.y) - shape.y
          return { ...shape, x: nextX, y: nextY, endX: nextX + dx, endY: nextY + dy }
        }

        return { ...shape, x: nextX, y: nextY }
      }))
      return
    }

    if (dragState.kind === 'arrow-start') {
      setShapes((prev) => prev.map((shape, index) => index === dragState.index ? { ...shape, x: point.x, y: point.y } : shape))
      return
    }

    if (dragState.kind === 'arrow-end') {
      setShapes((prev) => prev.map((shape, index) => index === dragState.index ? { ...shape, endX: point.x, endY: point.y } : shape))
      return
    }

    setCurrentStroke((prev) => [...prev, point])

    if (tool === 'eraser') return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || currentStroke.length === 0) return

    const lastPoint = currentStroke[currentStroke.length - 1]
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!dragState) return

    if (dragState.kind === 'stroke' && currentStroke.length > 0) {
      if (tool === 'eraser') {
        removeIntersectingElements(currentStroke)
      } else {
        setStrokes((prev) => [...prev, { points: currentStroke, color, lineWidth }])
      }
      setCurrentStroke([])
    }

    setDragState(null)
    saveSnapshot()
  }

  const removeIntersectingElements = (eraserPath: Point[]) => {
    const eraserRadius = lineWidth * 3

    setStrokes((prev) => prev.filter((stroke) => !stroke.points.some((point) =>
      eraserPath.some((eraserPoint) => distance(point, eraserPoint) < eraserRadius)
    )))

    setShapes((prev) => prev.filter((shape) => {
      if (isArrow(shape)) {
        const start = { x: shape.x, y: shape.y }
        const end = getArrowEnd(shape)
        return !eraserPath.some((point) => distanceToSegment(point, start, end) < eraserRadius)
      }

      return !eraserPath.some((point) => distance(point, shape) < 25)
    }))
  }

  const undoLastAction = () => {
    setSelectedIndex(null)
    if (shapes.length > 0) {
      setShapes((prev) => prev.slice(0, -1))
      return
    }
    if (strokes.length > 0) setStrokes((prev) => prev.slice(0, -1))
  }

  const clearCanvas = () => {
    setStrokes([])
    setShapes([])
    setCurrentStroke([])
    setSelectedIndex(null)
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `jugada-${tipo}-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const chooseShape = (shape: ShapeType) => {
    setTool('shape')
    setSelectedShape(shape)
    setSelectedIndex(null)
  }

  const resetArrowDirection = () => {
    if (selectedIndex === null) return
    setShapes((prev) => prev.map((shape, index) => {
      if (index !== selectedIndex || !isArrow(shape)) return shape
      return { ...shape, endX: shape.x + 80, endY: shape.y }
    }))
  }

  const toolButtonClass = (active: boolean) =>
    `p-2 rounded ${active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`

  const shapeButtonClass = (active: boolean) =>
    `px-3 py-2 text-sm rounded border-2 transition ${active ? 'border-primary-600 bg-primary-100 font-semibold' : 'border-gray-300 bg-white hover:border-primary-400'}`

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => {
            setTool('select')
            setSelectedShape(null)
          }}
          className={toolButtonClass(tool === 'select')}
          title="Seleccionar y mover"
        >
          <MousePointer2 className="h-4 w-4" />
        </button>

        <button
          onClick={() => {
            setTool('pen')
            setSelectedShape(null)
            setSelectedIndex(null)
          }}
          className={toolButtonClass(tool === 'pen')}
          title="Dibujar libre"
        >
          <Pencil className="h-4 w-4" />
        </button>

        <div className="flex gap-1">
          {colors.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setColor(c.value)
                setTool('pen')
                setSelectedShape(null)
                setSelectedIndex(null)
              }}
              className={`w-8 h-8 rounded-full border-2 transition ${color === c.value && tool === 'pen' ? 'border-primary-600 scale-110' : 'border-gray-300 hover:scale-105'}`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>

        <select
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="px-2 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="2">Fino</option>
          <option value="3">Medio</option>
          <option value="5">Grueso</option>
        </select>

        <button
          onClick={() => {
            setTool('eraser')
            setSelectedShape(null)
            setSelectedIndex(null)
          }}
          className={toolButtonClass(tool === 'eraser')}
          title="Borrador"
        >
          <Eraser className="h-4 w-4" />
        </button>

        <button
          onClick={resetArrowDirection}
          disabled={selectedIndex === null || !isArrow(shapes[selectedIndex])}
          className={`p-2 rounded ${selectedIndex !== null && isArrow(shapes[selectedIndex]) ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
          title="Resetear dirección de flecha"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          onClick={undoLastAction}
          disabled={strokes.length === 0 && shapes.length === 0}
          className={`p-2 rounded ${strokes.length === 0 && shapes.length === 0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
          title="Deshacer último"
        >
          <Undo className="h-4 w-4" />
        </button>

        <button onClick={clearCanvas} className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200" title="Limpiar todo">
          <Trash2 className="h-4 w-4" />
        </button>

        <button onClick={downloadImage} className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200" title="Descargar imagen">
          <Download className="h-4 w-4" />
        </button>
      </div>

      <div className="border-2 border-primary-200 bg-primary-50 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-700 mb-2">Herramientas de Entrenador:</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => chooseShape('ball')} className={shapeButtonClass(selectedShape === 'ball')}>Balón</button>
          <button onClick={() => chooseShape('cone')} className={shapeButtonClass(selectedShape === 'cone')}>
            <Cone className="inline h-4 w-4 mr-1" />
            Cono
          </button>
          <button onClick={() => chooseShape('player-offense')} className={shapeButtonClass(selectedShape === 'player-offense')}>
            <Circle className="inline h-4 w-4 mr-1 fill-blue-500 text-blue-500" />
            Ataque
          </button>
          <button onClick={() => chooseShape('player-defense')} className={shapeButtonClass(selectedShape === 'player-defense')}>
            <Circle className="inline h-4 w-4 mr-1 fill-red-500 text-red-500" />
            Defensa
          </button>
          <button onClick={() => chooseShape('cut-arrow')} className={shapeButtonClass(selectedShape === 'cut-arrow')}>
            <MoveRight className="inline h-4 w-4 mr-1" />
            Corte sin balón
          </button>
          <button onClick={() => chooseShape('dribble-arrow')} className={shapeButtonClass(selectedShape === 'dribble-arrow')}>
            <Waves className="inline h-4 w-4 mr-1" />
            Penetración/bote
          </button>
          <button onClick={() => chooseShape('pass-arrow')} className={shapeButtonClass(selectedShape === 'pass-arrow')}>
            <MoveRight className="inline h-4 w-4 mr-1" />
            Pase discontinuo
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Usa seleccionar para mover elementos. En flechas, arrastra el punto inicial o final para cambiar dirección y largo.
        </p>
      </div>

      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={tipo === 'media' ? 300 : 600}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={tool === 'select' ? 'cursor-move w-full' : tool === 'shape' ? 'cursor-pointer w-full' : 'cursor-crosshair w-full'}
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  )
}
