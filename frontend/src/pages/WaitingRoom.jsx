import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useGame } from '../context/GameContext'

export default function WaitingRoom() {
  const { id }              = useParams()
  const navigate            = useNavigate()
  const { state, dispatch } = useGame()
  const [room, setRoom]     = useState(state.room)
  const [starting, setStarting] = useState(false)
  const [error, setError]   = useState('')
  const [copied, setCopied] = useState(false)

  const isHost = room?.host_id === state.user?.id

  // Fetch room if not already in context
  useEffect(() => {
    if (!room) {
      api('GET', `/rooms/${id}`)
        .then(r => { setRoom(r); dispatch({ type: 'SET_ROOM', payload: r }) })
        .catch(console.error)
    }
  }, [id]) // eslint-disable-line

  // Poll for player joins and game start
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const updated = await api('GET', `/rooms/${id}`)
        setRoom(updated)
        dispatch({ type: 'SET_ROOM', payload: updated })
        if (updated.status === 'in_progress') {
          clearInterval(interval)
          navigate(`/game/${id}`)
        }
      } catch { /* silent */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [id, navigate, dispatch])

  async function handleStart() {
    setStarting(true); setError('')
    try {
      const data = await api('POST', `/game/start/${id}`)
      dispatch({ type: 'SET_WORD', payload: data.word })
      navigate(`/game/${id}`)
    } catch (err) {
      setError(err.message || 'Failed to start')
    } finally {
      setStarting(false)
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!room) {
    return <div className="page-center"><div className="spinner" /></div>
  }

  const canStart = room.players.length >= 2

  return (
    <div className="page-center">
      <div className="waiting-card">

        {/* Room code */}
        <div className="room-code-display">
          <span className="label">Share this code with friends</span>
          <div className="code-row">
            <span className="code">{id}</span>
            <button onClick={copyCode} className="btn-icon" title="Copy code">
              {copied ? '✅' : '📋'}
            </button>
          </div>
        </div>

        {/* Settings summary */}
        <div className="room-settings-summary">
          <span>🔄 {room.turns} turns</span>
          <span>⏱ {room.turn_duration}s / turn</span>
          <span>👥 {room.players.length} / 8</span>
        </div>

        {/* Players list */}
        <div className="players-section">
          <h3>Players</h3>
          <ul className="players-list">
            {room.players.map(p => (
              <li key={p.id} className="player-item">
                <span className="player-name">{p.name}</span>
                {p.id === room.host_id && <span className="badge-host">👑 Host</span>}
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="error">{error}</p>}

        {/* Action */}
        {isHost ? (
          <button
            onClick={handleStart}
            className="btn btn-primary btn-large"
            disabled={!canStart || starting}
          >
            {starting
              ? 'Starting…'
              : canStart
                ? '🚀 Start Game'
                : 'Need at least 2 players'}
          </button>
        ) : (
          <div className="waiting-message">
            <div className="dots"><span /><span /><span /></div>
            Waiting for host to start
          </div>
        )}

      </div>
    </div>
  )
}
