
async function generateChangelog(prompt, { apiBaseUrl = 'http://localhost:11434', model = 'llama3', systemPrompt = 'You are a helpful assistant that writes changelog entries.' } = {}) {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/generate`;
  const finalPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: finalPrompt, stream: false })
  });
  const data = await res.json();
  return data.response ? data.response.trim() : '';
}

module.exports = { generateChangelog };
