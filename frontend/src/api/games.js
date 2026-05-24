import api from "./axios";

export const startGame = async (
  token,
  roomCode
) => {
  const response = await api.post(
    `/game/start/${roomCode}?token=${token}`
  );

  return response.data;
};


export const getGameState = async (
  roomCode
) => {
  const response = await api.get(
    `/game/${roomCode}/state`
  );

  return response.data;
};


export const getGameResults = async (
  roomCode
) => {
  const response = await api.get(
    `/game/${roomCode}/results`
  );

  return response.data;
};