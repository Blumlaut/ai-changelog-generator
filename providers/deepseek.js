const { generateChangelog: openaiGenerateChangelog } = require('./openai');

async function generateChangelog(prompt, opts = {}) {
  if (!opts.apiBaseUrl) {
    opts.apiBaseUrl = 'https://api.deepseek.com';
  }
  if (!opts.model) {
    opts.model = 'deepseek-chat';
  }
  
  core.debug(`Sending Deepseek request with prompt length: ${prompt.length}`);
  
  const result = await openaiGenerateChangelog(prompt, opts);
  
  core.debug(`Deepseek response received (length: ${result ? result.length : 0})`);
  
  return result;
}

module.exports = { generateChangelog };
