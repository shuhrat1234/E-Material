import io
import json
import logging
import ssl
import urllib.request
import wave
from django.conf import settings

logger = logging.getLogger(__name__)

UZBEKVOICE_API_URL = 'https://uzbekvoice.ai/api/v1/tts'


class UzbekVoiceTtsError(Exception):
    pass


def synthesize_uzbekvoice_audio_url(text: str, model: str = None) -> str:
    """Sends text to UzbekVoice.ai TTS API and returns the generated WAV audio URL."""
    text = (text or '').strip()
    if not text:
        raise UzbekVoiceTtsError('Matn kiritilmadi (Empty text)')

    api_key = getattr(settings, 'UZBEKVOICE_API_KEY', '') or '5b9118bc-3676-4ab0-b500-026b3a6372b1:c504ec5b-d67a-4e85-a935-ed2e21e9d08e'
    if not api_key:
        raise UzbekVoiceTtsError('UZBEKVOICE_API_KEY sozlanmagan')

    selected_model = model or getattr(settings, 'UZBEKVOICE_MODEL', 'jasur')

    payload = json.dumps({
        'text': text,
        'model': selected_model,
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

    try:
        try:
            ctx = ssl.create_default_context()
            resp = urllib.request.urlopen(req, timeout=30, context=ctx)
        except Exception:
            ctx = ssl._create_unverified_context()
            resp = urllib.request.urlopen(req, timeout=30, context=ctx)
        with resp as response:
            resp_data = json.loads(response.read().decode('utf-8'))
    except Exception as e:
        logger.error('UzbekVoice TTS API call failed: %s', e)
        raise UzbekVoiceTtsError(f"UzbekVoice API so'rovi xatosi: {e}")

    status = resp_data.get('status')
    if status != 'SUCCESS':
        raise UzbekVoiceTtsError(f'UzbekVoice kutilmagan status: {status}')

    audio_url = resp_data.get('result', {}).get('url')
    if not audio_url:
        raise UzbekVoiceTtsError('UzbekVoice natijasida audio URL topilmadi')

    return audio_url


def synthesize_pcm16(text: str, target_rate: int = 16000, model: str = None) -> bytes:
    """Synthesizes text using UzbekVoice.ai (Jasur voice) and returns raw PCM16 bytes."""
    audio_url = synthesize_uzbekvoice_audio_url(text, model=model)

    try:
        try:
            ctx = ssl.create_default_context()
            resp = urllib.request.urlopen(audio_url, timeout=30, context=ctx)
        except Exception:
            ctx = ssl._create_unverified_context()
            resp = urllib.request.urlopen(audio_url, timeout=30, context=ctx)
        with resp as r:
            wav_bytes = r.read()
    except Exception as e:
        logger.error('Failed to download audio from UzbekVoice CDN: %s', e)
        raise UzbekVoiceTtsError(f"UzbekVoice audio faylini yuklab olishda xatolik: {e}")

    try:
        with wave.open(io.BytesIO(wav_bytes), 'rb') as wf:
            pcm16 = wf.readframes(wf.getnframes())
            return pcm16
    except Exception as e:
        logger.error('Failed to parse WAV from UzbekVoice: %s', e)
        raise UzbekVoiceTtsError(f"WAV formatini o'qishda xatolik: {e}")
