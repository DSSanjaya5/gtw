import random
import string

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

import models

from auth import get_user_id_from_token
from database import SessionLocal
from schemas import CreateRoomRequest, JoinRoomRequest

router = APIRouter()


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def generate_room_code(length: int = 6):
    return "".join(
        random.choices(string.ascii_uppercase + string.digits, k=length)
    )


def build_room_response(room: models.Room):

    return {
        "id": room.id,
        "room_code": room.room_code,
        "owner_id": room.owner_id,
        "owner_username": room.owner.username,
        "status": room.status,
        "max_players": room.max_players,
        "total_turns": room.total_turns,
        "turn_duration_seconds": room.turn_duration_seconds,
        "player_count": len(room.players),
        "players": [
            {
                "user_id": p.user_id,
                "username": p.user.username,
                "join_order": p.join_order,
                "score": p.score,
                "is_active": p.is_active,
            }
            for p in room.players
        ],
        "created_at": room.created_at,
    }


# ─────────────────────────────────────────────────────────────
# Create Room
# ─────────────────────────────────────────────────────────────

@router.post("")
def create_room(
    payload: CreateRoomRequest,
    token: str,
):

    db: Session = SessionLocal()

    try:

        user_id = get_user_id_from_token(token)

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        current_user = (
            db.query(models.User)
            .filter(models.User.id == user_id)
            .first()
        )

        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        # Generate unique room code
        room_code = generate_room_code()

        while (
            db.query(models.Room)
            .filter(models.Room.room_code == room_code)
            .first()
        ):
            room_code = generate_room_code()

        # Create room
        room = models.Room(
            room_code=room_code,
            owner_id=current_user.id,
            max_players=payload.max_players,
            total_turns=payload.total_turns,
            turn_duration_seconds=payload.turn_duration_seconds,
        )

        db.add(room)
        db.commit()
        db.refresh(room)

        # Add owner as first player
        room_player = models.RoomPlayer(
            room_id=room.id,
            user_id=current_user.id,
            join_order=1,
        )

        db.add(room_player)
        db.commit()

        db.refresh(room)

        return build_room_response(room)

    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# Join Room
# ─────────────────────────────────────────────────────────────

@router.post("/join")
def join_room(
    payload: JoinRoomRequest,
    token: str,
):

    db: Session = SessionLocal()

    try:

        user_id = get_user_id_from_token(token)

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        current_user = (
            db.query(models.User)
            .filter(models.User.id == user_id)
            .first()
        )

        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        room = (
            db.query(models.Room)
            .filter(
                models.Room.room_code == payload.room_code.upper()
            )
            .first()
        )

        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        if room.status != "waiting":
            raise HTTPException(
                status_code=400,
                detail="Game already started",
            )

        # Already joined
        existing_player = (
            db.query(models.RoomPlayer)
            .filter(
                models.RoomPlayer.room_id == room.id,
                models.RoomPlayer.user_id == current_user.id,
            )
            .first()
        )

        if existing_player:
            return build_room_response(room)

        # Room full
        active_players = [p for p in room.players if p.is_active]

        if len(active_players) >= room.max_players:
            raise HTTPException(status_code=400, detail="Room is full")

        join_order = len(room.players) + 1

        room_player = models.RoomPlayer(
            room_id=room.id,
            user_id=current_user.id,
            join_order=join_order,
        )

        db.add(room_player)
        db.commit()

        db.refresh(room)

        return build_room_response(room)

    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# List Rooms
# ─────────────────────────────────────────────────────────────

@router.get("")
def list_rooms():

    db: Session = SessionLocal()

    try:

        rooms = (
            db.query(models.Room)
            .filter(models.Room.status == "waiting")
            .order_by(models.Room.created_at.desc())
            .all()
        )

        return [
            build_room_response(room)
            for room in rooms
        ]

    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# Get Room
# ─────────────────────────────────────────────────────────────

@router.get("/{room_code}")
def get_room(room_code: str):

    db: Session = SessionLocal()

    try:

        room = (
            db.query(models.Room)
            .filter(models.Room.room_code == room_code.upper())
            .first()
        )

        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        return build_room_response(room)

    finally:
        db.close()