from pydantic import BaseModel


class StartGameResponse(BaseModel):
    word: str
    drawer_id: str
    turn: int
    round: int


class EndTurnRequest(BaseModel):
    scores: dict[str, int]


class EndTurnResponse(BaseModel):
    status: str
    word: str | None = None
    results: dict[str, int] | None = None