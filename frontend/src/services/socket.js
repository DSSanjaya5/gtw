let socket = null;

export const connectSocket = (
  roomCode,
  token,
  onMessage,
  onOpen,
  onClose
) => {

  if (socket) {
    socket.close();
  }

  socket = new WebSocket(
    `ws://localhost:8000/ws/game/${roomCode}?token=${token}`
  );

  socket.onopen = () => {
    console.log("[WS] Connected");

    if (onOpen) {
      onOpen();
    }
  };

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);

      if (onMessage) {
        onMessage(payload);
      }

    } catch (err) {
      console.error(
        "[WS MESSAGE ERROR]",
        err
      );
    }
  };

  socket.onclose = () => {
    console.log("[WS] Disconnected");

    if (onClose) {
      onClose();
    }
  };

  socket.onerror = (err) => {
    console.error(
      "[WS ERROR]",
      err
    );
  };

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

export const sendSocketEvent = (
  event,
  data = {}
) => {

  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ) {
    return;
  }

  socket.send(
    JSON.stringify({
      event,
      data,
    })
  );
};

export default {
  connectSocket,
  disconnectSocket,
  sendSocketEvent,
};