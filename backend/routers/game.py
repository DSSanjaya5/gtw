import asyncio

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

import models

from auth import get_user_id_from_token
from database import SessionLocal
from game_logic import create_game_with_turns, build_leaderboard
from schemas import (
    GameOut,
    TurnOut,
    GameResult,
    LeaderboardEntry,
)
from ws.game_ws import _start_turn
from ws.manager import manager

router = APIRouter()


# ─────────────────────────────────────────────────────────────
# Start Game
# ─────────────────────────────────────────────────────────────

@router.post("/start/{room_code}", response_model=GameOut)
async def start_game(
    room_code: str,
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
            .filter(models.Room.room_code == room_code.upper())
            .first()
        )

        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        # Only owner can start
        if room.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only room owner can start the game",
            )

        if room.status != "waiting":
            raise HTTPException(
                status_code=400,
                detail="Game already started",
            )

        active_players = [
            p for p in room.players if p.is_active
        ]

        if len(active_players) < 2:
            raise HTTPException(
                status_code=400,
                detail="Need at least 2 players",
            )

        # Start room
        room.status = "in_progress"

        db.commit()

        # Create game + turns
        game = create_game_with_turns(room, db)

        # Notify players
        await manager.broadcast(
            room_code.upper(),
            "game_started",
            {
                "game_id": game.id,
                "total_turns": room.total_turns,
                "players": [
                    {
                        "user_id": p.user_id,
                        "username": p.user.username,
                        "join_order": p.join_order,
                    }
                    for p in active_players
                ],
            },
        )

        async def delayed_start():
            await asyncio.sleep(2)

            await _start_turn(
                room_code.upper(),
                game,
                room,
                db,
            )

        # Start first turn
        asyncio.create_task(delayed_start())

        return _build_game_out(game)

    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# Game State
# ─────────────────────────────────────────────────────────────

@router.get("/{room_code}/state", response_model=GameOut)
def get_game_state(
    room_code: str,
):

    db: Session = SessionLocal()

    try:

        room = (
            db.query(models.Room)
            .filter(models.Room.room_code == room_code.upper())
            .first()
        )

        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        game = (
            db.query(models.Game)
            .filter(models.Game.room_id == room.id)
            .order_by(models.Game.started_at.desc())
            .first()
        )

        if not game:
            raise HTTPException(status_code=404, detail="No game found")

        return _build_game_out(game)

    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# Game Results
# ─────────────────────────────────────────────────────────────

@router.get("/{room_code}/results", response_model=GameResult)
def get_game_results(
    room_code: str,
):

    db: Session = SessionLocal()

    try:

        room = (
            db.query(models.Room)
            .filter(models.Room.room_code == room_code.upper())
            .first()
        )

        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        if room.status != "finished":
            raise HTTPException(
                status_code=400,
                detail="Game not finished yet",
            )

        leaderboard_raw = build_leaderboard(room)

        return GameResult(
            game_id=room.games[-1].id if room.games else 0,
            room_code=room.room_code,
            leaderboard=[
                LeaderboardEntry(**entry)
                for entry in leaderboard_raw
            ],
        )

    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# Internal Helpers
# ─────────────────────────────────────────────────────────────

def _build_game_out(game: models.Game) -> GameOut:

    turns = [
        TurnOut(
            id=t.id,
            turn_number=t.turn_number,
            drawer_id=t.drawer_id,
            drawer_username=t.drawer.username,
            started_at=t.started_at,
            status=t.status,
        )
        for t in game.turns
    ]

    return GameOut(
        id=game.id,
        room_id=game.room_id,
        current_turn=game.current_turn,
        status=game.status,
        started_at=game.started_at,
        turns=turns,
    )