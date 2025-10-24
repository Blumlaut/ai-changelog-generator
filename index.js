const core = require('@actions/core');
const github = require('@actions/github');
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ignore = require('ignore');

const providers = {
  openai: require('./providers/openai'),
  deepseek: require('./providers/deepseek'),
  anthropic: require('./providers/anthropic'),
  ollama: require('./providers/ollama')
};

// Import refactored functions
const commitProcessor = require('./src/commitProcessor');
const changelogHandler = require('./src/changelogHandler');

async function run() {
  try {
    const apiKey = core.getInput('api_key', { required: true });
    const token = core.getInput('github_token', { required: true });
    const baseBranch = core.getInput('base_branch') || 'main';
    const style = core.getInput('style') || 'summary';
    const provider = core.getInput('provider') || 'openai';
    const apiBase = core.getInput('api_base_url') || undefined;
    const systemPrompt = core.getInput('system_prompt') || "You are a changelog generator, create a short, informative, bullet-point changelog for the provided information. For each file path or component that was modified, summarize all commits affecting that path/component into a single high-level bullet point. Do not preface your response with anything or comment on the commits, only return the changelogs as a list of items. Do not include changes which mention the changelogs. If one commit modifies multiple files, keep the summary of the change to one bullet point. When multiple commits affect the same file, consolidate them into a single bullet point that captures the overall change for that file.";
    const model = core.getInput('model');
    const useTags = core.getInput('use_tags') === 'true' || false;
    const changelogPath = core.getInput('changelog_path') || 'CHANGELOG.md';
    const maxTokens = parseInt(core.getInput('max_tokens')) || 12000; // Default to 12k tokens
    const maxDiffChars = parseInt(core.getInput('max_diff_chars')) || 5000; // Default to 5k chars per diff
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;
    
    const headBranch = 'generate-ai-changelog';
    
    // Collect commits from git
    const shas = commitProcessor.collectCommitsFromGit(baseBranch, headBranch, changelogPath, useTags);
    
    // Bucket commits by file path
    const commitBuckets = commitProcessor.bucketCommitsByFile(shas, changelogPath, maxDiffChars);
    
    // Build prompt from buckets
    const { prompt, totalTokens } = commitProcessor.buildPromptFromCommits(commitBuckets, maxTokens, style);
    
    if (!prompt.trim()) {
      core.info('No new commits found for changelog generation.');
      return;
    }
    
    let { generateChangelog } = providers[provider] || {};
    if (!generateChangelog) {
      core.warning(`Unknown provider "${provider}", falling back to openai.`);
      ({ generateChangelog } = providers.openai);
    }
    const changelog = await generateChangelog(prompt, {
      apiKey,
      apiBaseUrl: apiBase,
      systemPrompt,
      model
    });
    if (!changelog) {
      core.error(`Failed to generate changelog for "${provider}".`);
      core.setFailed('Failed to generate changelog.');
      return;
    }
    
    // Generate header
    const header = changelogHandler.generateChangelogHeader(useTags);
    const entry = `${changelog}\n`;
    
    // Read existing changelog
    const existing = changelogHandler.readExistingChangelog(headBranch, changelogPath);
    
    // Update changelog content
    const newContent = changelogHandler.updateChangelogContent(existing, header, entry, changelogPath);
    
    // Write updated changelog
    changelogHandler.writeChangelog(changelogPath, newContent);
    
    // Handle git operations
    changelogHandler.handleGitOperations(headBranch, changelogPath);
    
    // Create or update pull request
    await changelogHandler.createOrUpdatePullRequest(
      octokit,
      owner,
      repo,
      headBranch,
      baseBranch,
      'chore: update changelog with recent changes',
      'Automated changelog update.'
    );
  } catch (err) {
    core.error(err.stack || err.message);
    core.setFailed(err.message);
  }
}

run();
