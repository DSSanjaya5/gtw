import { useEffect, useState } from 'react'

export default function TurnOverOverlay({ word, players, prevPlayers, status, onFinished }) {
  const [secondsLeft, setSecondsLeft] = useState(5)

  useEffect(() => {
    if (secondsLeft <= 0) {
      onFinished?.()
      return
    }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft, onFinished])

  // Map previous scores for earned calculations
  const prevScores = {}
  if (Array.isArray(prevPlayers)) {
    prevPlayers.forEach(p => {
      prevScores[p.id] = p.score || 0
    })
  }

  // Sort by current scores
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0))

  const ITEM_HEIGHT = 40
  const ITEM_GAP = 6

  return (
    <div className="word-picker-overlay">
      <div className="word-picker-card turn-over-card">
        <h2 className="turn-over-title">
          {status === 'game_over' ? '🏁 Game Over!' : '⏰ Round Over!'}
        </h2>
        
        <p className="turn-over-word-label">The word was</p>
        <h3 className="turn-over-word">{word?.toUpperCase()}</h3>
        
        <div className="turn-over-leaderboard">
          <h4>Standings</h4>
          <div 
            className="to-list"
            style={{
              position: 'relative',
              height: players.length * (ITEM_HEIGHT + ITEM_GAP),
              transition: 'height 0.3s'
            }}
          >
            {players.map((p) => {
              const rankIndex = sorted.findIndex(item => item.id === p.id)
              const top = rankIndex * (ITEM_HEIGHT + ITEM_GAP)
              
              const prev = prevScores[p.id] !== undefined ? prevScores[p.id] : 0
              const earned = (p.score || 0) - prev

              return (
                <div 
                  key={p.id} 
                  className="to-row"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: ITEM_HEIGHT,
                    transform: `translateY(${top}px)`,
                    transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="to-rank">#{rankIndex + 1}</span>
                    <span className="to-name">{p.name}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="to-score">{p.score || 0} pts</span>
                    {earned > 0 && (
                      <span className="to-earned">+{earned}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="turn-over-countdown">
          {status === 'game_over' 
            ? 'Calculating final rankings…' 
            : `Next round starts in ${secondsLeft}s…`
          }
        </p>
      </div>
    </div>
  )
}
