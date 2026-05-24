import { Link } from "react-router-dom";

export default function Navbar() {
  const username = localStorage.getItem("username");

  return (
    <header className="w-full border-b border-zinc-800 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2"
        >
          <div className="w-3 h-3 rounded-full bg-white" />

          <h1 className="text-xl font-semibold tracking-tight text-white">
            Guess The Word
          </h1>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-4">

          {username && (
            <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <p className="text-sm text-zinc-300">
                @{username}
              </p>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}