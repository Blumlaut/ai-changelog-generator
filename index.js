const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const apiKey = core.getInput('api_key', { required: true });
    const token = core.getInput('github_token', { required: true });
    const baseBranch = core.getInput('base_branch') || 'main';
    const style = core.getInput('style') || 'summary';
    const provider = core.getInput('provider') || 'openai';
    const apiBase = core.getInput('api_base_url');
    const systemPrompt = core.getInput('system_prompt');
    const model = core.getInput('model');
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    // fetch last commit that touched CHANGELOG.md
    let lastCommit;
    try {
      lastCommit = execSync('git log -n 1 --pretty=format:%H -- CHANGELOG.md', { encoding: 'utf8' }).trim();
    } catch (_) {
      lastCommit = '';
    }

    let range = lastCommit ? `${lastCommit}..HEAD` : `${baseBranch}..HEAD`;
    const commits = execSync(`git log ${range} --pretty=format:%s%n%b`, { encoding: 'utf8' });

    if (!commits.trim()) {
      core.info('No new commits found for changelog generation.');
      return;
    }

    const prompt = `Generate a ${style} changelog entry for the following git commits:\n${commits}`;

    let providerPath;
    try {
      providerPath = path.join(__dirname, 'providers', provider);
      // eslint-disable-next-line import/no-dynamic-require
      var { generateChangelog } = require(providerPath); // dynamic import
    } catch (_) {
      core.warning(`Unknown provider "${provider}", falling back to openai.`);
      providerPath = path.join(__dirname, 'providers', 'openai');
      // eslint-disable-next-line import/no-dynamic-require
      var { generateChangelog } = require(providerPath);
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

    if (!fs.existsSync('CHANGELOG.md')) {
      fs.writeFileSync('CHANGELOG.md', '# Changelog\n\n');
    }
    fs.appendFileSync('CHANGELOG.md', `\n${changelog}\n`);

    execSync('git config user.name "github-actions"');
    execSync('git config user.email "github-actions@users.noreply.github.com"');
    execSync('git checkout -B generate-ai-changelog');
    execSync('git add CHANGELOG.md');
    execSync('git commit -m "chore: update changelog"');
    execSync('git push --force origin generate-ai-changelog');

    const { data: pulls } = await octokit.rest.pulls.list({
      owner,
      repo,
      head: `generate-ai-changelog`,
      state: 'open'
    });

    if (pulls.length === 0) {
      await octokit.rest.pulls.create({
        owner,
        repo,
        title: 'chore: update changelog with recent changes',
        head: 'generate-ai-changelog',
        base: baseBranch,
        body: 'Automated changelog update.'
      });
    } else {
      await octokit.rest.pulls.update({
        owner,
        repo,
        pull_number: pulls[0].number,
        body: 'Automated changelog update.'
      });
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
