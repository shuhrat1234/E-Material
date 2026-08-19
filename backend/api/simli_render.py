import asyncio
import logging
import os
import uuid

from django.conf import settings

logger = logging.getLogger(__name__)


class SimliError(Exception):
    pass


async def _render_async(pcm16_audio: bytes, out_path: str):
    # Imported lazily so a missing/broken simli-ai install only breaks the
    # avatar demo endpoint, not the whole app.
    from simli import SimliClient, SimliConfig
    from simli.renderers import FileRenderer

    try:
        async with SimliClient(
            SimliConfig(
                apiKey=settings.SIMLI_API_KEY,
                faceId=settings.SIMLI_FACE_ID,
                maxSessionLength=60,
                maxIdleTime=30,
            )
        ) as connection:
            await connection.send(pcm16_audio)
            await FileRenderer(connection, filename=out_path).render()
    except Exception as e:
        raise SimliError(f'Simli render failed: {e}')


def render_avatar_video(pcm16_audio: bytes) -> str:
    """Sends PCM16 audio through Simli and renders the lip-synced result to
    an MP4 under MEDIA_ROOT. Returns the path relative to MEDIA_ROOT.

    Simli's Python SDK (simli-ai) only exposes the resulting audio/video
    frames to whichever process opened the session — there's no way for a
    separate browser client to "join" that session via a token the way the
    JS SDK's /compose/token flow works. So instead of streaming live to the
    browser over WebRTC, we render the whole clip server-side once and hand
    the frontend a plain video file to play — simpler, and needs no extra
    infra (a live cross-client session would require also running a LiveKit
    room, which isn't in scope here).
    """
    if not settings.SIMLI_API_KEY or not settings.SIMLI_FACE_ID:
        raise SimliError(
            'SIMLI_API_KEY yoki SIMLI_FACE_ID sozlanmagan (backend/.env fayliga qarang)'
        )

    filename = f'avatar_{uuid.uuid4().hex}.mp4'
    out_dir = os.path.join(settings.MEDIA_ROOT, 'avatar_videos')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, filename)

    asyncio.run(_render_async(pcm16_audio, out_path))

    return f'avatar_videos/{filename}'
