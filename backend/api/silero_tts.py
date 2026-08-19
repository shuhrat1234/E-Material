import audioop
import logging
import threading

import numpy as np
import torch

logger = logging.getLogger(__name__)

# v4_uz is the only Silero TTS package for Uzbek with a single speaker
# ('dilnavoz'); it natively accepts both Cyrillic and Latin Uzbek script,
# so the DeepSeek answer text can be fed to it as-is, no transliteration.
SILERO_LANGUAGE = 'uz'
SILERO_MODEL_ID = 'v4_uz'
SILERO_SPEAKER = 'dilnavoz'
SILERO_SAMPLE_RATE = 24000  # one of 8000/24000/48000 supported by v4_uz

_model = None
_model_lock = threading.Lock()
_device = torch.device('cpu')


class TtsError(Exception):
    pass


def _load_model():
    global _model
    if _model is not None:
        return _model
    with _model_lock:
        if _model is None:
            logger.warning(
                "Loading Silero TTS model (%s/%s) — first run downloads it "
                "(~50-100MB) and caches it under ~/.cache/torch/hub, this can "
                "take a minute.", SILERO_LANGUAGE, SILERO_MODEL_ID,
            )
            try:
                model, _example_text = torch.hub.load(
                    repo_or_dir='snakers4/silero-models',
                    model='silero_tts',
                    language=SILERO_LANGUAGE,
                    speaker=SILERO_MODEL_ID,
                    trust_repo=True,
                )
            except Exception as e:
                raise TtsError(f'Failed to load Silero TTS model: {e}')
            model.to(_device)
            _model = model
            logger.warning("Silero TTS model loaded.")
    return _model


def preload():
    """Warms the model up front so the first real request isn't slow.
    Safe to call from a background thread; failures are logged, not raised,
    since the endpoint will retry (and surface the real error) on demand."""
    try:
        _load_model()
    except TtsError as e:
        logger.error("Silero TTS preload failed: %s", e)


def synthesize_pcm16(text, target_rate=16000):
    """Renders Uzbek `text` to speech and returns raw mono PCM16 bytes
    resampled to `target_rate` (16kHz, what Simli's audio input expects)."""
    text = (text or '').strip()
    if not text:
        raise TtsError('Empty text')

    model = _load_model()
    try:
        audio = model.apply_tts(text=text, speaker=SILERO_SPEAKER, sample_rate=SILERO_SAMPLE_RATE)
    except Exception as e:
        raise TtsError(f'Silero synthesis failed: {e}')

    samples = audio.detach().cpu().numpy() if hasattr(audio, 'detach') else np.asarray(audio)
    pcm16 = (np.clip(samples, -1.0, 1.0) * 32767).astype(np.int16).tobytes()

    if SILERO_SAMPLE_RATE != target_rate:
        pcm16, _ = audioop.ratecv(pcm16, 2, 1, SILERO_SAMPLE_RATE, target_rate, None)

    return pcm16
