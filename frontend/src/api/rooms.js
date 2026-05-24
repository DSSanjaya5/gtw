import api from "./axios";

export const createRoom = async (
  token,
  payload = {}
) => {
  const response = await api.post(
    `/rooms?token=${token}`,
    {
      max_players: payload.max_players || 8,
      total_turns: payload.total_turns || 3,
      turn_duration_seconds:
        payload.turn_duration_seconds || 180,
    }
  );

  return response.data;
};


export const listRooms = async () => {
  const response = await api.get("/rooms");
  return response.data;
};


export const joinRoom = async (
  token,
  roomCode
) => {
  const response = await api.post(
    `/rooms/join?token=${token}`,
    {
      room_code: roomCode,
    }
  );

  return response.data;
};


export const getRoom = async (roomCode) => {
  const response = await api.get(
    `/rooms/${roomCode}`
  );

  return response.data;
};