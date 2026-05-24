import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getRoom,
} from "../api/rooms";

import {
  startGame,
} from "../api/games";

import useAuth from "../hooks/useAuth";
import useRoom from "../hooks/useRoom";
import useWebSocket from "../hooks/useWebSocket";

import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";

import PlayerList from "../components/room/PlayerList";

import Button from "../components/common/Button";
import Loader from "../components/common/Loader";

export default function RoomPage() {

  const { roomCode } = useParams();

  const navigate = useNavigate();

  const { user } = useAuth();

  const {
    currentRoom,
    setCurrentRoom,
  } = useRoom();

  const [loading, setLoading] =
    useState(true);

  // ==========================================================
  // FETCH ROOM
  // ==========================================================

  const fetchRoom = async () => {

    try {

      const data = await getRoom(
        roomCode
      );

      setCurrentRoom(data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {

    fetchRoom();

  }, [roomCode]);

  // ==========================================================
  // WEBSOCKET
  // ==========================================================

  useWebSocket({
    roomCode,
    token: user?.token,

    onMessage: (payload) => {

      const {
        event,
        data,
      } = payload;

      console.log(
        "[ROOM WS]",
        event,
        data
      );

      // ======================================================
      // PLAYER JOINED
      // ======================================================

      if (event === "player_joined") {

        setCurrentRoom((prev) => {

          if (!prev) return prev;

          return {
            ...prev,
            players: data.players,
          };
        });
      }

      // ======================================================
      // PLAYER LEFT
      // ======================================================

      if (event === "player_left") {

        setCurrentRoom((prev) => {

          if (!prev) return prev;

          return {
            ...prev,
            players: data.players,
          };
        });
      }

      // ======================================================
      // GAME STARTED
      // ======================================================

      if (event === "game_started") {

        navigate(
          `/game/${roomCode}`
        );
      }
    },
  });

  // ==========================================================
  // START GAME
  // ==========================================================

  const handleStartGame =
    async () => {

      try {

        await startGame(
          user.token,
          roomCode
        );

      } catch (err) {

        console.error(err);

        alert(
          "Failed to start game"
        );
      }
    };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return <Loader />;
  }

  if (!currentRoom) {
    return null;
  }

  const isOwner =
    currentRoom.owner_id ===
    user.user_id;

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      <Navbar />

      <PageContainer>

        <div className="space-y-6">

          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <p className="text-zinc-500 mb-2">
                Room Code
              </p>

              <h1 className="text-5xl font-bold tracking-[10px]">
                {currentRoom.room_code}
              </h1>

            </div>

            {isOwner && (
              <Button
                onClick={
                  handleStartGame
                }
              >
                Start Game
              </Button>
            )}

          </div>

          {/* ================================================= */}
          {/* CONTENT */}
          {/* ================================================= */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT */}

            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

              <h2 className="text-2xl font-semibold mb-6">
                Room Details
              </h2>

              <div className="space-y-5 text-zinc-300">

                <div className="flex items-center justify-between">

                  <span>Status</span>

                  <span className="capitalize">
                    {currentRoom.status}
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span>Rounds</span>

                  <span>
                    {
                      currentRoom.total_turns
                    }
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span>
                    Turn Duration
                  </span>

                  <span>
                    {
                      currentRoom.turn_duration_seconds
                    }
                    s
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span>Players</span>

                  <span>
                    {
                      currentRoom.players
                        ?.length
                    }
                    /
                    {
                      currentRoom.max_players
                    }
                  </span>

                </div>

              </div>

            </div>

            {/* RIGHT */}

            <PlayerList
              players={
                currentRoom.players
              }
            />

          </div>

        </div>

      </PageContainer>
    </>
  );
}