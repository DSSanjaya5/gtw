import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  createRoom,
  listRooms,
  joinRoom,
} from "../api/rooms";

import useAuth from "../hooks/useAuth";
import useRoom from "../hooks/useRoom";

import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";

import RoomCard from "../components/room/RoomCard";
import CreateRoomModal from "../components/room/CreateRoomModal";
import JoinRoomModal from "../components/room/JoinRoomModal";

import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";

export default function LobbyPage() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const {
    rooms,
    setRooms,
  } = useRoom();

  const [loading, setLoading] =
    useState(true);

  const [createOpen, setCreateOpen] =
    useState(false);

  const [joinOpen, setJoinOpen] =
    useState(false);

  const fetchRooms = async () => {
    try {
      const data = await listRooms();
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (
    payload
  ) => {
    try {
      const room = await createRoom(
        user.token,
        payload
      );

      navigate(`/room/${room.room_code}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create room");
    }
  };

  const handleJoinRoom = async (
    roomCode
  ) => {
    try {
      const room = await joinRoom(
        user.token,
        roomCode
      );

      navigate(`/room/${room.room_code}`);
    } catch (err) {
      console.error(err);
      alert("Failed to join room");
    }
  };

  return (
    <>
      <Navbar />

      <PageContainer>

        <div className="flex items-center justify-between mb-8">

          <div>
            <h1 className="text-4xl font-bold">
              Game Lobby
            </h1>

            <p className="text-zinc-400 mt-2">
              Create or join a room
            </p>
          </div>

          <div className="flex gap-3">

            <Button
              variant="secondary"
              onClick={() =>
                setJoinOpen(true)
              }
            >
              Join Room
            </Button>

            <Button
              onClick={() =>
                setCreateOpen(true)
              }
            >
              Create Room
            </Button>

          </div>

        </div>

        {loading ? (
          <Loader />
        ) : rooms.length === 0 ? (
          <EmptyState
            title="No Rooms Found"
            description="Create a new room and start playing with your friends."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {rooms.map((room) => (
              <RoomCard
                key={room.room_code}
                room={room}
                onJoin={handleJoinRoom}
              />
            ))}

          </div>
        )}

      </PageContainer>

      <CreateRoomModal
        open={createOpen}
        onClose={() =>
          setCreateOpen(false)
        }
        onCreate={handleCreateRoom}
      />

      <JoinRoomModal
        open={joinOpen}
        onClose={() =>
          setJoinOpen(false)
        }
        onJoin={handleJoinRoom}
      />
    </>
  );
}