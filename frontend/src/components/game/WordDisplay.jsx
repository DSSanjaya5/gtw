export default function WordDisplay({
  word,
  isDrawer = false,
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4">

      <p className="text-sm text-zinc-400 mb-1">
        {isDrawer
          ? "Your Word"
          : "Guess The Word"}
      </p>

      <h2 className="text-2xl font-bold tracking-widest">
        {word}
      </h2>

    </div>
  );
}