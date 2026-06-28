import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const W = 800   // internal canvas resolution
const H = 500

/**
 * Shared canvas for both drawer and guessers.
 *
 * Drawer:  pointer events → draw locally + call onStroke(stroke)
 * Guesser: read-only; parent calls ref.applyStroke() / ref.clearCanvas()
 */
const Canvas = forwardRef(function Canvas(
  { isDrawer, color, lineWidth, tool, onStroke },
  ref,
) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)
  const last      = useRef({ x: 0, y: 0 })

  // Expose imperative API to parent (Game.jsx)
  useImperativeHandle(ref, () => ({
    applyStroke(s) {
      draw(s.x0, s.y0, s.x1, s.y1, s.color, s.lineWidth)
    },
    clearCanvas() {
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, W, H)
    },
  }))

  // White background on mount
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, W, H)
  }, [])

  function draw(x0, y0, x1, y1, strokeColor, width) {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth   = width
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
  }

  function getPos(e) {
    const rect   = canvasRef.current.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const src    = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    }
  }

  function handleDown(e) {
    if (!isDrawer) return
    e.preventDefault()
    drawing.current = true
    last.current = getPos(e)
  }

  function handleMove(e) {
    if (!isDrawer || !drawing.current) return
    e.preventDefault()
    const pos         = getPos(e)
    const strokeColor = tool === 'eraser' ? '#FFFFFF' : color
    draw(last.current.x, last.current.y, pos.x, pos.y, strokeColor, lineWidth)
    onStroke({ type: 'draw', x0: last.current.x, y0: last.current.y, x1: pos.x, y1: pos.y, color: strokeColor, lineWidth })
    last.current = pos
  }

  function handleUp() {
    drawing.current = false
  }

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className={`game-canvas${isDrawer ? ' game-canvas--active' : ''}`}
      style={{ touchAction: 'none' }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
    />
  )
})

export default Canvas
