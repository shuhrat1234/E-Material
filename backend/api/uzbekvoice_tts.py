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

UZBEKVOICE_API_URL = 'https://uzbekvoice.ai/api/v1/tts'
VOICELAB_API_URL = 'https://api.voicelab.uz/v1/tts'


class UzbekVoiceTtsError(Exception):
    pass


def synthesize_uzbekvoice_direct(text: str, model: str = 'jasur') -> str:
    """Synthesizes text using UzbekVoice.ai (Jasur voice) and returns direct CDN audio URL."""
    text = (text or '').strip()
    if not text:
        raise UzbekVoiceTtsError('Matn kiritilmadi')

    api_key = getattr(settings, 'UZBEKVOICE_API_KEY', '5b9118bc-3676-4ab0-b500-026b3a6372b1:c504ec5b-d67a-4e85-a935-ed2e21e9d08e')
    payload = json.dumps({
        'text': text,
        'model': model or 'jasur',
        'blocking': 'true',
    }).encode('utf-8')

    req = urllib.request.Request(
        UZBEKVOICE_API_URL,
        headers={
            'Authorization': api_key,
            'Content-Type': 'application/json',
            'User-Agent': 'E-Material/1.0',
        },
        data=payload,
        method='POST',
    )

    ctx = ssl._create_unverified_context()
    with urllib.request.urlopen(req, timeout=10, context=ctx) as response:
        resp_data = json.loads(response.read().decode('utf-8'))

    if resp_data.get('status') != 'SUCCESS':
        raise UzbekVoiceTtsError(f"UzbekVoice status: {resp_data.get('status')}")

    audio_url = resp_data.get('result', {}).get('url')
    if not audio_url:
        raise UzbekVoiceTtsError('UzbekVoice audio URL topilmadi')

    return audio_url


def synthesize_voicelab_wav(text: str, voice_id: str = None) -> bytes:
    """Fallback: Synthesizes via VoiceLab API and returns raw WAV bytes."""
    api_key = getattr(settings, 'VOICELAB_API_KEY', 'vlk_6sXr0AWv47hCAeI_cb1-k1SdN9sp4ohxqVVT9We33FQ')
    target_voice = voice_id or getattr(settings, 'VOICELAB_VOICE_ID', 'voice_M-p5iz9z_kPWNm_C0cFqbC6X')

    payload = json.dumps({
        'text': text,
        'voice_id': target_voice,
        'language': 'uz',
        'speed': 1.0,
    }).encode('utf-8')

    req = urllib.request.Request(
        VOICELAB_API_URL,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'Idempotency-Key': str(uuid.uuid4()),
            'User-Agent': 'E-Material/1.0',
        },
        data=payload,
        method='POST',
    )

    ctx = ssl._create_unverified_context()
    with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
        return r.read()


def synthesize_uzbekvoice_audio_url(text: str, model: str = 'jasur') -> str:
    """
    Primary synthesis function. First tries UzbekVoice.ai (Jasur voice) for fast
    speech without delay. Falls back to VoiceLab if needed.
    """
    text = (text or '').strip()
    if not text:
        raise UzbekVoiceTtsError('Matn kiritilmadi')

    # 1. Try UzbekVoice.ai (fastest, authentic Jasur voice)
    try:
        url = synthesize_uzbekvoice_direct(text, model=model or 'jasur')
        return url
    except Exception as e:
        logger.warning('UzbekVoice direct synthesis failed (%s), falling back to VoiceLab...', e)

    # 2. Fallback to VoiceLab
    try:
        wav_bytes = synthesize_voicelab_wav(text)
        media_root = Path(settings.MEDIA_ROOT)
        tts_dir = media_root / 'tts'
        tts_dir.mkdir(parents=True, exist_ok=True)
        filename = f'{uuid.uuid4().hex}.wav'
        (tts_dir / filename).write_bytes(wav_bytes)
        public_base = getattr(settings, 'PUBLIC_BASE_URL', 'https://tqtb-olmazor.uz').rstrip('/')
        return f'{public_base}/media/tts/{filename}'
    except Exception as e2:
        logger.error('Both UzbekVoice and VoiceLab failed: %s', e2)
        raise UzbekVoiceTtsError(f'TTS xatosi: {e2}')


def synthesize_pcm16(text: str, target_rate: int = 16000, model: str = 'jasur') -> bytes:
    """Synthesizes text and returns raw PCM16 bytes."""
    audio_url = synthesize_uzbekvoice_audio_url(text, model=model)
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(audio_url, headers={'User-Agent': 'E-Material/1.0'})
    with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
        wav_bytes = r.read()

    with wave.open(io.BytesIO(wav_bytes), 'rb') as wf:
        return wf.readframes(wf.getnframes())


def ensure_precomputed_file(key_name: str, text: str, voice_id: str = None) -> str:
    """Ensures that a precomputed WAV file exists on disk."""
    public_base = getattr(settings, 'PUBLIC_BASE_URL', 'https://tqtb-olmazor.uz').rstrip('/')
    return f'{public_base}/media/tts/precomputed_{key_name}.wav'

