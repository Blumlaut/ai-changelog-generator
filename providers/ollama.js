const core = require('@actions/core');
const fetch = global.fetch || (async (...args) =>
  (await import('node-fetch')).default(...args));

async function generateChangelog(prompt, { apiBaseUrl = 'http://localhost:11434', model = 'llama3', systemPrompt = 'You are a helpful assistant that writes changelog entries.' } = {}) {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/generate`;
  const finalPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  
  core.debug(`Sending Ollama request with prompt length: ${finalPrompt.length}`);
  
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
    const response = data.response ? data.response.trim() : '';
    
    core.debug(`Ollama response received (length: ${response ? response.length : 0})`);
    
    if (response) {
      core.debug(`Ollama response preview: ${response.substring(0, 200)}...`);
    }
    
    return response;
  } catch (err) {
    core.error(`Ollama fetch error: ${err.message}`);
    return '';
  }
}

module.exports = { generateChangelog };
