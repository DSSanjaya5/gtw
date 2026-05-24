import random

WORD_BANK = [
    # Animals
    "elephant", "giraffe", "penguin", "dolphin", "kangaroo", "flamingo",
    "octopus", "cheetah", "gorilla", "peacock", "crocodile", "butterfly",
    # Food
    "pizza", "sushi", "hamburger", "ice cream", "watermelon", "pancake",
    "broccoli", "chocolate", "sandwich", "popcorn", "spaghetti", "taco",
    # Objects
    "umbrella", "telescope", "backpack", "lighthouse", "bicycle", "submarine",
    "helicopter", "treasure", "volcano", "rainbow", "campfire", "compass",
    # Actions / Sports
    "swimming", "skateboard", "basketball", "surfing", "archery", "juggling",
    "parachute", "snowboard", "gymnastics", "wrestling", "bowling", "dancing",
    # Places
    "beach", "library", "airport", "hospital", "castle", "jungle",
    "museum", "stadium", "restaurant", "playground", "mountain", "desert",
    # Misc
    "robot", "wizard", "superhero", "mermaid", "dragon", "pirate",
    "astronaut", "scientist", "chef", "musician", "painter", "detective",
]


def get_random_word(exclude: list[str] | None = None) -> str:
    pool = [w for w in WORD_BANK if w not in (exclude or [])]
    if not pool:
        pool = WORD_BANK  # fallback: allow repeats if bank exhausted
    return random.choice(pool)


def get_words_for_game(num_turns: int, num_players: int) -> list[str]:
    """Pre-select unique words for all turns in a game."""
    total_needed = num_turns * num_players
    pool = WORD_BANK.copy()
    random.shuffle(pool)
    # cycle if needed
    words = []
    while len(words) < total_needed:
        words.extend(pool)
    return words[:total_needed]