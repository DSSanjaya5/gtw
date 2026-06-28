const COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6',
  '#EC4899', '#78350F', '#6B7280', '#06B6D4',
]

const WIDTHS = [
  { value: 2,  label: '·' },
  { value: 5,  label: '•' },
  { value: 10, label: '●' },
  { value: 18, label: '⬤' },
]

export default function Toolbar({ color, lineWidth, tool, onColor, onLineWidth, onTool, onClear }) {
  return (
    <div className="toolbar">
      {/* Tool buttons */}
      <div className="toolbar-group">
        <button
          className={`tool-btn${tool === 'pencil' ? ' active' : ''}`}
          onClick={() => onTool('pencil')}
          title="Pencil"
        >✏️</button>
        <button
          className={`tool-btn${tool === 'eraser' ? ' active' : ''}`}
          onClick={() => onTool('eraser')}
          title="Eraser"
        >🧹</button>
      </div>

      {/* Color palette */}
      <div className="color-palette">
        {COLORS.map(c => (
          <button
            key={c}
            className={`color-swatch${color === c && tool === 'pencil' ? ' active' : ''}`}
            style={{ background: c, border: c === '#FFFFFF' ? '1px solid #ccc' : 'none' }}
            onClick={() => { onColor(c); onTool('pencil') }}
            title={c}
          />
        ))}
      </div>

      {/* Line width */}
      <div className="toolbar-group">
        {WIDTHS.map(w => (
          <button
            key={w.value}
            className={`tool-btn width-btn${lineWidth === w.value ? ' active' : ''}`}
            onClick={() => onLineWidth(w.value)}
            title={`${w.value}px`}
          >
            <span style={{ fontSize: w.value < 5 ? '0.6rem' : w.value < 10 ? '0.9rem' : w.value < 15 ? '1.3rem' : '1.8rem' }}>
              {w.label}
            </span>
          </button>
        ))}
      </div>

      {/* Clear */}
      <button className="tool-btn clear-btn" onClick={onClear} title="Clear canvas">
        🗑️ Clear
      </button>
    </div>
  )
}
