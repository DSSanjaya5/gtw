export default function EmptyState({
  title = "Nothing here",
  description = "",
  action = null,
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center">

      <div className="w-16 h-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-2xl mb-5">
        🎮
      </div>

      <h2 className="text-2xl font-semibold mb-2">
        {title}
      </h2>

      {description && (
        <p className="text-zinc-400 max-w-md mx-auto mb-6">
          {description}
        </p>
      )}

      {action}

    </div>
  );
}