from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.exc import SQLAlchemyError

from core.constants import MIN_PLAYERS, MAX_PLAYERS
from core.database import get_db
from core.dependencies import get_current_user
from core.models import Room, User
from core.word_generator import get_word_choices
from schemas.game import GuessRequest, ChooseWordRequest

game_router = APIRouter(tags=["Game"])


def _current_drawer(room: Room) -> dict:
    """Round-robin: players[(turn-1) % player_count]."""
    idx = (room.current_turn - 1) % len(room.players)
    return room.players[idx]


# ── Start game ──────────────────────────────────────────────────────────────

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
        raise HTTPException(400, f"At least {MIN_PLAYERS} players required")
    if players_count > MAX_PLAYERS:
        raise HTTPException(400, f"Maximum {MAX_PLAYERS} players allowed")
    if room.status != "waiting":
        raise HTTPException(400, "Game already started")

    try:
        room.status = "in_progress"
        room.current_turn = 1
        room.current_word = None
        room.guessed_players = []
        
        # Ensure scores are initialized to 0
        players = room.players.copy()
        for p in players:
            p["score"] = 0
        room.players = players
        flag_modified(room, "players")
        
        db.commit()
        db.refresh(room)
    except SQLAlchemyError:
        db.rollback()
        raise

    drawer = _current_drawer(room)

    return {
        "drawer_id":   drawer["id"],
        "drawer_name": drawer["name"],
        "current_turn": 1,
        "total_turns":  players_count * room.turns,
    }


# ── Word choices (drawer only) ───────────────────────────────────────────────

@game_router.get("/game/{room_id}/word-choices")
async def fetch_word_choices(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = db.get(Room, room_id)

    if not room:
        raise HTTPException(404, "Room not found")
    if room.status != "in_progress":
        raise HTTPException(400, "Game is not in progress")

    drawer = _current_drawer(room)
    if drawer["id"] != current_user.id:
        raise HTTPException(403, "Only the current drawer can fetch word choices")

    return {"choices": get_word_choices(3)}


# ── Confirm chosen word ──────────────────────────────────────────────────────

@game_router.post("/game/{room_id}/choose-word")
async def choose_word(
    room_id: str,
    payload: ChooseWordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = db.get(Room, room_id)

    if not room:
        raise HTTPException(404, "Room not found")
    if room.status != "in_progress":
        raise HTTPException(400, "Game is not in progress")

    drawer = _current_drawer(room)
    if drawer["id"] != current_user.id:
        raise HTTPException(403, "Only the current drawer can choose the word")
    if room.current_word:
        raise HTTPException(400, "Word already chosen for this turn")

    word = payload.word.strip().lower()
    if not word:
        raise HTTPException(400, "Word cannot be empty")

    try:
        room.current_word = word
        room.guessed_players = []
        flag_modified(room, "guessed_players")
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise

    return {"success": True, "word_length": len(word)}


# ── Hint for guessers ────────────────────────────────────────────────────────

@game_router.get("/game/{room_id}/hint")
async def get_hint(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = db.get(Room, room_id)

    if not room:
        raise HTTPException(404, "Room not found")
    if not any(p["id"] == current_user.id for p in room.players):
        raise HTTPException(403, "You are not part of this room")
    if room.status != "in_progress":
        raise HTTPException(400, "Game is not in progress")
    if not room.current_word:
        raise HTTPException(400, "No word chosen yet")

    return {"word_length": len(room.current_word)}


# ── Submit guess (automatic turn progression once all guessers guess) ─────────

@game_router.post("/game/{room_id}/guess")
async def submit_guess(
    room_id: str,
    payload: GuessRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = db.get(Room, room_id)

    if not room:
        raise HTTPException(404, "Room not found")
    if room.status != "in_progress":
        raise HTTPException(400, "Game is not in progress")

    drawer = _current_drawer(room)
    if drawer["id"] == current_user.id:
        raise HTTPException(400, "Drawer cannot guess")
    if not any(p["id"] == current_user.id for p in room.players):
        raise HTTPException(403, "You are not part of this room")
    if not room.current_word:
        raise HTTPException(400, "No word chosen yet")

    if current_user.id in room.guessed_players:
        return {"correct": True, "status": "active"}

    guess = payload.guess.strip().lower()
    correct = guess == room.current_word.lower()

    if correct:
        # Calculate speed-based score (max 1000, min 200)
        time_left = payload.time_left if payload.time_left is not None else room.turn_duration
        time_left = min(max(0, time_left), room.turn_duration)
        
        guesser_score = 200 + int((time_left / room.turn_duration) * 800)
        drawer_score = int(guesser_score / 2)

        try:
            players = room.players.copy()
            for p in players:
                if p["id"] == current_user.id:
                    p["score"] = p.get("score", 0) + guesser_score
                elif p["id"] == drawer["id"]:
                    p["score"] = p.get("score", 0) + drawer_score
            room.players = players
            flag_modified(room, "players")

            guessed_list = room.guessed_players.copy()
            if current_user.id not in guessed_list:
                guessed_list.append(current_user.id)
            room.guessed_players = guessed_list
            flag_modified(room, "guessed_players")
            db.commit()
            db.refresh(room)
        except SQLAlchemyError:
            db.rollback()
            raise

        guessers_count = len(room.players) - 1
        all_guessed = len(room.guessed_players) >= guessers_count

        if all_guessed:
            # Word that ended
            previous_word = room.current_word

            # Auto-advance the turn or finish the game
            total_turns = len(room.players) * room.turns
            if room.current_turn >= total_turns:
                try:
                    room.status = "finished"
                    room.current_word = None
                    room.guessed_players = []
                    flag_modified(room, "guessed_players")
                    db.commit()
                except SQLAlchemyError:
                    db.rollback()
                    raise
                return {"correct": True, "status": "game_over", "word": previous_word}
            else:
                try:
                    room.current_turn += 1
                    room.current_word = None
                    room.guessed_players = []
                    flag_modified(room, "guessed_players")
                    db.commit()
                    db.refresh(room)
                except SQLAlchemyError:
                    db.rollback()
                    raise

                next_drawer = _current_drawer(room)
                return {
                    "correct": True,
                    "status": "next_turn",
                    "word": previous_word,
                    "next_turn": room.current_turn,
                    "total_turns": total_turns,
                    "drawer_id": next_drawer["id"],
                    "drawer_name": next_drawer["name"],
                }

        return {"correct": True, "status": "active"}

    return {"correct": False, "status": "active"}


# ── End turn (Manual/Timer) ──────────────────────────────────────────────────

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
        raise HTTPException(403, "Only host can end turn")
    if room.status != "in_progress":
        raise HTTPException(400, "Game has not started")

    previous_word = room.current_word or ""
    total_turns = len(room.players) * room.turns

    if room.current_turn >= total_turns:
        try:
            room.status = "finished"
            room.current_word = None
            room.guessed_players = []
            flag_modified(room, "guessed_players")
            db.commit()
        except Exception:
            db.rollback()
            raise
        return {"status": "game_over", "word": previous_word}

    try:
        room.current_turn += 1
        room.current_word = None
        room.guessed_players = []
        flag_modified(room, "guessed_players")
        db.commit()
        db.refresh(room)
    except Exception:
        db.rollback()
        raise

    drawer = _current_drawer(room)

    return {
        "status":      "next_turn",
        "word":        previous_word,
        "next_turn":   room.current_turn,
        "total_turns": total_turns,
        "drawer_id":   drawer["id"],
        "drawer_name": drawer["name"],
    }