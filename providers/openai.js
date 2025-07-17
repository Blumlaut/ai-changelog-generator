
async function generateChangelog(prompt, { apiKey, apiBaseUrl = 'https://api.openai.com', model = 'gpt-3.5-turbo', systemPrompt = 'You are a helpful assistant that writes changelog entries.' } = {}) {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages
    })
  });
  const data = await res.json();
  return data.choices && data.choices[0] && data.choices[0].message.content.trim();
}

module.exports = { generateChangelog };
