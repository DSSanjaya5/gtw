from uuid import uuid4

TOKENS = {}


def create_token(user_id: int):
    token = str(uuid4())

    TOKENS[token] = user_id

    return token


def get_user_id_from_token(token: str):
    return TOKENS.get(token)