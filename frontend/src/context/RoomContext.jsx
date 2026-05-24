import {
  createContext,
  useContext,
  useState,
} from "react";

const RoomContext = createContext();

export function RoomProvider({
  children,
}) {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] =
    useState(null);

  const updateRoomPlayers = (players) => {
    setCurrentRoom((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        players,
        player_count: players.length,
      };
    });
  };

  return (
    <RoomContext.Provider
      value={{
        rooms,
        setRooms,

        currentRoom,
        setCurrentRoom,

        updateRoomPlayers,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  return useContext(RoomContext);
}