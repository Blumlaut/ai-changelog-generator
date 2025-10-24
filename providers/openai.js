const core = require('@actions/core');
const fetch = global.fetch || (async (...args) =>
  (await import('node-fetch')).default(...args));

async function generateChangelog(prompt, { apiKey, apiBaseUrl = 'https://api.openai.com', model = 'gpt-3.5-turbo', systemPrompt = 'You are a helpful assistant that writes changelog entries.' } = {}) {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });
  
  core.debug(`Sending AI request with prompt length: ${prompt.length}`);
  
  try {
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
    
    if (!res.ok) {
      const text = await res.text();
      core.error(`OpenAI request failed: ${res.status} ${res.statusText}`);
      core.error(text);
      return '';
    }
    
    const data = await res.json();
    const response = data.choices && data.choices[0] && data.choices[0].message.content.trim();
    
    core.debug(`AI response received (length: ${response ? response.length : 0})`);
    
    if (response) {
      core.debug(`AI response preview: ${response.substring(0, 200)}...`);
    }
    
    return response;
  } catch (err) {
    core.error(`OpenAI fetch error: ${err.message}`);
    return '';
  }
}

module.exports = { generateChangelog };
