from datetime import datetime
from sqlalchemy.orm import Session
import models
from words import get_words_for_game

# ── Scoring ──────────────────────────────────────────────────────────────────

MAX_POINTS = 500
MIN_POINTS = 50


def calculate_points(turn_duration_seconds: int, elapsed_seconds: float, correct_guessers_before: int) -> int:
    """
    Points decrease the longer a player takes to guess.
    First correct guesser gets highest points within the time window.
    """
    # Time-based decay: full points at 0s, min points at turn_duration
    time_fraction = min(elapsed_seconds / turn_duration_seconds, 1.0)
    time_points = int(MAX_POINTS - (MAX_POINTS - MIN_POINTS) * time_fraction)

    # Small bonus for being first / early guesser (10 pts per position ahead)
    order_bonus = max(0, 30 - correct_guessers_before * 10)

    return max(MIN_POINTS, time_points + order_bonus)


def drawer_points_for_turn(correct_guessers: int, total_players: int) -> int:
    """Drawer earns points based on how many players guessed correctly."""
    if total_players <= 1:
        return 0
    ratio = correct_guessers / (total_players - 1)  # exclude drawer
    return int(MAX_POINTS * ratio * 0.5)  # drawer earns up to 50% of max


# ── Turn / Game Helpers ───────────────────────────────────────────────────────

def create_game_with_turns(room: models.Room, db: Session) -> models.Game:
    """
    Creates the Game record and pre-generates all Turn records with assigned words.
    Each player draws once per round; rounds = total_turns.
    """
    active_players = [p for p in room.players if p.is_active]
    num_players = len(active_players)
    total_turns = room.total_turns

    word_list = get_words_for_game(total_turns, num_players)

    game = models.Game(room_id=room.id, status="active")
    db.add(game)
    db.flush()  # get game.id

    word_idx = 0
    for turn_number in range(1, total_turns + 1):
        for player in active_players:
            turn = models.Turn(
                game_id=game.id,
                turn_number=turn_number,
                drawer_id=player.user_id,
                word=word_list[word_idx],
                status="pending",
            )
            db.add(turn)
            word_idx += 1

    db.commit()
    db.refresh(game)
    return game


def get_next_pending_turn(game: models.Game, db: Session) -> models.Turn | None:
    """Returns the next pending turn ordered by (turn_number, join_order of drawer)."""
    return (
        db.query(models.Turn)
        .join(models.RoomPlayer, models.RoomPlayer.user_id == models.Turn.drawer_id)
        .filter(
            models.Turn.game_id == game.id,
            models.Turn.status == "pending",
            models.RoomPlayer.room_id == game.room_id,
        )
        .order_by(models.Turn.turn_number, models.RoomPlayer.join_order)
        .first()
    )


def get_active_players_count(room: models.Room) -> int:
    return sum(1 for p in room.players if p.is_active)


def all_guessed(turn: models.Turn, room: models.Room) -> bool:
    """True when every non-drawer active player has guessed correctly."""
    active_non_drawers = [p for p in room.players if p.is_active and p.user_id != turn.drawer_id]
    correct_user_ids = {g.user_id for g in turn.guesses if g.is_correct}
    return all(p.user_id in correct_user_ids for p in active_non_drawers)


def finish_turn(turn: models.Turn, game: models.Game, room: models.Room, db: Session):
    """Mark turn finished, award drawer points, update room player scores."""
    turn.status = "finished"
    turn.ended_at = datetime.utcnow()

    correct_count = sum(1 for g in turn.guesses if g.is_correct)
    drawer_pts = drawer_points_for_turn(correct_count, get_active_players_count(room))

    # Credit drawer
    drawer_slot = next((p for p in room.players if p.user_id == turn.drawer_id), None)
    if drawer_slot:
        drawer_slot.score += drawer_pts

    db.commit()
    return drawer_pts


def finish_game(game: models.Game, room: models.Room, db: Session):
    game.status = "finished"
    game.finished_at = datetime.utcnow()
    room.status = "finished"
    db.commit()


def build_leaderboard(room: models.Room) -> list[dict]:
    players = sorted(
        [p for p in room.players if p.is_active],
        key=lambda p: p.score,
        reverse=True,
    )
    return [
        {
            "user_id": p.user_id,
            "username": p.user.username,
            "score": p.score,
            "rank": idx + 1,
        }
        for idx, p in enumerate(players)
    ]


def get_masked_word(db: Session, room_code: str) -> str:

    room = (
        db.query(models.Room)
        .filter(models.Room.room_code == room_code)
        .first()
    )

    if not room:
        return ""

    game = (
        db.query(models.Game)
        .filter(
            models.Game.room_id == room.id,
            models.Game.status == "active"
        )
        .first()
    )

    if not game:
        return ""

    current_turn = (
        db.query(models.Turn)
        .filter(
            models.Turn.game_id == game.id,
            models.Turn.status == "active"
        )
        .first()
    )

    if not current_turn:
        return ""

    return " ".join("_" for _ in current_turn.word)


def process_guess(
    db: Session,
    room_code: str,
    user_id: int,
    username: str,
    guess: str,
):

    room = (
        db.query(models.Room)
        .filter(models.Room.room_code == room_code)
        .first()
    )

    if not room:
        return {"correct": False}

    game = (
        db.query(models.Game)
        .filter(
            models.Game.room_id == room.id,
            models.Game.status == "active"
        )
        .first()
    )

    if not game:
        return {"correct": False}

    current_turn = (
        db.query(models.Turn)
        .filter(
            models.Turn.game_id == game.id,
            models.Turn.status == "active"
        )
        .first()
    )

    if not current_turn:
        return {"correct": False}

    # Drawer cannot guess
    if current_turn.drawer_id == user_id:
        return {"correct": False}

    normalized_guess = guess.strip().lower()
    correct_word = current_turn.word.strip().lower()

    if normalized_guess != correct_word:
        return {"correct": False}

    # Already guessed correctly
    existing_correct = (
        db.query(models.Guess)
        .filter(
            models.Guess.turn_id == current_turn.id,
            models.Guess.user_id == user_id,
            models.Guess.is_correct == True,
        )
        .first()
    )

    if existing_correct:
        return {"correct": False}

    correct_guessers_before = (
        db.query(models.Guess)
        .filter(
            models.Guess.turn_id == current_turn.id,
            models.Guess.is_correct == True,
        )
        .count()
    )

    now = datetime.utcnow()

    elapsed_seconds = (
        now - current_turn.started_at
    ).total_seconds()

    points = calculate_points(
        turn_duration_seconds=room.turn_duration_seconds,
        elapsed_seconds=elapsed_seconds,
        correct_guessers_before=correct_guessers_before,
    )

    guess_entry = models.Guess(
        turn_id=current_turn.id,
        user_id=user_id,
        guess_text=guess,
        is_correct=True,
        guessed_at=now,
        points_awarded=points,
    )

    db.add(guess_entry)

    room_player = (
        db.query(models.RoomPlayer)
        .filter(
            models.RoomPlayer.room_id == room.id,
            models.RoomPlayer.user_id == user_id,
        )
        .first()
    )

    if room_player:
        room_player.score += points

    db.commit()

    return {
        "correct": True,
        "points": points,
        "total_score": room_player.score if room_player else points,
    }