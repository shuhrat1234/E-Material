import json
import requests
from django.conf import settings


class DeepSeekError(Exception):
    pass


def deepseek_chat(messages, json_mode=False, temperature=0.3, timeout=30):
    """Call DeepSeek's OpenAI-compatible chat completions endpoint.

    Requires internet access to api.deepseek.com — raises DeepSeekError on
    any network failure, timeout, or unexpected response shape so callers can
    show a clear "AI unavailable" message instead of crashing.
    """
    url = f"{settings.DEEPSEEK_BASE_URL}/chat/completions"
    headers = {
        'Authorization': f'Bearer {settings.DEEPSEEK_API_KEY}',
        'Content-Type': 'application/json',
    }
    payload = {
        'model': settings.DEEPSEEK_MODEL,
        'messages': messages,
        'temperature': temperature,
    }
    if json_mode:
        payload['response_format'] = {'type': 'json_object'}

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=timeout)
        resp.raise_for_status()
    except requests.RequestException as e:
        raise DeepSeekError(f'DeepSeek request failed: {e}')

    try:
        data = resp.json()
        return data['choices'][0]['message']['content']
    except (ValueError, KeyError, IndexError) as e:
        raise DeepSeekError(f'Unexpected DeepSeek response shape: {e}')


def deepseek_json(messages, temperature=0.3, timeout=30):
    """Like deepseek_chat, but parses the reply as JSON and raises
    DeepSeekError if the model didn't return valid JSON."""
    content = deepseek_chat(messages, json_mode=True, temperature=temperature, timeout=timeout)
    try:
        return json.loads(content)
    except ValueError as e:
        raise DeepSeekError(f'DeepSeek did not return valid JSON: {e}')
