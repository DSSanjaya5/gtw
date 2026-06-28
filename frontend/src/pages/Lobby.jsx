import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useGame } from '../context/GameContext'

const fmtDuration = s => s >= 60 ? `${Math.round(s / 60)} min` : `${s}s`

export default function Lobby() {
  const { state, dispatch } = useGame()
  const navigate            = useNavigate()

  // Create room form
  const [turns, setTurns]         = useState(3)
  const [duration, setDuration]   = useState(120)
  const [creating, setCreating]   = useState(false)
  const [createErr, setCreateErr] = useState('')

  // Join room form
  const [code, setCode]     = useState('')
  const [joining, setJoining] = useState(false)
  const [joinErr, setJoinErr] = useState('')

  async function handleCreate(e) {
    e.preventDefault(); setCreating(true); setCreateErr('')
    try {
      const room = await api('POST', '/rooms', { turns, turn_duration: duration })
      dispatch({ type: 'SET_ROOM', payload: room })
      navigate(`/room/${room.room_id}`)
    } catch (err) { setCreateErr(err.message || 'Failed to create room') }
    finally { setCreating(false) }
  }

  async function handleJoin(e) {
    e.preventDefault()
    if (!code.trim()) return
    setJoining(true); setJoinErr('')
    try {
      const room = await api('POST', '/rooms/join', { room_id: code.trim().toUpperCase() })
      dispatch({ type: 'SET_ROOM', payload: room })
      navigate(`/room/${room.room_id}`)
    } catch (err) { setJoinErr(err.message || 'Room not found or full') }
    finally { setJoining(false) }
  }

  function logout() { dispatch({ type: 'LOGOUT' }); navigate('/') }

  return (
    <div className="page">
      <header className="header">
        <div className="header-logo">🔤 GTW</div>
        <div className="header-user">
          <span>👤 {state.user?.name}</span>
          <button onClick={logout} className="btn-ghost">Logout</button>
        </div>
      </header>

      <main className="lobby-main">
        <p className="lobby-title">Ready to play?</p>

        <div className="lobby-cards">
          {/* ── Create Room ─────────────────── */}
          <div className="card">
            <h3>🎮 Create Room</h3>
            <form onSubmit={handleCreate} className="form">
              <div className="form-group">
                <label>Turns: <strong>{turns}</strong></label>
                <input type="range" min={2} max={10} value={turns}
                  onChange={e => setTurns(+e.target.value)} />
                <div className="range-labels"><span>2</span><span>10</span></div>
              </div>

              <div className="form-group">
                <label>Time per turn: <strong>{fmtDuration(duration)}</strong></label>
                <input type="range" min={60} max={180} step={30} value={duration}
                  onChange={e => setDuration(+e.target.value)} />
                <div className="range-labels"><span>1 min</span><span>3 min</span></div>
              </div>

              <p className="form-summary">{turns} turns · {fmtDuration(duration)} each</p>
              {createErr && <p className="error">{createErr}</p>}

              <button type="submit" className="btn btn-primary btn-large" disabled={creating}>
                {creating ? 'Creating…' : 'Create Room'}
              </button>
            </form>
          </div>

          {/* ── Join Room ───────────────────── */}
          <div className="card">
            <h3>🚪 Join Room</h3>
            <form onSubmit={handleJoin} className="form">
              <div className="form-group">
                <label>Room Code</label>
                <input
                  type="text"
                  placeholder="e.g. ABC123"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="room-code-input"
                  autoComplete="off"
                />
              </div>
              {joinErr && <p className="error">{joinErr}</p>}
              <button type="submit" className="btn btn-primary btn-large"
                disabled={joining || !code.trim()}>
                {joining ? 'Joining…' : 'Join Room'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
