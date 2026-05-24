import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import useAuth from "./hooks/useAuth";

import LoginPage from "./pages/LoginPage";
import LobbyPage from "./pages/LobbyPage";
import RoomPage from "./pages/RoomPage";
import GamePage from "./pages/GamePage";

function PrivateRoute({
  children,
}) {

  const { user } = useAuth();

  if (!user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}

export default function RoutesProvider() {
  return (
    <Routes>

      <Route
        path="/"
        element={<LoginPage />}
      />

      <Route
        path="/lobby"
        element={
          <PrivateRoute>
            <LobbyPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/room/:roomCode"
        element={
          <PrivateRoute>
            <RoomPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/game/:roomCode"
        element={
          <PrivateRoute>
            <GamePage />
          </PrivateRoute>
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}