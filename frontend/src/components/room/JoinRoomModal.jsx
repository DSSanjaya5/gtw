import { useState } from "react";

import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";

export default function JoinRoomModal({
  open,
  onClose,
  onJoin,
}) {

  const [roomCode, setRoomCode] =
    useState("");

  const handleJoin = async () => {

    if (!roomCode.trim()) {
      return;
    }

    await onJoin(
      roomCode.trim().toUpperCase()
    );

    setRoomCode("");

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Join Room"
    >

      <div className="space-y-5">

        <Input
          label="Room Code"
          placeholder="Enter room code"
          value={roomCode}
          onChange={(e) =>
            setRoomCode(e.target.value)
          }
        />

        <Button
          className="w-full"
          onClick={handleJoin}
        >
          Join Room
        </Button>

      </div>

    </Modal>
  );
}