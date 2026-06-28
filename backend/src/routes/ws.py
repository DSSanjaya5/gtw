from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from core.database import SessionLocal
from core.models import User
from core.ws_manager import manager

ws_router = APIRouter(tags=["WebSocket"])


@ws_router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    token: str = Query(..., description="User's access_token (UUID)"),
):
    # Validate the connecting user
    db = SessionLocal()
    try:
        user = db.get(User, token)
        if not user:
            await websocket.close(code=4001)
            return
    finally:
        db.close()

    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Dumb relay — forward to everyone else in the room
            await manager.broadcast(room_id, data, exclude=websocket)
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
