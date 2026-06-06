import uuid
from datetime import datetime

from sqlalchemy import String, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    name: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
    )


class Room(Base):
    __tablename__ = "rooms"

    room_id: Mapped[str] = mapped_column(
        String(6),
        primary_key=True,
    )

    host_id: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    players: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    turns: Mapped[int] = mapped_column(
        nullable=False,
        default=3,
    )

    turn_duration: Mapped[int] = mapped_column(
        nullable=False,
        default=120,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="waiting",
    )

    current_turn: Mapped[int] = mapped_column(
        nullable=False,
        default=0,
    )