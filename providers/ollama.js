const fetch = require('node-fetch');

async function generateChangelog(prompt, { apiBaseUrl = 'http://localhost:11434', model = 'llama3' }) {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/generate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false })
  });
  const data = await res.json();
  return data.response ? data.response.trim() : '';
}

module.exports = { generateChangelog };
