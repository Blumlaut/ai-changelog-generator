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
    const systemPrompt = core.getInput('system_prompt') || "You are a changelog generator, create a short, bullet-point changelog for the provided information, do not preface your response with anything or comment on the commits, only return the changelogs as a list of items.";
    const model = core.getInput('model');
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    const headBranch = 'generate-ai-changelog';

    // fetch previous changelog branch if it exists
    try {
      execSync(`git fetch origin ${headBranch}`, { stdio: 'ignore' });
    } catch (_) {}

    // determine the base commit for collecting new changes
    let baseCommit = '';
    try {
      baseCommit = execSync(`git rev-parse origin/${headBranch}^`, { encoding: 'utf8' }).trim();
    } catch (_) {
      try {
        baseCommit = execSync('git log -n 1 --pretty=format:%H -- CHANGELOG.md', { encoding: 'utf8' }).trim();
      } catch (_) {
        baseCommit = '';
      }
    }

    const range = baseCommit ? `${baseCommit}..HEAD` : `${baseBranch}..HEAD`;
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

    const date = new Date().toISOString().split('T')[0];
    const entry = `## ${date}\n${changelog}\n`;

    let existing = '';
    try {
      existing = execSync(`git show origin/${headBranch}:CHANGELOG.md`, { encoding: 'utf8' });
    } catch (_) {
      if (fs.existsSync('CHANGELOG.md')) {
        existing = fs.readFileSync('CHANGELOG.md', 'utf8');
      }
    }
    if (!existing.startsWith('# Changelog')) {
      existing = `# Changelog\n\n${existing}`;
    }
    const header = '# Changelog';
    const rest = existing.replace(/^# Changelog\n*/, '');
    const newContent = `${header}\n\n${entry}${rest}`;
    fs.writeFileSync('CHANGELOG.md', newContent);

    execSync('git config user.name "github-actions"');
    execSync('git config user.email "github-actions@users.noreply.github.com"');
    execSync(`git checkout -B ${headBranch}`);
    execSync('git add CHANGELOG.md');
    execSync('git commit -m "chore: update changelog"');
    execSync(`git push --force origin ${headBranch}`);

    const { data: pulls } = await octokit.rest.pulls.list({
      owner,
      repo,
      head: `${owner}:${headBranch}`,
      state: 'open'
    });

    if (pulls.length === 0) {
      await octokit.rest.pulls.create({
        owner,
        repo,
        title: 'chore: update changelog with recent changes',
        head: headBranch,
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
    core.error(err.stack || err.message);
    core.setFailed(err.message);
  }
}

run();
