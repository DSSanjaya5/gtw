import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GameProvider } from './context/GameContext'
import Login from './pages/Login'
import Lobby from './pages/Lobby'
import WaitingRoom from './pages/WaitingRoom'
import Game from './pages/Game'
import Results from './pages/Results'

function PrivateRoute({ children }) {
  return localStorage.getItem('access_token')
    ? children
    : <Navigate to="/" replace />
}

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/lobby" element={<PrivateRoute><Lobby /></PrivateRoute>} />
          <Route path="/room/:id" element={<PrivateRoute><WaitingRoom /></PrivateRoute>} />
          <Route path="/game/:id" element={<PrivateRoute><Game /></PrivateRoute>} />
          <Route path="/results/:id" element={<PrivateRoute><Results /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  )
}
