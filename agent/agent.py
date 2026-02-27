import asyncio
import json
import logging

from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, room_io, function_tool
from livekit.plugins import openai, noise_cancellation
from openai import AsyncOpenAI

from db import get_user_session_count, get_user_reflections, save_reflection
from prompts import build_system_prompt, SUMMARY_GENERATION_PROMPT
from session_manager import SessionManager

load_dotenv(".env.local")

logger = logging.getLogger("reflective-journal")

# Standard OpenAI client for summary generation (not the LiveKit plugin)
openai_client = AsyncOpenAI()


class ReflectiveJournalAgent(Agent):
    def __init__(
        self,
        instructions: str,
        session_manager: SessionManager,
        user_id: str,
    ):
        super().__init__(instructions=instructions)
        self.session_mgr = session_manager
        self.user_id = user_id

    @function_tool
    async def end_session(self) -> str:
        """End the journaling session early. Use this when the user clearly signals they want to stop."""
        self.session_mgr.state = "WRAPPING_UP"
        return "Session ending. Wrapping up now."


async def _extract_user_id(ctx: agents.JobContext) -> str | None:
    """Extract user_id from participant metadata."""
    # Check existing participants
    for participant in ctx.room.remote_participants.values():
        if participant.metadata:
            try:
                meta = json.loads(participant.metadata)
                return meta.get("userId")
            except (json.JSONDecodeError, AttributeError):
                pass
        # Also check identity-based approach
        if participant.identity and participant.identity.startswith("user_"):
            return participant.identity.removeprefix("user_")

    # Wait for a participant to connect (up to 30 seconds)
    connected = asyncio.Event()
    user_id_result = [None]

    def on_participant_connected(participant: rtc.RemoteParticipant):
        if participant.metadata:
            try:
                meta = json.loads(participant.metadata)
                user_id_result[0] = meta.get("userId")
            except (json.JSONDecodeError, AttributeError):
                pass
        if not user_id_result[0] and participant.identity.startswith("user_"):
            user_id_result[0] = participant.identity.removeprefix("user_")
        connected.set()

    ctx.room.on("participant_connected", on_participant_connected)

    try:
        await asyncio.wait_for(connected.wait(), timeout=30)
    except asyncio.TimeoutError:
        logger.warning("Timed out waiting for participant")
    finally:
        ctx.room.off("participant_connected", on_participant_connected)

    return user_id_result[0]


async def _generate_summary(transcript: list[dict]) -> dict:
    """Generate a structured summary from the session transcript."""
    transcript_text = "\n".join(
        f"{'User' if t['role'] == 'user' else 'Agent'}: {t['content']}"
        for t in transcript
    )

    response = await openai_client.chat.completions.create(
        model="gpt-4.1-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SUMMARY_GENERATION_PROMPT},
            {
                "role": "user",
                "content": f"Here is the session transcript:\n\n{transcript_text}",
            },
        ],
    )

    return json.loads(response.choices[0].message.content)


async def _send_session_ending(ctx: agents.JobContext):
    """Send a signal to the frontend to close the session UI."""
    if len(ctx.room.remote_participants) > 0:
        try:
            await ctx.room.local_participant.publish_data(
                json.dumps({"type": "session_ending"}).encode(),
                reliable=True,
            )
            logger.info("Sent session_ending signal to frontend")
        except Exception as e:
            logger.warning(f"Failed to send session_ending: {e}")


async def _session_timer(
    ctx: agents.JobContext,
    session_mgr: SessionManager,
    goodbye_complete: asyncio.Event,
):
    """Background task that manages session timing."""
    while session_mgr.state == "CONVERSATION":
        await asyncio.sleep(5)

        if session_mgr.should_end and session_mgr.state == "CONVERSATION":
            logger.info("Session time limit reached — ending session")
            session_mgr.state = "WRAPPING_UP"
            await _send_session_ending(ctx)
            goodbye_complete.set()
            break


server = AgentServer()


