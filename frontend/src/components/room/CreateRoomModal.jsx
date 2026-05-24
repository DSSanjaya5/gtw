import { useState } from "react";

export default function CreateRoomModal({
  open,
  onClose,
  onCreate,
}) {
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [turns, setTurns] = useState(3);
  const [duration, setDuration] = useState(180);

  if (!open) return null;

  const handleSubmit = () => {
    onCreate({
      max_players: Number(maxPlayers),
      total_turns: Number(turns),
      turn_duration_seconds: Number(duration),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

        <div className="flex items-center justify-between mb-6">

          <h2 className="text-xl font-semibold">
            Create Room
          </h2>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>

        </div>

        <div className="space-y-5">

          <div>
            <label className="block text-sm mb-2 text-zinc-300">
              Max Players
            </label>

            <input
              type="number"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-zinc-300">
              Total Rounds
            </label>

            <input
              type="number"
              value={turns}
              onChange={(e) => setTurns(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-zinc-300">
              Turn Duration (seconds)
            </label>

            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 transition"
          >
            Create
          </button>

        </div>

      </div>

    </div>
  );
}