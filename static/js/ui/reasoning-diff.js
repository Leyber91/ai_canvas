/**
 * ui/reasoning-diff.js
 *
 * Reasoning-diff view: fan ONE prompt across several reasoning models and render
 * their normalized chain-of-thought traces side-by-side. The whole point of
 * ai_canvas, distilled to one screen — reasoning made legible and comparable.
 *
 * Reuses the reasoning normalizer verbatim (splitReasoning / renderAssistantContent),
 * so a trace from Nemotron (reasoning_content), DeepSeek-R1 (inline <think>), or a
 * plain model all render through the same path. No new parsing.
 */

import { splitReasoning, renderAssistantContent, escapeHtml } from './reasoning.js';

const PROVIDER_LABEL = { ollama: 'Ollama', groq: 'Groq', nvidia: 'NVIDIA NIM' };

// Minimal markdown, matching the app's fallback formatter.
function fmt(s) {
  return String(s == null ? '' : s)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

function wordCount(s) {
  return s ? s.split(/\s+/).filter(Boolean).length : 0;
}

/**
 * Render an array of comparison results into `container` as side-by-side columns.
 *
 * @param {HTMLElement} container - grid container
 * @param {Array<{backend,model,content,latency_ms,error}>} results
 */
export function renderComparison(container, results) {
  container.innerHTML = '';
  if (!results || results.length === 0) {
    container.innerHTML = '<p class="rd-empty">No results yet. Pick models and Compare.</p>';
    return;
  }

  for (const r of results) {
    const col = document.createElement('div');
    col.className = 'rd-col';

    const provider = PROVIDER_LABEL[r.backend] || r.backend || 'model';
    const { reasoning } = splitReasoning(r.content || '');
    const hasTrace = !!reasoning;

    const metaBits = [];
    if (r.error) metaBits.push('<span class="rd-tag rd-tag-err">error</span>');
    if (typeof r.latency_ms === 'number') metaBits.push(`${r.latency_ms} ms`);
    metaBits.push(hasTrace ? `${wordCount(reasoning)} reasoning words` : 'no trace');

    const head = document.createElement('div');
    head.className = 'rd-col-head';
    head.innerHTML =
      `<span class="provider-chip" data-provider="${escapeHtml(r.backend)}">${escapeHtml(provider)}</span>` +
      `<span class="rd-model" title="${escapeHtml(r.model)}">${escapeHtml(r.model)}</span>`;

    const meta = document.createElement('div');
    meta.className = 'rd-meta';
    meta.innerHTML = metaBits.join(' · ');

    const body = document.createElement('div');
    body.className = 'rd-body';
    if (r.error) {
      body.innerHTML = `<div class="rd-error">${escapeHtml(r.error)}</div>`;
    } else {
      // open:true so the trace shows by default — comparison is the point.
      body.innerHTML = renderAssistantContent(r.content || '', fmt, { open: true });
    }

    col.append(head, meta, body);
    container.appendChild(col);
  }
}

/**
 * Call the stateless compare endpoint.
 *
 * @param {{prompt,system,models,temperature,maxTokens}} opts
 * @returns {Promise<Array>} results
 */
export async function runComparison({ prompt, system, models, temperature = 0.6, maxTokens = 1024 }) {
  const resp = await fetch('/api/chat/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      system_message: system,
      models,
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => resp.statusText);
    throw new Error(`compare failed (${resp.status}): ${detail}`);
  }
  const data = await resp.json();
  return data.results || [];
}
