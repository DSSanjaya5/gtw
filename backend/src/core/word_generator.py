# core/word_generator.py

import random

WORDS = [
    "apple", "banana", "orange", "grapes", "watermelon",
    "pineapple", "mango", "strawberry", "peach", "pear",
    "elephant", "tiger", "lion", "zebra", "giraffe",
    "monkey", "rabbit", "horse", "kangaroo", "panda",
    "dog", "cat", "fish", "dolphin", "shark",
    "eagle", "parrot", "penguin", "owl", "butterfly",
    "car", "bus", "train", "airplane", "helicopter",
    "bicycle", "motorcycle", "scooter", "boat", "submarine",
    "house", "castle", "bridge", "tower", "school",
    "hospital", "library", "restaurant", "airport", "stadium",
    "computer", "laptop", "keyboard", "mouse", "monitor",
    "phone", "camera", "television", "speaker", "headphones",
    "book", "pencil", "eraser", "notebook", "backpack",
    "clock", "lamp", "chair", "table", "sofa",
    "bed", "pillow", "blanket", "mirror", "window",
    "sun", "moon", "star", "cloud", "rainbow",
    "mountain", "river", "ocean", "island", "volcano",
    "forest", "desert", "beach", "waterfall", "cave",
    "pizza", "burger", "sandwich", "cake", "icecream",
    "cookie", "donut", "popcorn", "coffee", "tea",
    "guitar", "piano", "drum", "violin", "trumpet",
    "football", "cricket", "basketball", "tennis", "baseball",
    "rocket", "astronaut", "planet", "satellite", "spaceship",
    "robot", "wizard", "dragon", "pirate", "superhero",
    "crown", "treasure", "diamond", "gold", "key",
    "umbrella", "balloon", "kite", "candle", "gift",
    "camera", "binoculars", "compass", "map", "anchor"
]


def get_random_word() -> str:
    return random.choice(WORDS)


def get_word_choices(n: int = 3) -> list[str]:
    """Return n unique random words for the drawer to choose from."""
    return random.sample(WORDS, min(n, len(WORDS)))