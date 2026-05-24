import Timer from "./Timer";
import WordDisplay from "./WordDisplay";

export default function GameHeader({
  roomCode,
  currentRound,
  totalRounds,
  word,
  isDrawer,
  duration,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4">

        <p className="text-sm text-zinc-400 mb-1">
          Room
        </p>

        <h2 className="text-2xl font-bold tracking-widest">
          {roomCode}
        </h2>

      </div>

      <WordDisplay
        word={word}
        isDrawer={isDrawer}
      />

      <div className="flex justify-end">
        <Timer duration={duration} />
      </div>

    </div>
  );
}