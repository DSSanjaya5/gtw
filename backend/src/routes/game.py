from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.constants import MIN_PLAYERS, MAX_PLAYERS
from core.database import get_db
from core.dependencies import get_current_user
from core.models import Room, User
from core.word_generator import get_random_word

game_router = APIRouter(tags=["Game"])


@game_router.post("/game/start/{room_id}")
async def start_game(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = db.get(Room, room_id)

    if not room:
        raise HTTPException(404, "Room not found")

    if room.host_id != current_user.id:
        raise HTTPException(403, "Only host can start")
    
    players_count = len(room.players)

    if players_count < MIN_PLAYERS:
        raise HTTPException(
            status_code=400,
            detail=f"At least {MIN_PLAYERS} players are required to start the game",
        )

    if players_count > MAX_PLAYERS:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_PLAYERS} players are allowed",
        )

    if room.status != "waiting":
        raise HTTPException(
            400,
            "Game already started"
        )

    try:
        room.status = "in_progress"
        room.current_turn = 1

        db.commit()
        db.refresh(room)

    except SQLAlchemyError:
        db.rollback()
        raise

    return {
        "word": get_random_word(),  # replace with generator
        "drawer_id": room.host_id,
        "turn": 1,
        "round": 1,
    }


@game_router.post("/game/{room_id}/end-turn")
async def end_turn(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = db.get(Room, room_id)

    if not room:
        raise HTTPException(404, "Room not found")

    if room.host_id != current_user.id:
        raise HTTPException(
            403,
            "Only host can end turn",
        )
    
    if room.status != "in_progress":
        raise HTTPException(
            400,
            "Game has not started"
        )

    total_turns = len(room.players) * room.turns

    if room.current_turn >= total_turns:
        try:
            room.status = "finished"

            db.commit()
            db.refresh(room)

        except Exception:
            db.rollback()
            raise
        return {
            "status": "game_over",
        }
    
    try:
        room.current_turn += 1
        db.commit()
        db.refresh(room)
    except Exception:
        db.rollback()
        raise

    return {
        "status": "next_turn",
        "word": get_random_word(),
        "next_turn": room.current_turn,
        "total_turns": total_turns,
    }