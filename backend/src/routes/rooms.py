from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.constants import MAX_PLAYERS
from core.database import get_db
from core.dependencies import get_current_user
from core.models import Room, User
from schemas.rooms import (
    CreateRoomRequest,
    JoinRoomRequest,
)

room_router = APIRouter(tags=["Rooms"])


@room_router.post("/rooms")
async def create_room(
    payload: CreateRoomRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = Room(
        name=payload.name,
        host_id=current_user.id,
        turns=payload.turns,
        turn_duration=payload.turn_duration,
        players=[
            {
                "id": current_user.id,
                "name": current_user.name,
            }
        ],
    )

    db.add(room)
    db.commit()
    db.refresh(room)

    return room


@room_router.get("/rooms")
async def list_rooms(
    db: Session = Depends(get_db),
):
    return db.query(Room).all()


@room_router.post("/rooms/join")
async def join_room(
    payload: JoinRoomRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = db.get(Room, payload.room_id)

    if not room:
        raise HTTPException(404, "Room not found")

    if len(room.players) >= MAX_PLAYERS:
        raise HTTPException(400, "Room is full")

    if not any(
        p["id"] == current_user.id
        for p in room.players
    ):
        room.players.append(
            {
                "id": current_user.id,
                "name": current_user.name,
            }
        )

        db.commit()

    return room


@room_router.get("/rooms/{room_id}")
async def get_room(
    room_id: str,
    db: Session = Depends(get_db),
):
    room = db.get(Room, room_id)

    if not room:
        raise HTTPException(404, "Room not found")

    return room