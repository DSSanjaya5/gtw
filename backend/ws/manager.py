import asyncio
import json
import logging
from datetime import datetime
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections grouped by room_code.
    Each connected client is stored with its user metadata.
    """

    def __init__(self):
        # room_code -> list of {"ws": WebSocket, "user_id": int, "username": str}
        self._rooms: dict[str, list[dict]] = {}
        # Tracks active turn timers: room_code -> asyncio.Task
        self._turn_timers: dict[str, asyncio.Task] = {}

    # ── Connection lifecycle ─────────────────────────────────────────────────

    async def connect(self, websocket: WebSocket, room_code: str, user_id: int, username: str):
        await websocket.accept()
        if room_code not in self._rooms:
            self._rooms[room_code] = []
        self._rooms[room_code].append(
            {"ws": websocket, "user_id": user_id, "username": username}
        )
        logger.info(f"[WS] {username} connected to room {room_code}")

    def disconnect(self, websocket: WebSocket, room_code: str):
        if room_code in self._rooms:
            self._rooms[room_code] = [
                c for c in self._rooms[room_code] if c["ws"] is not websocket
            ]
            if not self._rooms[room_code]:
                del self._rooms[room_code]

    def get_connected_users(self, room_code: str) -> list[dict]:
        return [
            {"user_id": c["user_id"], "username": c["username"]}
            for c in self._rooms.get(room_code, [])
        ]

    def is_connected(self, room_code: str, user_id: int) -> bool:
        return any(c["user_id"] == user_id for c in self._rooms.get(room_code, []))

    # ── Messaging ────────────────────────────────────────────────────────────

    async def broadcast(self, room_code: str, event: str, data: dict):
        """Send an event to every connected client in the room."""
        message = json.dumps({"event": event, "data": data})
        dead = []
        for conn in self._rooms.get(room_code, []):
            try:
                await conn["ws"].send_text(message)
            except Exception:
                dead.append(conn)
        for d in dead:
            self._rooms.get(room_code, []).remove(d)

    async def broadcast_except(self, room_code: str, exclude_user_id: int, event: str, data: dict):
        """Broadcast to everyone except one user (e.g. word is secret from guessers)."""
        message = json.dumps({"event": event, "data": data})
        for conn in self._rooms.get(room_code, []):
            if conn["user_id"] != exclude_user_id:
                try:
                    await conn["ws"].send_text(message)
                except Exception:
                    pass

    async def send_to_user(self, room_code: str, user_id: int, event: str, data: dict):
        """Send a message to a specific user in a room."""
        message = json.dumps({"event": event, "data": data})
        for conn in self._rooms.get(room_code, []):
            if conn["user_id"] == user_id:
                try:
                    await conn["ws"].send_text(message)
                except Exception:
                    pass
                break

    # ── Turn timer management ─────────────────────────────────────────────────

    def set_turn_timer(self, room_code: str, task: asyncio.Task):
        self.cancel_turn_timer(room_code)
        self._turn_timers[room_code] = task

    def cancel_turn_timer(self, room_code: str):
        task = self._turn_timers.pop(room_code, None)
        if task and not task.done():
            task.cancel()


# Singleton shared across the app
manager = ConnectionManager()