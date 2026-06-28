import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useGame } from '../context/GameContext'
import { connectRoomSocket } from '../socket'

import Canvas from '../components/Canvas'
import Toolbar from '../components/Toolbar'
import WordPicker from '../components/WordPicker'
import PlayersList from '../components/PlayersList'
import GuessChat from '../components/GuessChat'
import WordDisplay from '../components/WordDisplay'
import TurnOverOverlay from '../components/TurnOverOverlay'

/* ── Turn Timer Component ───────────────────────────────────── */
function TurnTimer({ duration, active, timerKey, onExpire, onTick }) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const isLow = timeLeft <= 10
  const circ = 2 * Math.PI * 40
  const progress = active ? (timeLeft / duration) * circ : circ

  useEffect(() => {
    setTimeLeft(duration)
  }, [duration, timerKey])

  useEffect(() => {
    if (!active) return
    if (timeLeft <= 0) {
      onExpire?.()
      return
    }
    const t = setTimeout(() => {
      const nextTime = timeLeft - 1
      setTimeLeft(nextTime)
      onTick?.(nextTime)
    }, 1000)
    return () => clearTimeout(t)
  }, [timeLeft, active, onExpire, onTick])

  return (
    <div className={`timer-ring-container${isLow && active ? ' timer--low' : ''}`}>
      <svg viewBox="0 0 100 100" className="timer-svg">
        <circle cx="50" cy="50" r="40" className="timer-track" />
        <circle
          cx="50" cy="50" r="40"
          className="timer-ring"
          strokeDasharray={circ}
          strokeDashoffset={circ - progress}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className="timer-text">{active ? timeLeft : '--'}</span>
    </div>
  )
}

