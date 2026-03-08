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
  const core = require('@actions/core');
  const { getOctokit, context: githubContext } = await import('@actions/github');
  try {
    core.info('Starting AI Changelog Generator job');
    
    const apiKey = core.getInput('api_key', { required: true });
    const token = core.getInput('github_token', { required: true });
    const baseBranch = core.getInput('base_branch') || 'main';
    const style = core.getInput('style') || 'summary';
    const provider = core.getInput('provider') || 'openai';
    const apiBase = core.getInput('api_base_url') || undefined;
    const useCategories = core.getInput('use_categories') === 'true' || false;
    
    let defaultSystemPrompt = "You are a changelog generator. Create a short, informative changelog for the provided git commits. Summarize related changes into single bullet points. Do not include changelog-related changes. Return only the changelog entries as bullet points without any preamble.";
    
    if (useCategories) {
      defaultSystemPrompt = "You are a changelog generator. Create a structured changelog for the provided git commits, organized by category (Features, Bug Fixes, Refactoring, Performance, Documentation, Tests, Dependencies, CI/CD, Other Changes). For each category that has changes, list a ## Category header followed by bullet points. Summarize related changes into single bullet points. Do not include changelog-related changes. Only include categories that have actual changes. Return only the changelog without any preamble.";
    }
    
    const systemPrompt = core.getInput('system_prompt') || defaultSystemPrompt;
    const model = core.getInput('model');
    const useTags = core.getInput('use_tags') === 'true' || false;
    const changelogPath = core.getInput('changelog_path') || 'CHANGELOG.md';
    const maxTokens = parseInt(core.getInput('max_tokens')) || 12000; // Default to 12k tokens
    const maxDiffChars = parseInt(core.getInput('max_diff_chars')) || 5000; // Default to 5k chars per diff;
    const octokit = getOctokit(token);
    const { owner, repo } = githubContext.repo;
    
    const headBranch = 'generate-ai-changelog';
    
    core.info(`Collecting commits from ${baseBranch}..HEAD`);
    
    // Collect commits from git
    const shas = commitProcessor.collectCommitsFromGit(baseBranch, headBranch, changelogPath, useTags);
    
    core.info(`Collected ${shas.length} commits`);
    
    if (shas.length === 0) {
      core.info('No commits found for changelog generation.');
      return;
    }
    
    // Bucket commits by file path
    let commitBuckets = commitProcessor.bucketCommitsByFile(shas, changelogPath, maxDiffChars);
    
    core.info(`Created ${commitBuckets.size} commit buckets`);
    
    // Check if we have any buckets (this could be the source of empty diff bucket issue)
    if (commitBuckets.size === 0) {
      core.warning('No commit buckets created - this may indicate empty diff buckets or all commits filtered out');
      core.info('This could be the source of the AI returning "I need the actual git commits" message');
      return;
    }
    
    // Optionally group commits by category
    if (useCategories) {
      commitBuckets = commitProcessor.groupCommitsByCategory(commitBuckets);
      core.info(`Grouped commits into ${commitBuckets.size} categories`);
    }
    
    // Build prompt from buckets
    const { prompt, totalTokens } = commitProcessor.buildPromptFromCommits(commitBuckets, maxTokens, style);
    
    core.info(`Built prompt with ${totalTokens} estimated tokens`);
    
    if (!prompt.trim()) {
      core.info('No prompt content generated for changelog generation.');
      core.warning('This may indicate empty commit buckets or all commits filtered out');
      return;
    }
    
    let { generateChangelog } = providers[provider] || {};
    if (!generateChangelog) {
      core.warning(`Unknown provider "${provider}", falling back to openai.`);
      ({ generateChangelog } = providers.openai);
    }
    
    core.info(`Calling ${provider} AI provider for changelog generation`);
    
    const changelog = await generateChangelog(prompt, {
      apiKey,
      apiBaseUrl: apiBase,
      systemPrompt,
      model
    });
    
    core.info(`AI provider returned response (length: ${changelog ? changelog.length : 0})`);
    
    if (!changelog) {
      core.error(`Failed to generate changelog for "${provider}".`);
      core.setFailed('Failed to generate changelog.');
      return;
    }
    
    // Check if AI response contains the problematic message
    if (changelog.includes('I need the actual git commits or commit information to generate a changelog')) {
      core.warning('AI response contains the problematic message - this may indicate empty diff buckets');
      core.warning('AI response: ' + changelog.substring(0, 200) + '...');
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
    
    core.info('AI Changelog Generator job completed successfully');
  } catch (err) {
    core.error(err.stack || err.message);
    core.setFailed(err.message);
  }
}

run();
