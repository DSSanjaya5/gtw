import { useEffect, useState } from "react";

export default function Timer({
  duration = 180,
}) {
  const [timeLeft, setTimeLeft] =
    useState(duration);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="px-5 py-3 rounded-2xl bg-zinc-900 border border-zinc-800">

      <p className="text-sm text-zinc-400 mb-1">
        Time Left
      </p>

      <h2 className="text-2xl font-bold tracking-tight">
        {String(minutes).padStart(2, "0")}:
        {String(seconds).padStart(2, "0")}
      </h2>

    </div>
  );
}