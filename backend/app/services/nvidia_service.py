"""
Service for interacting with NVIDIA NIM (build.nvidia.com / integrate.api.nvidia.com).

NVIDIA NIM exposes an OpenAI-compatible REST surface, so this mirrors
``groq_service`` closely. The key difference is first-class support for modern
*reasoning* models (Nemotron, DeepSeek-R1, QwQ, gpt-oss): when the API returns a
separate ``reasoning_content`` field we fold it into the message content as a
``<think>...</think>`` block (see ``reasoning.fold_reasoning_into_content``) so the
rest of the application stays provider-agnostic.

Configuration (backend/.env):
    NVIDIA_API_KEY   - required for live calls (get one at build.nvidia.com)
    NVIDIA_BASE_URL  - optional, defaults to the public NIM gateway

Never hardcode the key here. ``run.py`` reloads the environment on every start.
"""

import os
import json
import requests
from flask import current_app
from sqlalchemy.exc import SQLAlchemyError

from ..models import db, Message
from .reasoning import fold_reasoning_into_content, split_reasoning

# Public NVIDIA NIM gateway (OpenAI-compatible). Override per-deployment via env.
DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1"

# Seed catalog used ONLY as a fallback when the live /v1/models call is
# unavailable (no key, offline, gateway error). The live endpoint is the source
# of truth and overrides this list. Edit freely - these are defaults, not facts.
# ``reasoning`` flags drive the UI hint and sensible default sampling.
NVIDIA_SEED_MODELS = [
    {"id": "nvidia/nemotron-3-ultra-550b-a55b",          "reasoning": True},
    {"id": "nvidia/llama-3.3-nemotron-super-49b-v1",      "reasoning": True},
    {"id": "deepseek-ai/deepseek-r1",                     "reasoning": True},
    {"id": "qwen/qwq-32b",                                "reasoning": True},
    {"id": "openai/gpt-oss-120b",                         "reasoning": True},
    {"id": "meta/llama-3.3-70b-instruct",                 "reasoning": False},
    {"id": "meta/llama-3.1-8b-instruct",                  "reasoning": False},
    {"id": "mistralai/mistral-small-24b-instruct",        "reasoning": False},
]

# Models whose ids match any of these fragments are treated as reasoning models
# for UI hinting / default sampling even when discovered live.
_REASONING_FRAGMENTS = ("nemotron", "deepseek-r1", "qwq", "gpt-oss", "reason", "-r1")


def _base_url():
    return os.getenv("NVIDIA_BASE_URL", DEFAULT_BASE_URL).rstrip("/")


def _api_key():
    return os.getenv("NVIDIA_API_KEY")


def _headers(api_key):
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def is_reasoning_model(model_id):
    """Heuristic: does this model id look like a reasoning model?"""
    low = (model_id or "").lower()
    return any(fragment in low for fragment in _REASONING_FRAGMENTS)


def get_available_models():
    """Return a flat list of NVIDIA model ids.

    Tries the live OpenAI-compatible ``/v1/models`` endpoint first; falls back to
    the seed catalog when the key is missing or the call fails. Always returns a
    non-empty list so the UI has something selectable.
    """
    api_key = _api_key()
    seed_ids = [m["id"] for m in NVIDIA_SEED_MODELS]

    if not api_key:
        # No key configured - offer the seed catalog so the UI still works.
        return seed_ids

    try:
        response = requests.get(f"{_base_url()}/models", headers=_headers(api_key), timeout=10)
        if response.status_code == 200:
            data = response.json()
            live_ids = [m.get("id") for m in data.get("data", []) if m.get("id")]
            if live_ids:
                return sorted(live_ids)
        else:
            current_app.logger.warning(
                f"NVIDIA /models returned status {response.status_code}; using seed catalog"
            )
    except Exception as e:  # network, JSON, timeout - degrade gracefully
        current_app.logger.warning(f"Could not fetch NVIDIA models live: {str(e)}; using seed catalog")

    return seed_ids


def get_model_metadata():
    """Return ``{model_id: {"reasoning": bool}}`` for the available models.

    Used by the frontend to show the reasoning hint and pick default sampling.
    """
    return {model_id: {"reasoning": is_reasoning_model(model_id)} for model_id in get_available_models()}


def _build_payload(model, messages, temperature, max_tokens):
    """Construct an OpenAI-compatible chat payload for NIM."""
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    # Reasoning models behave best with a slightly higher top_p; harmless for others.
    if is_reasoning_model(model):
        payload["top_p"] = 0.95
    return payload


def _extract_message(result):
    """Pull ``(content, reasoning)`` out of an OpenAI-compatible response."""
    choices = result.get("choices") or []
    if not choices:
        return None, None
    message = choices[0].get("message") or {}
    content = message.get("content", "")
    # NIM reasoning models expose the trace here; OpenAI clients call it the same.
    reasoning = message.get("reasoning_content") or message.get("reasoning")
    return content, reasoning


