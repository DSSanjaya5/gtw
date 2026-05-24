export default function Modal({
  open,
  onClose,
  title,
  children,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">

      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

        <div className="flex items-center justify-between mb-6">

          <h2 className="text-xl font-semibold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>

        </div>

        {children}

      </div>

    </div>
  );
}