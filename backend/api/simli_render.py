import asyncio
import logging
import os
import time
import uuid

from django.conf import settings

logger = logging.getLogger(__name__)

# Each answer renders a new mp4 under MEDIA_ROOT/avatar_videos and nothing
# ever deletes them on its own — on a live demo that gets used repeatedly
# this would quietly fill the disk. Sweep out anything older than this on
# every render instead of needing a separate cron job.
_MAX_VIDEO_AGE_SECONDS = 30 * 60


class SimliError(Exception):
    pass


def _cleanup_old_videos(out_dir: str):
    cutoff = time.time() - _MAX_VIDEO_AGE_SECONDS
    try:
        for name in os.listdir(out_dir):
            path = os.path.join(out_dir, name)
            try:
                if os.path.isfile(path) and os.path.getmtime(path) < cutoff:
                    os.remove(path)
            except OSError:
                pass  # another request may be reading/writing it right now
    except OSError:
        pass


# Simli renders at a fixed 512x512 — there's no resolution/quality knob on
# SimliConfig, and its own h264 encode uses whatever ffmpeg's defaults are
# (no explicit bitrate/CRF), which looks soft/blocky once displayed at the
# much larger size the kiosk card uses. _finalize_video re-encodes once
# with a real CRF, upscales with Lanczos resampling, and unsharp-masks each
# frame — still bounded by the 512x512 source detail (no amount of this
# invents pixels Simli never sent), but visibly cleaner than a raw browser
# upscale of the compressed original. Tried Simli's `artalk` model as an
# alternative to `fasttalk` hoping for a sharper source — visually
# identical, not worth the switch.
_OUTPUT_SIZE = 768
_VIDEO_CRF = '16'  # x264: lower = higher quality; 16 is visually lossless
_VIDEO_PRESET = 'slow'  # slower = better quality per bit at the same CRF
_SHARPEN = {'radius': 1.5, 'percent': 180, 'threshold': 1}  # PIL UnsharpMask


def _finalize_video(path: str):
    """Re-encodes `path` in place: upscales video (Lanczos + unsharp mask)
    to _OUTPUT_SIZE, re-encodes h264 at _VIDEO_CRF, and writes `moov` up
    front (movflags=faststart) so browsers can start playing progressively
    — FileRenderer writes it at the end by default, which silently
    prevents the video track from ever rendering in a browser (audio still
    played, since it's buffered separately, which is what made this so
    confusing to spot)."""
    import av
    from PIL import Image, ImageFilter

    tmp_path = path + '.final.mp4'
    in_container = av.open(path)
    out_container = av.open(tmp_path, 'w', format='mp4', options={'movflags': 'faststart'})
    try:
        # A plain int rate (not the source's raw fractional average_rate,
        # e.g. 1770/71) — Simli's odd native frame rate combined with a
        # custom CRF/preset made libx264 reject the encoded packets
        # (mux() raised EINVAL) until this was pinned to a clean value.
        out_video = out_container.add_stream('h264', rate=25)
        out_video.width = _OUTPUT_SIZE
        out_video.height = _OUTPUT_SIZE
        out_video.pix_fmt = 'yuv420p'
        out_video.options = {'crf': _VIDEO_CRF, 'preset': _VIDEO_PRESET}

        out_audio = None
        if in_container.streams.audio:
            in_audio = in_container.streams.audio[0]
            out_audio = out_container.add_stream('aac', rate=in_audio.sample_rate)

        for frame in in_container.decode(video=0, audio=0 if out_audio else None):
            if isinstance(frame, av.VideoFrame):
                # PIL's resize + UnsharpMask visibly outperforms av's own
                # Lanczos reformat() alone — plain upscale still looks soft.
                # Frames built via from_image() carry no pts of their own,
                # which is fine here: encode() just assigns them in call
                # order, same as any from-scratch encode.
                img = frame.to_image().resize((_OUTPUT_SIZE, _OUTPUT_SIZE), Image.LANCZOS)
                img = img.filter(ImageFilter.UnsharpMask(**_SHARPEN))
                for packet in out_video.encode(av.VideoFrame.from_image(img)):
                    out_container.mux(packet)
            elif out_audio is not None:
                for packet in out_audio.encode(frame):
                    out_container.mux(packet)
        for packet in out_video.encode():
            out_container.mux(packet)
        if out_audio is not None:
            for packet in out_audio.encode():
                out_container.mux(packet)
    finally:
        out_container.close()
        in_container.close()

    os.replace(tmp_path, path)


async def _render_async(pcm16_audio: bytes, out_path: str):
    # Imported lazily so a missing/broken simli-ai install only breaks the
    # avatar demo endpoint, not the whole app.
    from simli import SimliClient, SimliConfig
    # The installed simli-ai package doesn't re-export from
    # simli.renderers.__init__ (unlike the README example) — import the
    # submodule directly.
    from simli.renderers.renderers import FileRenderer

    try:
        async with SimliClient(
            api_key=settings.SIMLI_API_KEY,
            config=SimliConfig(
                faceId=settings.SIMLI_FACE_ID,
                maxSessionLength=60,
                # Simli keeps rendering idle avatar footage for this long
                # after the audio ends before closing the session — a low
                # value keeps the output clip close to the actual answer
                # length instead of padding it with dead air.
                maxIdleTime=3,
            ),
        ) as connection:
            await connection.send(pcm16_audio)
            # FileRenderer defaults to a "vorbis" audio codec, which this
            # ffmpeg build refuses as experimental; aac is standard, always
            # available, and the natural choice for an mp4 container anyway.
            await FileRenderer(connection, filename=out_path, audioCodec='aac').render()
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

    _cleanup_old_videos(out_dir)
    asyncio.run(_render_async(pcm16_audio, out_path))
    _finalize_video(out_path)

    return f'avatar_videos/{filename}'