def chat(data):
    """Direct passthrough chat with the NVIDIA NIM API (OpenAI shape in/out)."""
    api_key = _api_key()
    if not api_key:
        current_app.logger.error("NVIDIA_API_KEY not found in environment variables")
        return {"error": "NVIDIA_API_KEY not found in environment variables"}

    url = f"{_base_url()}/chat/completions"
    try:
        current_app.logger.info("Sending direct chat request to NVIDIA NIM")
        response = requests.post(url, headers=_headers(api_key), json=data, timeout=120)
        current_app.logger.info(f"NVIDIA NIM direct chat status: {response.status_code}")
        return response.json()
    except Exception as e:
        current_app.logger.error(f"Error chatting with NVIDIA NIM: {str(e)}")
        return {"error": str(e)}


def handle_chat(model, messages, temperature, max_tokens, node_id, conversation_id):
    """Handle a node chat with the NVIDIA backend (non-streaming).

    Returns an OpenAI-compatible dict. Any reasoning trace is folded into
    ``choices[0].message.content`` as a ``<think>`` block so the frontend renders
    it with the same collapsible UI used for every provider.
    """
    api_key = _api_key()
    if not api_key:
        error_msg = "NVIDIA_API_KEY not found in environment variables"
        current_app.logger.error(error_msg)
        return {"error": error_msg}

    url = f"{_base_url()}/chat/completions"
    payload = _build_payload(model, messages, temperature, max_tokens)

    try:
        current_app.logger.info(f"Sending request to NVIDIA NIM (model={model}, msgs={len(messages)})")
        response = requests.post(url, headers=_headers(api_key), json=payload, timeout=120)
        current_app.logger.info(f"NVIDIA NIM response status: {response.status_code}")

        try:
            result = response.json()
        except json.JSONDecodeError as json_err:
            error_msg = f"Invalid JSON response from NVIDIA NIM: {str(json_err)}"
            current_app.logger.error(error_msg)
            current_app.logger.error(f"Response preview: {response.text[:200]}...")
            return {"error": error_msg}

        if isinstance(result, dict) and result.get("error"):
            err = result["error"]
            error_msg = err.get("message", str(err)) if isinstance(err, dict) else str(err)
            current_app.logger.error(f"NVIDIA NIM error: {error_msg}")
            return {"error": error_msg}

        content, reasoning = _extract_message(result)
        if content is not None:
            folded = fold_reasoning_into_content(content, reasoning)
            # Rewrite the response so downstream consumers see the folded content.
            result["choices"][0]["message"]["content"] = folded

            # Persist the clean answer (no trace) to the conversation.
            if conversation_id:
                try:
                    assistant_message = Message(
                        conversation_id=conversation_id,
                        role="assistant",
                        content=folded,
                    )
                    db.session.add(assistant_message)
                    db.session.commit()
                except SQLAlchemyError as e:
                    current_app.logger.error(f"DB error storing assistant message: {str(e)}")

        return result
    except Exception as e:
        error_msg = str(e)
        current_app.logger.error(f"Error with NVIDIA NIM request: {error_msg}")
        return {"error": error_msg}


def process_node(node, parent_contexts, conversation_history, conversation):
    """Process a workflow node with the NVIDIA backend. Returns a string answer."""
    api_key = _api_key()
    if not api_key:
        return "Error: NVIDIA_API_KEY not found in environment variables"

    context_block = "".join(
        f"Context from parent node {ctx['node_id']}: {ctx['last_response']}\n\n"
        for ctx in parent_contexts
    )
    messages = [
        {"role": "system", "content": (node.system_message or "") + "\n\n" + context_block},
        *conversation_history,
    ]
    payload = _build_payload(node.model, messages, node.temperature, node.max_tokens)
    url = f"{_base_url()}/chat/completions"

    try:
        current_app.logger.info(f"Processing NVIDIA node {node.id} (model={node.model})")
        response = requests.post(url, headers=_headers(api_key), json=payload, timeout=120)

        if response.status_code != 200:
            current_app.logger.error(f"NVIDIA NIM returned status {response.status_code}")
            return f"Error: NVIDIA NIM returned status code {response.status_code}"

        result = response.json()
        if isinstance(result, dict) and result.get("error"):
            err = result["error"]
            error_msg = err.get("message", str(err)) if isinstance(err, dict) else str(err)
            return f"Error: {error_msg}"

        content, reasoning = _extract_message(result)
        if content is None:
            return "Error: Invalid response format from NVIDIA NIM"

        folded = fold_reasoning_into_content(content, reasoning)

        if conversation:
            message = Message(conversation_id=conversation.id, role="assistant", content=folded)
            db.session.add(message)
            db.session.commit()

        return folded
    except Exception as e:
        current_app.logger.error(f"Error processing NVIDIA node: {str(e)}")
        return f"Error: {str(e)}"
