# Multiplayer Drawing Guess Game — Architecture Plan

## Goal

Build a browser-based multiplayer drawing & guessing game (similar to Skribbl.io) using:

- Frontend: Browser (React JS)
- Backend: Python + FastAPI
- Hosting: Hugging Face / Vercel
- Minimal server load
- Real-time multiplayer
- Voice chat support

---

## Core Requirements

### Features

- Create room
- Join room using room code
- Turn-based drawing
- Guessing system
- Timer
- Points system
- Real-time drawing sync
- Voice chat
- Mic toggle
- Speaker toggle

---

## High-Level Architecture

```
                    +------------------------+
                    |  FastAPI Signaling API |
                    |------------------------|
                    | - Room creation        |
                    | - Room joining         |
                    | - Turn management      |
                    | - Timer sync           |
                    | - Score validation     |
                    | - WebRTC signaling     |
                    +-----------+------------+
                                |
                        Initial Handshake
                                |
                        +-------+-------+
                        |               |
                  +-----+----+      +-----+----+
                  | Client |      | Client | 
                  +--------+      +--------+
```

---

## Server Responsibilities (Minimal Load)

The server SHOULD NOT relay:

- Voice streams
- Canvas drawing frames
- Audio packets

The server ONLY handles:

- Room creation
- Room joining
- Player management
- Turn order
- Timer synchronization
- Score validation
- WebRTC signaling

---

## Why This Reduces Server Load

### Drawing Sync
Drawing data is sent directly between browsers using:

- WebRTC Data Channels

Instead of:

- Server WebSocket relay

This avoids heavy bandwidth usage on backend.

---

## Voice Chat

Voice is fully peer-to-peer using:

- WebRTC Audio Streams

Server only exchanges:

- SDP offers/answers
- ICE candidates

No audio flows through backend.

---

## Technology Stack

| Component | Technology |
|---|---|
| Backend API | FastAPI |
| Real-time Signaling | FastAPI WebSockets |
| Frontend | HTML/CSS/JavaScript |
| Drawing Canvas | HTML5 Canvas |
| Voice Chat | WebRTC |
| P2P Data | WebRTC Data Channels |
| Hosting | Hugging Face / Vercel |
| State Storage | In-memory initially |

---

## Game Flow

### 1. Room Creation

Player clicks:

- "Create Room"

Server generates:

- Unique room code

Example: ABCD12

Server stores:

```python
room = {
    "players": [],
    "host": player_id,
    "turn_order": [],
    "scores": {},
    "current_round": 0
}
```

### 2. Joining Room

Player enters room code.

Server:

- validates code
- adds player to room
- broadcasts updated player list

### 3. Starting Game

Host clicks:

- Start Game

Server:

- randomizes turn order
- initializes scores
- starts round timer

### 4. Turn System

For each turn:

- One player becomes drawer
- Server sends secret word ONLY to drawer
- Others receive:
  - blank state
  - timer start

### 5. Drawing Sync

Drawer:

- draws on canvas

Browser sends:

```json
{
  "x": 100,
  "y": 150,
  "color": "#000",
  "size": 5
}
```

Via:

- WebRTC Data Channel

Peers render drawing locally.

### Guessing System

Players send guesses.

Server validates guesses.

If correct:

- marks player as guessed
- calculates score
- updates leaderboard

### Timer System

Server maintains authoritative timer.

Every second:

```json
{
  "time_left": 42
}
```

broadcasted to clients.

When timer ends:

- round ends
- scores updated
- next player turn starts

### Points System

#### Guessing Points

Fastest correct guess gets highest points.

Example formula:

```
points = base_points - (time_taken * decay_factor)
```

Example:

| Guess Time | Points |
|------------|--------|
| 5 sec      | 100    |
| 15 sec     | 70     |
| 30 sec     | 40     |

#### Drawer Points

Drawer earns points for:

- every successful guess

Example:

```
drawer_points = correct_guesses * 50
```

#### Bonus Points

Optional:

- First guess bonus
- Perfect round bonus
- Streak bonus

### Voice Chat Architecture

#### Mic Button

Enables/disables:

- outgoing audio stream

#### Speaker Button

Mutes/unmutes:

- incoming audio streams

#### Voice Flow

```
Player A Browser
    ↓
WebRTC Audio Stream
    ↓
Player B Browser
```

No backend audio routing.

### State Management

#### Backend State

Temporary in-memory storage:

```python
rooms = {}
players = {}
```

Later scalable options:

- Redis
- PostgreSQL

### WebRTC Signaling Flow

#### Step 1

Client sends:

- Offer

to FastAPI signaling endpoint.

#### Step 2

Server forwards offer to peer.

#### Step 3

Peer responds with:

- Answer
- ICE candidates

#### Step 4

Direct P2P connection established.

### Hosting Plan

#### Frontend

Host on:

- Vercel
- OR
- Hugging Face Spaces

Static assets only.

#### Backend

Host FastAPI on:

- Hugging Face Spaces
- OR
- Railway
- OR
- Render

Backend load remains minimal.

### Scaling Characteristics

#### Good For

- Small friend groups
- Low-cost hosting
- Real-time casual gameplay

#### Limitations

P2P mesh becomes expensive with many players.

Recommended room size:

- 4–8 players

### Development Phases

#### Phase 1
- Room creation
- Join system
- Basic UI

#### Phase 2
- Canvas drawing
- Real-time sync

#### Phase 3
- Turn system
- Timer
- Score system

#### Phase 4
- Voice chat

#### Phase 5
- Polish
- Animations
- Deployment

### Final Architecture Philosophy

#### Heavy Work Happens On Clients

Browsers handle:

- drawing
- rendering
- audio
- syncing

#### Backend Only Coordinates

FastAPI acts as:

- coordinator
- validator
- signaling server

This keeps:

- server CPU low
- bandwidth low
- hosting cost low

while still enabling:

- real-time multiplayer
- voice chat
- synchronized gameplay

You can copy this entire block into a `.md` file and it will be ready as a **complete architecture plan**.

If you want, I can also make a **diagram image version embedded in Markdown** so it's more visual. Do you want me to do that next?