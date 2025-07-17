const core = require('@actions/core');
const fetch = global.fetch || ((...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args)));

async function generateChangelog(prompt, { apiBaseUrl = 'http://localhost:11434', model = 'llama3', systemPrompt = 'You are a helpful assistant that writes changelog entries.' } = {}) {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/generate`;
  const finalPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: finalPrompt, stream: false })
    });
    if (!res.ok) {
      const text = await res.text();
      core.error(`Ollama request failed: ${res.status} ${res.statusText}`);
      core.error(text);
      return '';
    }
    const data = await res.json();
    return data.response ? data.response.trim() : '';
  } catch (err) {
    core.error(`Ollama fetch error: ${err.message}`);
    return '';
  }
}

module.exports = { generateChangelog };
