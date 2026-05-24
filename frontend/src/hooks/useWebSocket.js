import { useEffect } from "react";

export default function useWebSocket({
  roomCode,
  token,
  onMessage,
  onOpen,
  onClose,
  setSocket,
}) {
  useEffect(() => {
    if (!roomCode || !token) return;

    const ws = new WebSocket(
      `ws://localhost:8000/ws/game/${roomCode}?token=${token}`
    );

    ws.onopen = () => {
      console.log("[WS] Connected");

      if (onOpen) {
        onOpen(ws);
      }
    };

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      console.log("[WS MESSAGE]", payload);

      if (onMessage) {
        onMessage(payload, ws);
      }
    };

    ws.onclose = () => {
      console.log("[WS] Disconnected");

      if (onClose) {
        onClose();
      }
    };

    ws.onerror = (error) => {
      console.error("[WS ERROR]", error);
    };

    if (setSocket) {
      setSocket(ws);
    }

    return () => {
      ws.close();
    };
  }, [roomCode, token]);
}