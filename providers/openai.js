const fetch = require('node-fetch');

async function generateChangelog(prompt, { apiKey, apiBaseUrl = 'https://api.openai.com', model = 'gpt-3.5-turbo' }) {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await res.json();
  return data.choices && data.choices[0] && data.choices[0].message.content.trim();
}

module.exports = { generateChangelog };