@server.rtc_session()
async def entrypoint(ctx: agents.JobContext):
    await ctx.connect()

    # Extract user ID from participant
    user_id = await _extract_user_id(ctx)
    if not user_id:
        logger.error("Could not determine user ID")
        return

    # Load session history from database
    try:
        session_count = await get_user_session_count(user_id)
        past_reflections = await get_user_reflections(user_id, limit=5)
    except Exception as e:
        logger.warning(f"Could not load session history: {e}")
        session_count = 0
        past_reflections = []

    # Set up session manager and select opening question
    session_mgr = SessionManager()
    opening_question = session_mgr.select_opening_question(
        session_number=session_count + 1,
        past_reflections=past_reflections,
    )

    # Build system prompt with full context
    system_prompt = build_system_prompt(
        session_number=session_count + 1,
        past_reflections=past_reflections,
        opening_question=opening_question,
    )

    # Create agent and session
    agent = ReflectiveJournalAgent(
        instructions=system_prompt,
        session_manager=session_mgr,
        user_id=user_id,
    )

    session = AgentSession(
        llm=openai.realtime.RealtimeModel(
            voice="shimmer",
            model="gpt-realtime-mini",
        )
    )

    # Coordination: tracks when the UI should close and summary should generate
    goodbye_complete = asyncio.Event()

    async def _force_goodbye_and_close():
        """Interrupt any in-flight response, force a goodbye, then close."""
        # 1. Cancel any response the model is already generating (e.g. Q4)
        try:
            await session.interrupt(force=True)
            logger.info("Interrupted in-flight response")
        except Exception as e:
            logger.warning(f"Failed to interrupt: {e}")

        # Brief pause for interruption to fully take effect
        await asyncio.sleep(0.5)

        # 2. Generate the goodbye — now there's nothing in the queue ahead of it
        try:
            await session.generate_reply(
                instructions=(
                    "The session is now over. Do NOT ask another question. "
                    "Briefly thank the user for sharing and tell them you're "
                    "putting together a summary they can review. "
                    "Keep it warm and short — 1 to 2 sentences maximum."
                )
            )
            logger.info("Goodbye generated")
        except Exception as e:
            logger.warning(f"Failed to generate goodbye: {e}")

        # 3. Wait for the goodbye audio to finish playing
        await asyncio.sleep(8)
        await _send_session_ending(ctx)
        goodbye_complete.set()

    # Track transcript via conversation_item_added event
    # (user_speech_committed / agent_speech_committed don't exist in SDK v1.3.x)
    @session.on("conversation_item_added")
    def on_conversation_item(event):
        item = event.item
        if not hasattr(item, "role") or not hasattr(item, "text_content"):
            return

        text = item.text_content or ""
        if not text:
            return

        if item.role == "user":
            # Ignore any speech once the session is no longer in conversation
            if session_mgr.state != "CONVERSATION":
                return

            session_mgr.record_user_turn()
            logger.info(
                f"User speech (turn {session_mgr.user_turns}): {text[:100]}"
            )
            session_mgr.add_transcript_entry("user", text)

            # After the user has answered all questions, force goodbye
            if session_mgr.all_questions_answered:
                logger.info("All questions answered — forcing goodbye")
                session_mgr.state = "WRAPPING_UP"
                asyncio.create_task(_force_goodbye_and_close())

        elif item.role == "assistant":
            logger.info(f"Agent speech: {text[:100]}")
            session_mgr.add_transcript_entry("agent", text)

    await session.start(
        room=ctx.room,
        agent=agent,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=noise_cancellation.BVC(),
            ),
        ),
    )

    # Start session
    session_mgr.start()

    # Generate opening greeting with the specific question
    await session.generate_reply(
        instructions=(
            f"Greet the user warmly and ask this opening question in a "
            f"natural, conversational way (don't read it verbatim): "
            f'"{opening_question}"'
        )
    )

    # Start background timer
    timer_task = asyncio.create_task(
        _session_timer(ctx, session_mgr, goodbye_complete)
    )

    # Wait for session to end (participant disconnects or state changes)
    while session_mgr.state not in ("WRAPPING_UP", "COMPLETE"):
        await asyncio.sleep(2)

        # Check if participant has left
        if len(ctx.room.remote_participants) == 0:
            logger.info("Participant disconnected")
            session_mgr.state = "WRAPPING_UP"
            goodbye_complete.set()
            break

    timer_task.cancel()

    # Wait for agent goodbye + session_ending signal to complete
    if not goodbye_complete.is_set():
        try:
            await asyncio.wait_for(goodbye_complete.wait(), timeout=30)
        except asyncio.TimeoutError:
            logger.warning("Timed out waiting for agent goodbye")
            await _send_session_ending(ctx)
    else:
        # goodbye_complete was already set — give a moment for session_ending to send
        await asyncio.sleep(1)

    # Brief pause for final transcript events to settle
    await asyncio.sleep(2)

    # Fallback: if event-based transcript is empty, build from session history
    if len(session_mgr.transcript) == 0:
        logger.warning("Event-based transcript is empty — falling back to session.history")
        try:
            for item in session.history.items:
                if hasattr(item, "role") and hasattr(item, "text_content"):
                    text = item.text_content or ""
                    if text and item.role in ("user", "assistant"):
                        role = "user" if item.role == "user" else "agent"
                        session_mgr.add_transcript_entry(role, text)
            logger.info(f"Recovered {len(session_mgr.transcript)} entries from session history")
        except Exception as e:
            logger.error(f"Failed to recover transcript from history: {e}")

    # Generate summary
    session_mgr.state = "GENERATING_SUMMARY"
    logger.info(
        f"Generating session summary... "
        f"({len(session_mgr.transcript)} transcript entries)"
    )

    if len(session_mgr.transcript) > 0:
        try:
            summary = await asyncio.wait_for(
                _generate_summary(session_mgr.transcript),
                timeout=30,
            )
            logger.info(f"Summary generated: {list(summary.keys())}")

            # Save to database (frontend polls for this)
            reflection_id = await save_reflection(
                user_id=user_id,
                summary_text=summary.get("summary_text", ""),
                themes=summary.get("themes", []),
                mood=summary.get("mood"),
                actions=summary.get("actions"),
                mirror_reflection=summary.get("mirror_reflection", ""),
                session_length_seconds=session_mgr.elapsed_seconds,
                transcript=session_mgr.transcript,
                tags=summary.get("tags", []),
            )
            logger.info(f"Saved reflection {reflection_id}")

        except asyncio.TimeoutError:
            logger.error("Summary generation timed out after 30s")
        except Exception as e:
            logger.error(f"Error generating/saving summary: {e}")

    session_mgr.state = "COMPLETE"
    logger.info("Session complete")


if __name__ == "__main__":
    agents.cli.run_app(server)
