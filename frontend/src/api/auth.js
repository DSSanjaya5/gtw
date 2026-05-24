import api from "./axios";

export const login = async (username) => {
  const response = await api.post("/auth/login", {
    username,
  });

  return response.data;
};