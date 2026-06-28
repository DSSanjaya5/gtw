from pydantic import BaseModel


class GuessRequest(BaseModel):
    guess: str
    time_left: int | None = None



class ChooseWordRequest(BaseModel):
    word: str