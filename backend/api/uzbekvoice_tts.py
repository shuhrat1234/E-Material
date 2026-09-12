import io
import json
import logging
import ssl
import urllib.request
import uuid
import wave
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)

VOICELAB_API_URL = 'https://api.voicelab.uz/v1/tts'
LEGACY_UZBEKVOICE_API_URL = 'https://uzbekvoice.ai/api/v1/tts'

# Friendly voice mappings on VoiceLab
VOICELAB_VOICES = {
    'abdulhay': 'voice_M-p5iz9z_kPWNm_C0cFqbC6X',  # Abdulhay Otaxo'jayev (Peter Parker dubbing actor, authoritative officer tone)
    'jasur': 'voice_M-p5iz9z_kPWNm_C0cFqbC6X',     # Alias legacy jasur -> abdulhay
    'shohruxmirzo': 'voice_jABVrmH-0x6pbYefNCuYfH6H',
    'sardor': 'voice_xdQMoRJkjHbPIB-jounXzKq8',
    'firdavs': 'voice_OBuMpAaB5iYCUZS0eCc9Fj3k',
    'xurshid': 'voice_2QZX3LFMkNO0lNyrOZ-WwJxK',
    'gulnoza': 'voice_01J9NEUTRAL0000000000000001',
    'lola': 'voice_EvIb9vE6iY_dWgK7OobYdZcX',
}

DEFAULT_VOICE_ID = 'voice_M-p5iz9z_kPWNm_C0cFqbC6X'


class UzbekVoiceTtsError(Exception):
    pass


def resolve_voice_id(model_or_voice: str = None) -> str:
    """Resolves voice name or ID to a valid VoiceLab voice ID."""
    if not model_or_voice:
        return getattr(settings, 'VOICELAB_VOICE_ID', DEFAULT_VOICE_ID)
    
    val = str(model_or_voice).strip()
    if val.startswith('voice_'):
        return val
    
    return VOICELAB_VOICES.get(val.lower(), getattr(settings, 'VOICELAB_VOICE_ID', DEFAULT_VOICE_ID))


def synthesize_voicelab_wav(text: str, voice_id: str = None, language: str = 'uz', speed: float = 1.0) -> bytes:
    """Synthesizes text via VoiceLab API and returns raw WAV bytes."""
    text = (text or '').strip()
    if not text:
        raise UzbekVoiceTtsError('Matn kiritilmadi (Empty text)')

    api_key = (
        getattr(settings, 'VOICELAB_API_KEY', '') or
        getattr(settings, 'UZBEKVOICE_API_KEY', '') or
        'vlk_6sXr0AWv47hCAeI_cb1-k1SdN9sp4ohxqVVT9We33FQ'
    ).strip()

    if not api_key:
        raise UzbekVoiceTtsError('VOICELAB_API_KEY sozlanmagan')

    target_voice = resolve_voice_id(voice_id)

    payload = json.dumps({
        'text': text,
        'voice_id': target_voice,
        'language': language,
        'speed': speed,
    }).encode('utf-8')

    req = urllib.request.Request(
        VOICELAB_API_URL,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Idempotency-Key': str(uuid.uuid4()),
            'User-Agent': 'E-Material/1.0',
        },
        data=payload,
        method='POST',
    )

    try:
        ctx = ssl.create_default_context()
        resp = urllib.request.urlopen(req, timeout=30, context=ctx)
    except Exception:
        ctx = ssl._create_unverified_context()
        try:
            resp = urllib.request.urlopen(req, timeout=30, context=ctx)
        except Exception as e:
            err_body = ''
            if hasattr(e, 'read'):
                try:
                    err_body = e.read().decode('utf-8')
                except Exception:
                    pass
            logger.error('VoiceLab TTS API error: %s - %s', e, err_body)
            raise UzbekVoiceTtsError(f"VoiceLab API xatosi: {e} {err_body}")

    with resp as r:
        content_type = r.headers.get('Content-Type', '')
        data = r.read()

    if 'application/json' in content_type:
        try:
            err_json = json.loads(data.decode('utf-8'))
            raise UzbekVoiceTtsError(f"VoiceLab xatosi: {err_json.get('message')}")
        except Exception:
            pass

    return data


def synthesize_uzbekvoice_audio_url(text: str, model: str = None) -> str:
    """
    Synthesizes speech using VoiceLab (or fallback UzbekVoice) and saves the WAV
    file to media/tts/<uuid>.wav, returning the public audio URL.
    """
    text = (text or '').strip()
    if not text:
        raise UzbekVoiceTtsError('Matn kiritilmadi (Empty text)')

    # Synthesize WAV bytes
    wav_bytes = synthesize_voicelab_wav(text, voice_id=model)

    # Save to media/tts directory
    media_root = Path(settings.MEDIA_ROOT)
    tts_dir = media_root / 'tts'
    tts_dir.mkdir(parents=True, exist_ok=True)

    filename = f'{uuid.uuid4().hex}.wav'
    file_path = tts_dir / filename
    file_path.write_bytes(wav_bytes)

    public_base = getattr(settings, 'PUBLIC_BASE_URL', 'https://tqtb-olmazor.uz').rstrip('/')
    return f'{public_base}/media/tts/{filename}'


def synthesize_pcm16(text: str, target_rate: int = 16000, model: str = None) -> bytes:
    """Synthesizes text using VoiceLab and returns raw PCM16 bytes."""
    wav_bytes = synthesize_voicelab_wav(text, voice_id=model)

    try:
        with wave.open(io.BytesIO(wav_bytes), 'rb') as wf:
            pcm16 = wf.readframes(wf.getnframes())
            return pcm16
    except Exception as e:
        logger.error('Failed to parse WAV from VoiceLab: %s', e)
        raise UzbekVoiceTtsError(f"WAV formatini o'qishda xatolik: {e}")


def ensure_precomputed_file(key_name: str, text: str, voice_id: str = None) -> str:
    """Ensures that a precomputed WAV file exists on disk, synthesizes if missing, and returns its public URL."""
    media_root = Path(settings.MEDIA_ROOT)
    tts_dir = media_root / 'tts'
    tts_dir.mkdir(parents=True, exist_ok=True)

    file_path = tts_dir / f'precomputed_{key_name}.wav'
    if not file_path.exists() or file_path.stat().st_size == 0:
        try:
            wav_bytes = synthesize_voicelab_wav(text, voice_id=voice_id)
            file_path.write_bytes(wav_bytes)
            logger.info('Precomputed TTS generated for %s', key_name)
        except Exception as e:
            logger.error('Failed to precompute TTS for %s: %s', key_name, e)

    public_base = getattr(settings, 'PUBLIC_BASE_URL', 'https://tqtb-olmazor.uz').rstrip('/')
    return f'{public_base}/media/tts/precomputed_{key_name}.wav'

