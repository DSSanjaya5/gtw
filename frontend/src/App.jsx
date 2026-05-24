import {
  BrowserRouter,
} from "react-router-dom";

import RoutesProvider from "./routes";

import {
  AuthProvider,
} from "./context/AuthContext";

import {
  RoomProvider,
} from "./context/RoomContext";

import {
  GameProvider,
} from "./context/GameContext";

export default function App() {
  return (
    <BrowserRouter>

      <AuthProvider>

        <RoomProvider>

          <GameProvider>

            <RoutesProvider />

          </GameProvider>

        </RoomProvider>

      </AuthProvider>

    </BrowserRouter>
  );
}