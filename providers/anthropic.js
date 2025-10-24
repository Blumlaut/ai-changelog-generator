const core = require('@actions/core');
const fetch = global.fetch || (async (...args) =>
  (await import('node-fetch')).default(...args));

async function generateChangelog(prompt, { apiKey, apiBaseUrl = 'https://api.anthropic.com', model = 'claude-3-sonnet-20240229', systemPrompt = 'You are a helpful assistant that writes changelog entries.' } = {}) {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/v1/messages`;
  
  core.debug(`Sending Anthropic request with prompt length: ${prompt.length}`);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!res.ok) {
      const text = await res.text();
      core.error(`Anthropic request failed: ${res.status} ${res.statusText}`);
      core.error(text);
      return '';
    }
    const data = await res.json();
    const response = data.content && data.content.length ? data.content[0].text.trim() : '';
    
    core.debug(`Anthropic response received (length: ${response ? response.length : 0})`);
    
    if (response) {
      core.debug(`Anthropic response preview: ${response.substring(0, 200)}...`);
    }
    
    return response;
  } catch (err) {
    core.error(`Anthropic fetch error: ${err.message}`);
    return '';
  }
}

module.exports = { generateChangelog };
