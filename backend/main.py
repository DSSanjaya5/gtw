from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine

from routers.auth import router as auth_router
from routers.rooms import router as rooms_router
from routers.game import router as game_router

from ws.game_ws import router as ws_router

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Guess The Word API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(rooms_router, prefix="/rooms", tags=["Rooms"])
app.include_router(game_router, prefix="/game", tags=["Game"])

# WebSocket router
app.include_router(ws_router)


@app.get("/")
async def root():
    return {
        "message": "Guess The Word Backend Running"
    }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app=app, port=8000, host="0.0.0.0")