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
    const systemPrompt = core.getInput('system_prompt') || "You are a changelog generator, create a short, informative, bullet-point changelog for the provided information, do not preface your response with anything or comment on the commits, only return the changelogs as a list of items. Do not include changes which mention the changelogs.";
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
      baseCommit = execSync(`git rev-parse origin/${headBranch}`, { encoding: 'utf8' }).trim();
    } catch (_) {
      try {
        baseCommit = execSync('git log -n 1 --pretty=format:%H -- CHANGELOG.md', { encoding: 'utf8' }).trim();
      } catch (_) {
        baseCommit = '';
      }
    }

    const range = baseCommit ? `${baseCommit}..HEAD` : `${baseBranch}..HEAD`;
    const shas = execSync(`git rev-list ${range}`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)
      .reverse();

    let commits = '';
    for (const sha of shas) {
      const files = execSync(`git show --pretty="" --name-only ${sha}`, { encoding: 'utf8' })
        .trim()
        .split('\n');
      if (files.includes('CHANGELOG.md')) {
        continue;
      }
      const message = execSync(`git show -s --format=%s%n%b ${sha}`, { encoding: 'utf8' });
      const diff = execSync(`git show ${sha} --patch --no-color --no-prefix`, { encoding: 'utf8' });
      commits += `Commit ${sha}\n${message}\n${diff}\n`;
    }

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
    const dateHeader = `## ${date}`;
    const entry = `${changelog}\n`;

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
    let rest = existing.replace(/^# Changelog\n*/, '');

    if (rest.startsWith(`${dateHeader}\n`)) {
      const lines = rest.split('\n');
      let i = 1;
      while (i < lines.length && !lines[i].startsWith('## ')) {
        i++;
      }
      const current = lines.slice(0, i).join('\n');
      const remainder = lines.slice(i).join('\n');
      rest = `${current}\n${entry}${remainder}`.replace(/\n+$/, '\n');
    } else {
      rest = `${dateHeader}\n${entry}${rest}`;
    }

    const newContent = `${header}\n\n${rest}`;
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
