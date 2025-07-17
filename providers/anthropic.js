const core = require('@actions/core');
const fetch = global.fetch || ((...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args)));

async function generateChangelog(prompt, { apiKey, apiBaseUrl = 'https://api.anthropic.com', model = 'claude-3-sonnet-20240229', systemPrompt = 'You are a helpful assistant that writes changelog entries.' } = {}) {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/v1/messages`;
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
    if (data.content && data.content.length) {
      return data.content[0].text.trim();
    }
    return '';
  } catch (err) {
    core.error(`Anthropic fetch error: ${err.message}`);
    return '';
  }
}

module.exports = { generateChangelog };
