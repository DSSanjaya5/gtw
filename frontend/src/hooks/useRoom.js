import { useRoom as useRoomContext } from "../context/RoomContext";

export default function useRoom() {
  return useRoomContext();
}