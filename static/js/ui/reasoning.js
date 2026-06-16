/**
 * ui/reasoning.js
 *
 * Provider-agnostic reasoning-trace parsing and rendering.
 *
 * Modern reasoning models (NVIDIA Nemotron, DeepSeek-R1, QwQ, gpt-oss, ...) emit
 * a private chain-of-thought separately from the final answer. The backend
 * normalises every provider into a single `<think> ... </think>` envelope at the
 * front of the message content (see backend/app/services/reasoning.py), so the
 * UI only has one shape to handle here.
 *
 * This module has no dependencies so it can be imported by the live SPA and by
 * standalone verification harnesses alike.
 */

const THINK_RE = /<think>([\s\S]*?)<\/think>/i;
// Streaming may deliver an opening <think> before its closing tag arrives.
const OPEN_THINK_RE = /<think>([\s\S]*)$/i;

/**
 * Split message content into its reasoning trace and final answer.
 *
 * @param {string} content - Raw message content (possibly with a <think> block).
 * @returns {{ reasoning: string|null, answer: string }}
 */
export function splitReasoning(content) {
  const text = content == null ? '' : String(content);

  const closed = text.match(THINK_RE);
  if (closed) {
    const reasoning = closed[1].trim();
    const answer = text.replace(THINK_RE, '').trim();
    return { reasoning: reasoning || null, answer };
  }

  // Unbalanced opening tag (e.g. mid-stream): treat the remainder as reasoning.
  const open = text.match(OPEN_THINK_RE);
  if (open) {
    const before = text.slice(0, open.index).trim();
    return { reasoning: open[1].trim() || null, answer: before };
  }

  return { reasoning: null, answer: text };
}

/** Escape untrusted text for safe insertion into HTML. */
export function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Build the HTML for a collapsible reasoning trace.
 *
 * @param {string} reasoning - The reasoning text (already separated from the answer).
 * @param {Object} [opts]
 * @param {boolean} [opts.open=false] - Whether the trace starts expanded.
 * @returns {string} HTML string for a <details> reasoning block.
 */
export function renderReasoningTrace(reasoning, opts = {}) {
  if (!reasoning) return '';
  const open = opts.open ? ' open' : '';
  // Token count is a cheap, useful signal of how much the model "thought".
  const words = reasoning.split(/\s+/).filter(Boolean).length;
  return (
    `<details class="reasoning-block"${open}>` +
      `<summary class="reasoning-summary">` +
        `<span class="reasoning-spark" aria-hidden="true"></span>` +
        `<span class="reasoning-label">Reasoning</span>` +
        `<span class="reasoning-meta">${words} words</span>` +
      `</summary>` +
      `<div class="reasoning-body">${escapeHtml(reasoning)}</div>` +
    `</details>`
  );
}

/**
 * Build the full inner HTML for an assistant message: an optional reasoning
 * trace followed by the formatted answer.
 *
 * @param {string} content - Raw assistant content (may contain a <think> block).
 * @param {(answer: string) => string} formatAnswer - Formats the answer body
 *        (markdown -> HTML). Caller supplies its existing formatter.
 * @param {Object} [opts] - Passed through to renderReasoningTrace.
 * @returns {string} HTML string.
 */
export function renderAssistantContent(content, formatAnswer, opts = {}) {
  const { reasoning, answer } = splitReasoning(content);
  const trace = renderReasoningTrace(reasoning, opts);
  const body = typeof formatAnswer === 'function' ? formatAnswer(answer) : escapeHtml(answer);
  return trace + `<div class="answer-body">${body}</div>`;
}
