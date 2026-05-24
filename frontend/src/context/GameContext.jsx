import {
  createContext,
  useContext,
  useState,
} from "react";

const GameContext = createContext();

export function GameProvider({
  children,
}) {
  const [game, setGame] = useState(null);

  const [messages, setMessages] =
    useState([]);

  const [players, setPlayers] =
    useState([]);

  const [currentWord, setCurrentWord] =
    useState("");

  const [isDrawer, setIsDrawer] =
    useState(false);

  const [socket, setSocket] =
    useState(null);

  const addMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const updatePlayerScore = (
    userId,
    score
  ) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.user_id === userId
          ? {
              ...player,
              score,
            }
          : player
      )
    );
  };

  return (
    <GameContext.Provider
      value={{
        game,
        setGame,

        messages,
        setMessages,
        addMessage,

        players,
        setPlayers,
        updatePlayerScore,

        currentWord,
        setCurrentWord,

        isDrawer,
        setIsDrawer,

        socket,
        setSocket,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}