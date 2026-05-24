import { useGame as useGameContext } from "../context/GameContext";

export default function useGame() {
  return useGameContext();
}