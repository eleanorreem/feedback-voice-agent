import time
import random
from prompts import OPENING_QUESTIONS


class SessionManager:
    def __init__(self, max_questions: int = 3, max_duration_seconds: int = 600):
        self.max_questions = max_questions
        self.max_duration_seconds = max_duration_seconds
        self.user_turns = 0
        self.start_time: float | None = None
        self.state = "GREETING"
        self.warning_given = False
        self.transcript: list[dict] = []

    def start(self):
        self.start_time = time.time()
        self.state = "CONVERSATION"

    @property
    def elapsed_seconds(self) -> int:
        if self.start_time is None:
            return 0
        return int(time.time() - self.start_time)

    @property
    def remaining_seconds(self) -> int:
        return max(0, self.max_duration_seconds - self.elapsed_seconds)

    @property
    def should_warn(self) -> bool:
        return (
            not self.warning_given
            and self.remaining_seconds <= 60
            and self.remaining_seconds > 0
        )

    @property
    def should_end(self) -> bool:
        return self.remaining_seconds <= 0

    @property
    def all_questions_answered(self) -> bool:
        return self.user_turns >= self.max_questions

    def record_user_turn(self):
        self.user_turns += 1

    def add_transcript_entry(self, role: str, content: str):
        self.transcript.append(
            {
                "role": role,
                "content": content,
                "timestamp": time.time(),
            }
        )

    def select_opening_question(
        self,
        session_number: int,
        past_reflections: list[dict],
    ) -> str:
        """Select an opening question based on session history."""
        # Sessions 1-3: random selection from question bank
        if session_number <= 3 or not past_reflections:
            return random.choice(OPENING_QUESTIONS)

        # Session 4+: 50% chance of referencing past sessions
        if random.random() < 0.5 and past_reflections:
            recent = past_reflections[0]
            themes = recent.get("themes", [])
            mood = recent.get("mood", "")

            if themes:
                theme = random.choice(themes)
                return (
                    f"Last time we chatted, {theme} came up. "
                    f"How are things going with that?"
                )
            elif mood:
                return (
                    f"Last time you mentioned feeling {mood}. "
                    f"How have things been since then?"
                )

        return random.choice(OPENING_QUESTIONS)
