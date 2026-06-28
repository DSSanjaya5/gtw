from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        self.rooms.setdefault(room_id, []).append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        room = self.rooms.get(room_id, [])
        try:
            room.remove(websocket)
        except ValueError:
            pass

    async def broadcast(self, room_id: str, data: dict, exclude: WebSocket = None):
        """Relay a message to all sockets in a room except the sender."""
        dead = []
        for ws in self.rooms.get(room_id, []):
            if ws is exclude:
                continue
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(room_id, ws)


manager = ConnectionManager()
