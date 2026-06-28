import { createContext, useContext, useReducer } from 'react'

const GameContext = createContext()

const initialState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  room: null,
  currentWord: null, // Secret word if we are drawing
  wordHint: null,    // Hint { word_length } if we are guessing
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      localStorage.setItem('user', JSON.stringify(action.payload))
      return { ...state, user: action.payload }
    case 'SET_ROOM':
      return { ...state, room: action.payload }
    case 'SET_WORD':
      return { ...state, currentWord: action.payload }
    case 'SET_HINT':
      return { ...state, wordHint: action.payload }
    case 'RESET_GAME':
      return { ...state, currentWord: null, wordHint: null, room: null }
    case 'LOGOUT':
      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      return { ...initialState, user: null, room: null }
    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  
  // Calculate computed properties
  const room = state.room
  const user = state.user
  
  let drawerId = null
  let drawerName = ''
  let isDrawer = false
  
  if (room && room.players && room.players.length > 0) {
    const idx = (room.current_turn - 1) % room.players.length
    const drawer = room.players[idx]
    if (drawer) {
      drawerId = drawer.id
      drawerName = drawer.name
      isDrawer = drawerId === user?.id
    }
  }

  const value = {
    state,
    dispatch,
    drawerId,
    drawerName,
    isDrawer,
    user,
    room,
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  return useContext(GameContext)
}
