export default function ScoreBoard({
  players = [],
}) {
  const sorted = [...players].sort(
    (a, b) => b.score - a.score
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4">

      <h2 className="font-semibold text-lg mb-4">
        Scoreboard
      </h2>

      <div className="space-y-3">

        {sorted.map((player, index) => (
          <div
            key={player.user_id}
            className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3"
          >

            <div className="flex items-center gap-3">

              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-semibold">
                #{index + 1}
              </div>

              <p className="font-medium">
                {player.username}
              </p>

            </div>

            <p className="font-semibold">
              {player.score}
            </p>

          </div>
        ))}

      </div>

    </div>
  );
}