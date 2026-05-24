import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import useGame from "../hooks/useGame";
import useWebSocket from "../hooks/useWebSocket";

import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";

import GameHeader from "../components/game/GameHeader";
import CanvasBoard from "../components/game/CanvasBoard";
import ChatBox from "../components/game/ChatBox";
import GuessInput from "../components/game/GuessInput";
import ScoreBoard from "../components/game/ScoreBoard";

export default function GamePage() {

  const { roomCode } = useParams();

  const navigate = useNavigate();

  const { user } = useAuth();

  const {
    messages,
    addMessage,

    players,
    setPlayers,

    currentWord,
    setCurrentWord,

    isDrawer,
    setIsDrawer,

    socket,
    setSocket,
  } = useGame();

  const [gameStarted, setGameStarted] =
    useState(false);

  const [currentDrawer, setCurrentDrawer] =
    useState(null);

  const [timer, setTimer] =
    useState(180);

  const [turnId, setTurnId] =
    useState(null);

  // ==========================================================
  // TIMER
  // ==========================================================

  useEffect(() => {

    if (!gameStarted || !turnId) {
      return;
    }

    setTimer(180);

    const interval = setInterval(() => {

      setTimer((prev) => {

        if (prev <= 1) {

          clearInterval(interval);

          return 0;
        }

        return prev - 1;
      });

    }, 1000);

    return () => clearInterval(interval);

  }, [turnId, gameStarted]);

  // ==========================================================
  // WEBSOCKET
  // ==========================================================

  useWebSocket({
    roomCode,
    token: user?.token,
    setSocket,

    onMessage: (payload) => {

      const {
        event,
        data,
      } = payload;

      console.log(event, data);

      // ======================================================
      // PLAYER JOINED
      // ======================================================

      if (event === "player_joined") {

        setPlayers(data.players);
      }

      // ======================================================
      // PLAYER LEFT
      // ======================================================

      if (event === "player_left") {

        setPlayers(data.players);
      }

      // ======================================================
      // CHAT
      // ======================================================

      if (event === "chat") {

        addMessage({
          username: data.username,
          message: data.message,
        });
      }

      // ======================================================
      // DRAW
      // ======================================================

      if (event === "draw") {

        window.dispatchEvent(
          new CustomEvent(
            "remote-draw",
            {
              detail: data.frame,
            }
          )
        );
      }

      // ======================================================
      // TURN STARTED (GUESSERS)
      // ======================================================

      if (event === "turn_started") {

        setGameStarted(true);

        setTurnId(data.turn_id);

        setIsDrawer(false);

        setCurrentDrawer(
          data.drawer_username
        );

        setCurrentWord(
          data.masked_word
        );

        addMessage({
          username: "SYSTEM",
          message: `${data.drawer_username} is drawing`,
        });
      }

      // ======================================================
      // YOUR TURN (DRAWER)
      // ======================================================

      if (event === "your_turn") {

        setGameStarted(true);

        setTurnId(data.turn_id);

        setIsDrawer(true);

        setCurrentDrawer(
          user.username
        );

        setCurrentWord(
          data.word
        );

        addMessage({
          username: "SYSTEM",
          message: "It's your turn to draw",
        });
      }

      // ======================================================
      // CORRECT GUESS
      // ======================================================

      if (event === "correct_guess") {

        addMessage({
          username: "SYSTEM",
          message: `${data.username} guessed correctly`,
        });

        setPlayers((prev) =>
          prev.map((p) =>
            p.user_id === data.user_id
              ? {
                  ...p,
                  score: data.total_score,
                }
              : p
          )
        );
      }

      // ======================================================
      // GAME STARTED
      // ======================================================

      if (event === "game_started") {

        setPlayers(data.players);

        addMessage({
          username: "SYSTEM",
          message: "Game started",
        });
      }
    },
  });

  // ==========================================================
  // SEND GUESS
  // ==========================================================

  const sendGuess = (guess) => {

    if (!guess?.trim()) return;

    socket?.send(
      JSON.stringify({
        event: "guess",
        data: {
          guess,
        },
      })
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (!user) {

    navigate("/");

    return null;
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      <Navbar />

      <PageContainer>

        <div className="space-y-6">

          <GameHeader
            roomCode={roomCode}
            currentRound={1}
            totalRounds={3}
            word={currentWord}
            isDrawer={isDrawer}
            duration={timer}
            currentDrawer={currentDrawer}
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* LEFT */}

            <div className="lg:col-span-3 space-y-5">

              <CanvasBoard
                socket={socket}
                isDrawer={isDrawer}
              />

              {!isDrawer && gameStarted && (
                <GuessInput
                  onSend={sendGuess}
                />
              )}

            </div>

            {/* RIGHT */}

            <div className="space-y-5">

              <ScoreBoard
                players={players}
              />

              <ChatBox
                messages={messages}
              />

            </div>

          </div>

        </div>

      </PageContainer>
    </>
  );
}