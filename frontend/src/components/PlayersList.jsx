export default function PlayersList({ players, drawerId, userId }) {
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0))
  
  const ITEM_HEIGHT = 44
  const ITEM_GAP = 6

  return (
    <div className="players-panel">
      <h4>Players</h4>
      <div 
        className="players-score-list-container" 
        style={{ 
          position: 'relative', 
          height: players.length * (ITEM_HEIGHT + ITEM_GAP),
          transition: 'height 0.3s'
        }}
      >
        {players.map((p) => {
          const rankIndex = sorted.findIndex(item => item.id === p.id)
          const top = rankIndex * (ITEM_HEIGHT + ITEM_GAP)

          return (
            <div
              key={p.id}
              className={[
                'ps-item',
                p.id === userId   ? 'ps-me'     : '',
                p.id === drawerId ? 'ps-drawer' : '',
              ].filter(Boolean).join(' ')}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: ITEM_HEIGHT,
                transform: `translateY(${top}px)`,
                transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s, background-color 0.3s',
              }}
            >
              <span className="ps-rank">#{rankIndex + 1}</span>
              <span className="ps-avatar">{p.name[0].toUpperCase()}</span>
              <span className="ps-name">
                {p.id === drawerId && '🎨 '}
                {p.name}
                {p.id === userId   && ' (you)'}
              </span>
              <span className="ps-score">{p.score || 0}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
