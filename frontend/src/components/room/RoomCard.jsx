export default function RoomCard({
  room,
  onJoin,
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition">

      <div className="flex items-start justify-between mb-4">

        <div>
          <h3 className="text-lg font-semibold text-white">
            {room.room_code}
          </h3>

          <p className="text-sm text-zinc-400 mt-1">
            Host: {room.owner_username}
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300">
          {room.status}
        </div>

      </div>

      <div className="space-y-2 text-sm text-zinc-300 mb-5">

        <div className="flex justify-between">
          <span>Players</span>
          <span>
            {room.player_count}/{room.max_players}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Rounds</span>
          <span>{room.total_turns}</span>
        </div>

        <div className="flex justify-between">
          <span>Turn Time</span>
          <span>{room.turn_duration_seconds}s</span>
        </div>

      </div>

      <button
        onClick={() => onJoin(room.room_code)}
        className="w-full py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 transition"
      >
        Join Room
      </button>

    </div>
  );
}