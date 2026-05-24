export default function PlayerList({
  players = [],
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Players
        </h2>

        <span className="text-sm text-zinc-400">
          {players.length}
        </span>
      </div>

      <div className="space-y-3">

        {players.map((player) => (
          <div
            key={player.user_id}
            className="flex items-center justify-between bg-zinc-800/60 rounded-xl px-4 py-3"
          >

            <div>
              <p className="font-medium">
                {player.username}
              </p>

              <p className="text-xs text-zinc-400">
                Joined #{player.join_order}
              </p>
            </div>

            <div className="text-right">
              <p className="font-semibold">
                {player.score}
              </p>

              <p className="text-xs text-zinc-400">
                pts
              </p>
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}