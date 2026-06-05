from contextlib import asynccontextmanager
from fastapi import FastAPI

from core.database import Base, engine
from routes.auth import auth_router
from routes.rooms import room_router
from routes.game import game_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Guess The Word",
    description="GTW game backend service",
    lifespan=lifespan,
)

app.include_router(router=auth_router)
app.include_router(router=room_router)
app.include_router(router=game_router)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app=app, host="0.0.0.0", port=8080)