/* ── Main Game Component ────────────────────────────────────── */
export default function Game() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch, isDrawer, drawerId, drawerName, user } = useGame()

  const [room, setRoom] = useState(state.room)
  const [choices, setChoices] = useState([])
  const [wordChosen, setWordChosen] = useState(false)
  const [hasGuessed, setHasGuessed] = useState(false)
  const [chatLog, setChatLog] = useState([])
  
  // Transition scoreboard state
  const [turnOverState, setTurnOverState] = useState(null)
  
  // Local drawing toolbar options
  const [color, setColor] = useState('#000000')
  const [lineWidth, setLineWidth] = useState(5)
  const [tool, setTool] = useState('pencil')

  const canvasRef = useRef(null)
  const socketRef = useRef(null)
  const lastTurnRef = useRef(1)
  const endingTurnRef = useRef(false)
  const prevPlayersRef = useRef([])
  const timeLeftRef = useRef(90)
  
  const roomRef = useRef(room)
  useEffect(() => {
    roomRef.current = room
  }, [room])

  const isHost = room?.host_id === user?.id
  const turnNo = room?.current_turn || 1

  // Handle local state advances to next turn
  const proceedToNextTurn = useCallback((nextTurn, nextDrawerName) => {
    setTurnOverState(null)
    setWordChosen(false)
    setHasGuessed(false)
    setChoices([])
    dispatch({ type: 'SET_HINT', payload: null })
    dispatch({ type: 'SET_WORD', payload: null })
    canvasRef.current?.clearCanvas()
    timeLeftRef.current = room?.turn_duration || 90

    // Fetch updated room structure
    api('GET', `/rooms/${id}`).then(r => {
      setRoom(r)
      dispatch({ type: 'SET_ROOM', payload: r })
      lastTurnRef.current = r.current_turn
    })
  }, [id, dispatch, room?.turn_duration])

  // Establish WS connection ONCE on mount and keep active
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const ws = connectRoomSocket(
      id,
      token,
      // onMessage callback
      (msg) => {
        switch (msg.type) {
          case 'draw':
            canvasRef.current?.applyStroke(msg)
            break
          case 'clear':
            canvasRef.current?.clearCanvas()
            break
          case 'word_chosen':
            setWordChosen(true)
            dispatch({ type: 'SET_HINT', payload: { word_length: msg.wordLength } })
            setChatLog(prev => [...prev, { system: true, text: `🎨 Word chosen! Start guessing!` }])
            break
          case 'guess':
            setChatLog(prev => [...prev, msg])
            break
          case 'turn_over':
            // Capture scores before updating
            prevPlayersRef.current = roomRef.current?.players ? [...roomRef.current.players] : []
            setTurnOverState({
              word: msg.word,
              nextTurn: msg.nextTurn,
              drawerName: msg.drawerName,
              drawerId: msg.drawerId,
              status: msg.status
            })
            setChatLog(prev => [...prev, { system: true, text: `⏰ Turn over! The word was "${msg.word.toUpperCase()}"` }])
            
            // Instantly poll backend to update scores so they slide up/down on other tabs
            api('GET', `/rooms/${id}`).then(r => {
              setRoom(r)
              dispatch({ type: 'SET_ROOM', payload: r })
            })
            break
          case 'game_over':
            prevPlayersRef.current = roomRef.current?.players ? [...roomRef.current.players] : []
            setTurnOverState({
              word: msg.word,
              status: 'game_over'
            })
            
            // Instantly poll scores for the final standings transition
            api('GET', `/rooms/${id}`).then(r => {
              setRoom(r)
              dispatch({ type: 'SET_ROOM', payload: r })
            })
            break
          default:
            break
        }
      },
      // onOpen callback
      () => {
        setChatLog(prev => [...prev, { system: true, text: '🔌 Connected to game room!' }])
      },
      // onClose callback
      () => {
        setChatLog(prev => [...prev, { system: true, text: '⚠️ Disconnected from room.' }])
      }
    )

    socketRef.current = ws

    return () => {
      ws.close()
    }
  }, [id, dispatch]) // ONLY depend on id and dispatch to prevent reconnect cycles

  // Sync Room state & check initial phase
  useEffect(() => {
    async function sync() {
      try {
        const r = await api('GET', `/rooms/${id}`)
        setRoom(r)
        dispatch({ type: 'SET_ROOM', payload: r })
        lastTurnRef.current = r.current_turn
        timeLeftRef.current = r.turn_duration

        if (r.status === 'finished') {
          navigate(`/results/${id}`)
          return
        }

        if (r.current_word) {
          setWordChosen(true)
          const details = await api('GET', `/game/${id}/hint`).catch(() => null)
          if (details) dispatch({ type: 'SET_HINT', payload: details })
        }
      } catch (err) {
        console.error('Room sync failed:', err)
      }
    }
    sync()
  }, [id, drawerId, user]) // eslint-disable-line

  // Drawer fetches word options if they need to choose
  useEffect(() => {
    if (isDrawer && !wordChosen && choices.length === 0) {
      api('GET', `/game/${id}/word-choices`)
        .then(res => setChoices(res.choices))
        .catch(err => console.error('Failed to get word choices:', err))
    }
  }, [id, isDrawer, wordChosen, choices.length])

  // Polling fallback to keep players/scores synced periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      if (turnOverState) return

      try {
        const updated = await api('GET', `/rooms/${id}`)
        setRoom(updated)
        dispatch({ type: 'SET_ROOM', payload: updated })

        if (updated.current_turn !== lastTurnRef.current) {
          lastTurnRef.current = updated.current_turn
          setWordChosen(false)
          setHasGuessed(false)
          setChoices([])
          dispatch({ type: 'SET_HINT', payload: null })
          dispatch({ type: 'SET_WORD', payload: null })
          canvasRef.current?.clearCanvas()
          
          const nextDrawer = updated.players[(updated.current_turn - 1) % updated.players.length]
          setChatLog(prev => [...prev, { 
            system: true, 
            text: `🔄 Turn ${updated.current_turn} started! ${nextDrawer?.name} is drawing.` 
          }])
        }

        if (updated.status === 'finished') {
          clearInterval(interval)
          navigate(`/results/${id}`)
        }
      } catch { /* silent */ }
    }, 3000)

    return () => clearInterval(interval)
  }, [id, dispatch, navigate, turnOverState])

  // Drawer picked a word
  async function handlePickWord(word) {
    try {
      const res = await api('POST', `/game/${id}/choose-word`, { word })
      setWordChosen(true)
      dispatch({ type: 'SET_WORD', payload: word })
      timeLeftRef.current = room?.turn_duration || 90
      
      socketRef.current?.send(JSON.stringify({
        type: 'word_chosen',
        wordLength: res.word_length
      }))

      setChatLog(prev => [...prev, { system: true, text: `🎨 You chose to draw: "${word.toUpperCase()}"` }])
    } catch (err) {
      console.error('Failed to choose word:', err)
    }
  }

  const handleStroke = useCallback((stroke) => {
    socketRef.current?.send(JSON.stringify(stroke))
  }, [])

  function handleClear() {
    canvasRef.current?.clearCanvas()
    socketRef.current?.send(JSON.stringify({ type: 'clear' }))
  }

  // Handle Guesser submitting a guess
  async function handleSendGuess(text) {
    if (hasGuessed || isDrawer) return
    
    try {
      const result = await api('POST', `/game/${id}/guess`, { 
        guess: text,
        time_left: timeLeftRef.current
      })
      
      const guessMsg = {
        type: 'guess',
        playerName: user?.name,
        text: result.correct ? 'guessed the word! 🎉' : text,
        correct: result.correct
      }

      socketRef.current?.send(JSON.stringify(guessMsg))
      setChatLog(prev => [...prev, guessMsg])

      if (result.correct) {
        setHasGuessed(true)
        
        if (result.status === 'next_turn') {
          socketRef.current?.send(JSON.stringify({
            type: 'turn_over',
            word: result.word,
            nextTurn: result.next_turn,
            drawerName: result.drawer_name,
            drawerId: result.drawer_id,
            status: 'next_turn'
          }))

          prevPlayersRef.current = room?.players ? [...room.players] : []
          setTurnOverState({
            word: result.word,
            nextTurn: result.next_turn,
            drawerName: result.drawer_name,
            drawerId: result.drawer_id,
            status: 'next_turn'
          })
          setChatLog(prev => [...prev, { system: true, text: `⏰ Turn over! The word was "${result.word.toUpperCase()}"` }])
        } else if (result.status === 'game_over') {
          socketRef.current?.send(JSON.stringify({ 
            type: 'game_over', 
            word: result.word 
          }))
          
          prevPlayersRef.current = room?.players ? [...room.players] : []
          setTurnOverState({
            word: result.word,
            status: 'game_over'
          })
          return
        }

        const updated = await api('GET', `/rooms/${id}`)
        setRoom(updated)
        dispatch({ type: 'SET_ROOM', payload: updated })
      }
    } catch (err) {
      console.error('Guess submission failed:', err)
    }
  }

  // End turn (Host only, called on timer expiry)
  async function handleEndTurn() {
    if (endingTurnRef.current) return
    endingTurnRef.current = true

    try {
      const data = await api('POST', `/game/{id}/end-turn`.replace('{id}', id))
      
      if (data.status === 'game_over') {
        socketRef.current?.send(JSON.stringify({ 
          type: 'game_over', 
          word: data.word 
        }))
        
        prevPlayersRef.current = room?.players ? [...room.players] : []
        setTurnOverState({
          word: data.word,
          status: 'game_over'
        })
      } else {
        socketRef.current?.send(JSON.stringify({
          type: 'turn_over',
          word: data.word,
          nextTurn: data.next_turn,
          drawerName: data.drawer_name,
          drawerId: data.drawer_id,
          status: 'next_turn'
        }))

        prevPlayersRef.current = room?.players ? [...room.players] : []
        setTurnOverState({
          word: data.word,
          nextTurn: data.next_turn,
          drawerName: data.drawer_name,
          drawerId: data.drawer_id,
          status: 'next_turn'
        })
        setChatLog(prev => [...prev, { system: true, text: `⏰ Turn over! The word was "${data.word.toUpperCase()}"` }])

        const updated = await api('GET', `/rooms/${id}`)
        setRoom(updated)
        dispatch({ type: 'SET_ROOM', payload: updated })
      }
    } catch (err) {
      console.error('Failed to end turn:', err)
    } finally {
      endingTurnRef.current = false
    }
  }

  const handleTimerExpire = useCallback(() => {
    if (isHost && !turnOverState) handleEndTurn()
  }, [isHost, turnOverState]) // eslint-disable-line

  const handleFinishedTransition = useCallback(() => {
    if (turnOverState?.status === 'game_over') {
      navigate(`/results/${id}`)
    } else if (turnOverState) {
      proceedToNextTurn(turnOverState.nextTurn, turnOverState.drawerName)
    }
  }, [turnOverState, navigate, id, proceedToNextTurn])

  const totalTurns = room ? room.players.length * room.turns : 0

  return (
    <div className="game-page">
      {/* ── Top Game Status Bar ─────────────────────── */}
      <div className="turn-bar">
        <span className="turn-info">Round {turnNo} / {totalTurns}</span>
        <span className="drawer-indicator">
          🎨 <strong>{isDrawer ? 'You' : drawerName}</strong> is drawing
        </span>
        <TurnTimer
          duration={room?.turn_duration || 90}
          active={wordChosen && !turnOverState}
          timerKey={turnNo}
          onExpire={handleTimerExpire}
          onTick={(time) => { timeLeftRef.current = time }}
        />
      </div>

      {/* ── Word Choice Picker ──────────────────────── */}
      {!wordChosen && !turnOverState && (
        <WordPicker
          isDrawer={isDrawer}
          choices={choices}
          drawerName={drawerName}
          onPick={handlePickWord}
        />
      )}

      {/* ── Turn Over Scoreboard Intermission Overlay ── */}
      {turnOverState && (
        <TurnOverOverlay
          word={turnOverState.word}
          players={room?.players || []}
          prevPlayers={prevPlayersRef.current}
          status={turnOverState.status}
          onFinished={handleFinishedTransition}
        />
      )}

      {/* ── Main Layout Workspace ───────────────────── */}
      <main className="game-workspace">
        
        {/* Left Side: Scoreboard */}
        <div className="game-left-sidebar">
          {room && (
            <PlayersList
              players={room.players}
              drawerId={drawerId}
              userId={user?.id}
            />
          )}
        </div>

        {/* Center: Canvas Area & Toolbar */}
        <div className="game-center-area">
          <WordDisplay
            isDrawer={isDrawer}
            word={state.currentWord}
            wordHint={state.wordHint}
          />

          <div className="canvas-wrapper">
            <Canvas
              ref={canvasRef}
              isDrawer={isDrawer && !turnOverState}
              color={color}
              lineWidth={lineWidth}
              tool={tool}
              onStroke={handleStroke}
            />
          </div>

          {isDrawer && !turnOverState && (
            <Toolbar
              color={color}
              lineWidth={lineWidth}
              tool={tool}
              onColor={setColor}
              onLineWidth={setLineWidth}
              onTool={setTool}
              onClear={handleClear}
            />
          )}
        </div>

        {/* Right Side: Real-time Guess Log Chat */}
        <div className="game-right-sidebar">
          <GuessChat
            chatLog={chatLog}
            isDrawer={isDrawer}
            hasGuessed={hasGuessed}
            onSendGuess={handleSendGuess}
          />
        </div>

      </main>
    </div>
  )
}
