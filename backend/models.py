from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    rooms_owned = relationship("Room", back_populates="owner")
    player_slots = relationship("RoomPlayer", back_populates="user")
    guesses = relationship("Guess", back_populates="user")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String(8), unique=True, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="waiting")  # waiting | in_progress | finished
    max_players = Column(Integer, default=8)
    total_turns = Column(Integer, default=3)
    turn_duration_seconds = Column(Integer, default=180)  # 3 minutes
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="rooms_owned")
    players = relationship("RoomPlayer", back_populates="room", order_by="RoomPlayer.join_order")
    games = relationship("Game", back_populates="room")


class RoomPlayer(Base):
    __tablename__ = "room_players"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    join_order = Column(Integer, nullable=False)  # order in which they joined
    score = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    room = relationship("Room", back_populates="players")
    user = relationship("User", back_populates="player_slots")


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    current_turn = Column(Integer, default=0)  # which round (1-indexed)
    current_drawer_order = Column(Integer, default=0)  # join_order of current drawer
    status = Column(String(20), default="active")  # active | finished
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)

    # Relationships
    room = relationship("Room", back_populates="games")
    turns = relationship("Turn", back_populates="game")


class Turn(Base):
    __tablename__ = "turns"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    turn_number = Column(Integer, nullable=False)      # round number (1..total_turns)
    drawer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    word = Column(String(100), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="active")  # active | finished

    # Relationships
    game = relationship("Game", back_populates="turns")
    drawer = relationship("User")
    guesses = relationship("Guess", back_populates="turn")


class Guess(Base):
    __tablename__ = "guesses"

    id = Column(Integer, primary_key=True, index=True)
    turn_id = Column(Integer, ForeignKey("turns.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    guess_text = Column(String(200), nullable=False)
    is_correct = Column(Boolean, default=False)
    points_awarded = Column(Integer, default=0)
    guessed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    turn = relationship("Turn", back_populates="guesses")
    user = relationship("User", back_populates="guesses")
    