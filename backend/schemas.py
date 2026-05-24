from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


# ── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "alex"
            }
        }
    )

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    user_id: int


# ── User ─────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Room ─────────────────────────────────────────────────────────────────────

class CreateRoomRequest(BaseModel):
    max_players: int = Field(default=8, ge=2, le=12)
    total_turns: int = Field(default=3, ge=1, le=10)
    turn_duration_seconds: int = Field(default=180, ge=30, le=600)


class PlayerInRoom(BaseModel):
    user_id: int
    username: str
    join_order: int
    score: int
    is_active: bool

    class Config:
        from_attributes = True


class RoomOut(BaseModel):
    id: int
    room_code: str
    owner_id: int
    owner_username: str
    status: str
    max_players: int
    total_turns: int
    turn_duration_seconds: int
    player_count: int
    players: list[PlayerInRoom]
    created_at: datetime

    class Config:
        from_attributes = True


class JoinRoomRequest(BaseModel):
    room_code: str = Field(..., min_length=6, max_length=8)


# ── Game ─────────────────────────────────────────────────────────────────────

class TurnOut(BaseModel):
    id: int
    turn_number: int
    drawer_id: int
    drawer_username: str
    started_at: datetime
    status: str

    class Config:
        from_attributes = True


class GameOut(BaseModel):
    id: int
    room_id: int
    current_turn: int
    status: str
    started_at: datetime
    turns: list[TurnOut]

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    user_id: int
    username: str
    score: int
    rank: int


class GameResult(BaseModel):
    game_id: int
    room_code: str
    leaderboard: list[LeaderboardEntry]


# ── WebSocket Message Shapes ──────────────────────────────────────────────────

class WSMessage(BaseModel):
    """Base shape for all outbound WebSocket events."""
    event: str
    data: dict