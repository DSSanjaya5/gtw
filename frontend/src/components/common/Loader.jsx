export default function Loader({
  text = "Loading...",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">

      <div className="w-12 h-12 border-4 border-zinc-700 border-t-white rounded-full animate-spin" />

      <p className="mt-5 text-zinc-400">
        {text}
      </p>

    </div>
  );
}