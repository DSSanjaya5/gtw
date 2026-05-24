import { useState } from "react";

export default function GuessInput({
  onSend,
  disabled = false,
}) {
  const [guess, setGuess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!guess.trim()) return;

    onSend(guess);

    setGuess("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3"
    >

      <input
        type="text"
        value={guess}
        disabled={disabled}
        onChange={(e) =>
          setGuess(e.target.value)
        }
        placeholder="Type your guess..."
        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 outline-none"
      />

      <button
        type="submit"
        disabled={disabled}
        className="px-6 py-3 rounded-2xl bg-white text-black font-medium hover:bg-zinc-200 transition disabled:opacity-50"
      >
        Send
      </button>

    </form>
  );
}