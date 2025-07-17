const { generateChangelog: openaiGenerateChangelog } = require('./openai');

async function generateChangelog(prompt, opts = {}) {
  if (!opts.apiBaseUrl) {
    opts.apiBaseUrl = 'https://api.deepseek.com/v1';
  }
  return openaiGenerateChangelog(prompt, opts);
}

module.exports = { generateChangelog };
