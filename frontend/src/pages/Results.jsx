import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useGame } from '../context/GameContext'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Results() {
  const { id }              = useParams()
  const navigate            = useNavigate()
  const { state, dispatch } = useGame()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('GET', `/rooms/${id}`)
      .then(room => {
        const sorted = [...room.players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        setPlayers(sorted)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  function playAgain() { dispatch({ type: 'RESET_GAME' }); navigate('/lobby') }
  function leave()     { dispatch({ type: 'LOGOUT' });     navigate('/') }

  if (loading) {
    return <div className="page-center"><div className="spinner" /></div>
  }

  const winner = players[0]

  return (
    <div className="page-center">
      <div className="results-card">

        <div className="results-header">
          <h1 className="results-title">🎉 Game Over!</h1>
          {winner && (
            <p className="results-winner">
              🏆 {winner.name} wins with {winner.score ?? 0} pts!
            </p>
          )}
        </div>

        <div className="scoreboard">
          {players.map((p, i) => (
            <div
              key={p.id}
              className={[
                'score-row',
                i === 0 ? 'winner' : '',
                p.id === state.user?.id ? 'me' : '',
              ].filter(Boolean).join(' ')}
            >
              <span className="medal">{MEDALS[i] ?? `${i + 1}.`}</span>
              <span className="player-name">{p.name}</span>
              <span className="score">{p.score ?? 0} pts</span>
            </div>
          ))}
        </div>

        <div className="results-actions">
          <button onClick={playAgain} className="btn btn-primary" style={{ flex: 1 }}>
            🔄 Play Again
          </button>
          <button onClick={leave} className="btn btn-ghost">
            Leave
          </button>
        </div>

      </div>
    </div>
  )
}
