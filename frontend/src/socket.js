/**
 * Create a WebSocket connection.
 * Relies on the Vite proxy forwarding `/ws/*` requests to `ws://localhost:8080/ws/*`
 */
export function connectRoomSocket(roomId, token, onMessage, onOpen, onClose) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  
  // Use relative path so Vite config proxy handles it, or use direct absolute URL if bypassing proxy.
  // Using direct target is safer if proxy ws support varies: ws://localhost:8080/ws/${roomId}?token=${token}
  // Let's connect directly to the FastAPI server port since it accepts cross-origin ws.
  const wsUrl = `ws://localhost:8080/ws/${roomId}?token=${token}`;
  
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('WebSocket connected to room:', roomId);
    onOpen?.();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    } catch (err) {
      console.error('Error parsing WS message:', err);
    }
  };

  socket.onclose = (event) => {
    console.log('WebSocket connection closed:', event.reason);
    onClose?.(event);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return socket;
}
