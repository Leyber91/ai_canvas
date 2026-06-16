"""
Shared reasoning utilities.

Modern reasoning models (NVIDIA Nemotron, DeepSeek-R1, QwQ, gpt-oss, ...) emit a
private chain-of-thought separately from the final answer. Two conventions exist
in the wild:

1. OpenAI-compatible providers (NVIDIA NIM, some Groq routes) return the trace in
   ``choices[0].message.reasoning_content`` (or ``delta.reasoning_content`` while
   streaming), keeping ``content`` clean.
2. Distilled open models (DeepSeek-R1 on Groq/Ollama) inline the trace inside the
   answer wrapped in ``<think> ... </think>`` tags.

To keep the rest of the app provider-agnostic we normalise both into a single
``<think>...</think>`` envelope at the front of the message content. The frontend
then has exactly one shape to parse and render as a collapsible trace.
"""

import re

THINK_OPEN = "<think>"
THINK_CLOSE = "</think>"

_THINK_RE = re.compile(r"<think>(.*?)</think>", re.DOTALL | re.IGNORECASE)


def fold_reasoning_into_content(content, reasoning):
    """Prepend a ``reasoning_content`` trace into ``content`` as a <think> block.

    If ``content`` already contains an inline <think> block (distilled models),
    ``content`` is returned untouched so we never double-wrap.

    Args:
        content: The final answer text from the model (may be empty/None).
        reasoning: The separate reasoning trace, or None/empty if absent.

    Returns:
        A single string. When a trace is present it is emitted as
        ``<think>trace</think>answer``; otherwise the original answer.
    """
    content = content or ""

    # Already inlined by the model - leave as-is.
    if THINK_OPEN in content.lower():
        return content

    reasoning = (reasoning or "").strip()
    if not reasoning:
        return content

    return f"{THINK_OPEN}{reasoning}{THINK_CLOSE}{content}"


def split_reasoning(content):
    """Inverse of :func:`fold_reasoning_into_content`.

    Returns a ``(reasoning, answer)`` tuple. ``reasoning`` is ``None`` when the
    content carries no trace. Useful for storage/logging on the backend.
    """
    content = content or ""
    match = _THINK_RE.search(content)
    if not match:
        return None, content

    reasoning = match.group(1).strip()
    answer = _THINK_RE.sub("", content, count=1).strip()
    return reasoning, answer
