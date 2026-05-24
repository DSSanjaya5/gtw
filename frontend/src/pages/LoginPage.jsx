import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login as loginApi } from "../api/auth";

import useAuth from "../hooks/useAuth";

import PageContainer from "../components/layout/PageContainer";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

export default function LoginPage() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [username, setUsername] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async () => {
    if (!username.trim()) return;

    try {
      setLoading(true);

      const data = await loginApi(username);

      login(data);

      navigate("/lobby");
    } catch (err) {
      console.error(err);
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer className="flex items-center justify-center">

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

        <div className="mb-8 text-center">

          <h1 className="text-4xl font-bold tracking-tight">
            Guess The Word
          </h1>

          <p className="text-zinc-400 mt-3">
            Multiplayer drawing & guessing game
          </p>

        </div>

        <div className="space-y-5">

          <Input
            label="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            placeholder="Enter username"
          />

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full"
          >
            {loading
              ? "Entering..."
              : "Continue"}
          </Button>

        </div>

      </div>

    </PageContainer>
  );
}