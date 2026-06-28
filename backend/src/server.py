from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.database import Base, engine
from routes.auth import auth_router
from routes.rooms import room_router
from routes.game import game_router
from routes.ws import ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Guess The Word",
    description="GTW game backend service",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router=auth_router)
app.include_router(router=room_router)
app.include_router(router=game_router)
app.include_router(router=ws_router)

if __name__ == '__main__':
    import uvicorn
    print("Docs URL: http://localhost:8080/docs")
    uvicorn.run(app=app, host="0.0.0.0", port=8080)
