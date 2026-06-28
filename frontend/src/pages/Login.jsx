import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useGame } from '../context/GameContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate                = useNavigate()
  const { dispatch }            = useGame()

  // Skip login if already authenticated
  useEffect(() => {
    if (localStorage.getItem('access_token')) navigate('/lobby')
  }, [navigate])

  async function handleLogin(e) {
    e.preventDefault()
    const name = username.trim()
    if (name.length < 3) { setError('Username must be at least 3 characters'); return }
    setLoading(true); setError('')
    try {
      const data = await api('POST', '/login', { username: name })
      localStorage.setItem('access_token', data.access_token)
      dispatch({ type: 'SET_USER', payload: { id: data.access_token, name } })
      navigate('/lobby')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-center">
      <div className="login-card">
        <div className="logo">
          <span className="logo-icon">🔤</span>
          <h1>Guess The Word</h1>
          <p className="subtitle">A fun word guessing game for friends</p>
        </div>
        <form onSubmit={handleLogin} className="form">
          <div className="form-group">
            <label htmlFor="username">Your Name</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your name…"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={20}
              autoComplete="off"
              autoFocus
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Joining…' : 'Play Now →'}
          </button>
        </form>
      </div>
    </div>
  )
}
