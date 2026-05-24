import asyncio
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

import models

from auth import get_user_id_from_token
from database import SessionLocal
from game_logic import process_guess, get_masked_word
from ws.manager import manager

router = APIRouter()


@router.websocket("/ws/game/{room_code}")
async def game_websocket(
    websocket: WebSocket,
    room_code: str,
    token: str,
):
    """
    WebSocket endpoint.

    Example:
    ws://localhost:8000/ws/game/ROOM123?token=xxxxx
    """

    db: Session = SessionLocal()

    # ==========================================================
    # AUTH
    # ==========================================================

    user_id = get_user_id_from_token(token)

    if not user_id:
        await websocket.close(code=1008)
        return

    user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )

    if not user:
        await websocket.close(code=1008)
        return

    username = user.username

    # ==========================================================
    # CONNECT
    # ==========================================================

    await manager.connect(
        websocket=websocket,
        room_code=room_code,
        user_id=user_id,
        username=username,
    )

    try:

        # Notify room
        await manager.broadcast(
            room_code=room_code,
            event="player_joined",
            data={
                "user_id": user_id,
                "username": username,
                "players": manager.get_connected_users(room_code),
            },
        )

        while True:

            payload = await websocket.receive_json()

            event = payload.get("event")
            data = payload.get("data", {})

            # ======================================================
            # DRAW EVENT
            # ======================================================

            if event == "draw":

                await manager.broadcast_except(
                    room_code=room_code,
                    exclude_user_id=user_id,
                    event="draw",
                    data={
                        "username": username,
                        "frame": data,
                    },
                )

            # ======================================================
            # GUESS EVENT
            # ======================================================

            elif event == "guess":

                guess = data.get("guess", "").strip()

                if not guess:
                    continue

                result = process_guess(
                    db=db,
                    room_code=room_code,
                    user_id=user_id,
                    username=username,
                    guess=guess,
                )

                # Correct guess
                if result["correct"]:

                    await manager.broadcast(
                        room_code=room_code,
                        event="correct_guess",
                        data={
                            "user_id": user_id,
                            "username": username,
                            "guess": guess,
                            "points": result["points"],
                            "total_score": result["total_score"],
                        },
                    )

                    # ======================================================
                    # CHECK IF EVERYONE GUESSED
                    # ======================================================

                    active_turn = (
                        db.query(models.Turn)
                        .join(models.Game)
                        .join(models.Room)
                        .filter(
                            models.Room.room_code == room_code,
                            models.Turn.status == "active",
                        )
                        .first()
                    )

                    if active_turn:

                        room = (
                            db.query(models.Room)
                            .filter(
                                models.Room.id == active_turn.game.room_id
                            )
                            .first()
                        )

                        from game_logic import (
                            all_guessed,
                            finish_turn,
                            finish_game,
                        )

                        if all_guessed(active_turn, room):

                            drawer_points = finish_turn(
                                active_turn,
                                active_turn.game,
                                room,
                                db,
                            )

                            await manager.broadcast(
                                room_code=room_code,
                                event="turn_ended",
                                data={
                                    "word": active_turn.word,
                                    "drawer_points": drawer_points,
                                },
                            )

                            # ==============================================
                            # NEXT TURN
                            # ==============================================

                            next_turn = (
                                db.query(models.Turn)
                                .filter(
                                    models.Turn.game_id == active_turn.game.id,
                                    models.Turn.status == "pending",
                                )
                                .order_by(models.Turn.turn_number.asc())
                                .first()
                            )

                            if next_turn:

                                await _start_turn(
                                    room_code,
                                    active_turn.game,
                                    room,
                                    db,
                                )

                            else:

                                finish_game(
                                    active_turn.game,
                                    room,
                                    db,
                                )

                                await manager.broadcast(
                                    room_code=room_code,
                                    event="game_finished",
                                    data={},
                                )

                # Normal chat
                else:

                    await manager.broadcast(
                        room_code=room_code,
                        event="chat",
                        data={
                            "user_id": user_id,
                            "username": username,
                            "message": guess,
                        },
                    )

            # ======================================================
            # STATE EVENT
            # ======================================================

            elif event == "state":

                masked_word = get_masked_word(
                    db=db,
                    room_code=room_code,
                )

                await manager.send_to_user(
                    room_code=room_code,
                    user_id=user_id,
                    event="state",
                    data={
                        "room_code": room_code,
                        "masked_word": masked_word,
                        "players": manager.get_connected_users(room_code),
                    },
                )

            # ======================================================
            # PING
            # ======================================================

            elif event == "ping":

                await manager.send_to_user(
                    room_code=room_code,
                    user_id=user_id,
                    event="pong",
                    data={},
                )

    except WebSocketDisconnect:

        manager.disconnect(
            websocket=websocket,
            room_code=room_code,
        )

        await manager.broadcast(
            room_code=room_code,
            event="player_left",
            data={
                "user_id": user_id,
                "username": username,
                "players": manager.get_connected_users(room_code),
            },
        )

    except Exception as e:

        print(f"[WS ERROR] {e}")

        manager.disconnect(
            websocket=websocket,
            room_code=room_code,
        )

    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# TURN MANAGEMENT
# ─────────────────────────────────────────────────────────────

async def _start_turn(room_code, game, room, db):

    next_turn = (
        db.query(models.Turn)
        .filter(
            models.Turn.game_id == game.id,
            models.Turn.status == "pending",
        )
        .order_by(
            models.Turn.turn_number.asc(),
            models.Turn.id.asc(),
        )
        .first()
    )

    if not next_turn:

        game.status = "finished"
        room.status = "finished"

        db.commit()

        await manager.broadcast(
            room_code=room_code,
            event="game_finished",
            data={},
        )

        return

    # ==========================================================
    # START TURN
    # ==========================================================

    next_turn.status = "active"
    next_turn.started_at = datetime.utcnow()

    game.current_turn = next_turn.turn_number

    db.commit()

    # Secret word only for drawer
    await manager.send_to_user(
        room_code=room_code,
        user_id=next_turn.drawer_id,
        event="your_turn",
        data={
            "turn_id": next_turn.id,
            "word": next_turn.word,
            "turn_number": next_turn.turn_number,
        },
    )

    # Notify other players
    await manager.broadcast_except(
        room_code=room_code,
        exclude_user_id=next_turn.drawer_id,
        event="turn_started",
        data={
            "turn_id": next_turn.id,
            "turn_number": next_turn.turn_number,
            "drawer_id": next_turn.drawer_id,
            "drawer_username": next_turn.drawer.username,
            "masked_word": " ".join("_" for _ in next_turn.word),
        },
    )

    # ==========================================================
    # TURN TIMER
    # ==========================================================

    await asyncio.sleep(room.turn_duration_seconds)

    # ==========================================================
    # FINISH TURN
    # ==========================================================

    next_turn.status = "finished"
    next_turn.ended_at = datetime.utcnow()

    db.commit()

    await manager.broadcast(
        room_code=room_code,
        event="turn_ended",
        data={
            "turn_id": next_turn.id,
        },
    )

    # ==========================================================
    # START NEXT TURN
    # ==========================================================

    await _start_turn(
        room_code=room_code,
        game=game,
        room=room,
        db=db,
    )