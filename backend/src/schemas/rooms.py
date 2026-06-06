from pydantic import BaseModel, Field


class CreateRoomRequest(BaseModel):

    max_players: int = Field(
        default=8,
        ge=2,
        le=8,
    )

    turns: int = Field(
        default=3,
        ge=2,
        le=10,
    )

    turn_duration: int = Field(
        default=120,
        ge=60,
        le=180,
    )


class JoinRoomRequest(BaseModel):
    room_id: str