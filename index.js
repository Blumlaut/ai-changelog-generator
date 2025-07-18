const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ignore = require('ignore');

const providers = {
  openai: require('./providers/openai'),
  deepseek: require('./providers/deepseek'),
  anthropic: require('./providers/anthropic'),
  ollama: require('./providers/ollama')
};

async function run() {
  try {
    const apiKey = core.getInput('api_key', { required: true });
    const token = core.getInput('github_token', { required: true });
    const baseBranch = core.getInput('base_branch') || 'main';
    const style = core.getInput('style') || 'summary';
    const provider = core.getInput('provider') || 'openai';
    const apiBase = core.getInput('api_base_url') || undefined;
    const systemPrompt = core.getInput('system_prompt') || "You are a changelog generator, create a short, informative, bullet-point changelog for the provided information, do not preface your response with anything or comment on the commits, only return the changelogs as a list of items. Do not include changes which mention the changelogs. If one commit modifies multiple files, keep the summary of the change to one bullet point.";
    const model = core.getInput('model');
    const useTags = core.getInput('use_tags') === 'true' || false;
    const changelogPath = core.getInput('changelog_path') || 'CHANGELOG.md';
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;
    
    const ig = ignore();
    if (fs.existsSync('.gitignore')) {
      ig.add(fs.readFileSync('.gitignore', 'utf8'));
    }
    ig.add(['dist/', 'bin/']);
    
    const headBranch = 'generate-ai-changelog';
    
    // fetch previous changelog branch if it exists
    try {
      execSync(`git fetch origin ${headBranch}`, { stdio: 'ignore' });
    } catch (_) {}
    
    // determine the base commit for collecting new changes
    let baseCommit = '';
    // if using tags as a reference, fetch it first
    if (useTags) {
      try {
        const latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
        baseCommit = execSync(`git rev-list -n 1 ${latestTag}`, { encoding: 'utf8' }).trim();
      } catch (err) {
        core.warning('No tags found, using default commit tracking');
      }
    } else {
      try {
        baseCommit = execSync(`git rev-parse origin/${headBranch}`, { encoding: 'utf8' }).trim();
      } catch (_) {
        try {
          baseCommit = execSync(`git log -n 1 --pretty=format:%H -- ${changelogPath}`, { encoding: 'utf8' }).trim();
        } catch (_) {
          baseCommit = '';
        }
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
      .split('\n')
      .filter(Boolean);
      const relevant = files.filter(f => !ig.ignores(f));
      if (relevant.length === 0 || relevant.every(f => f === changelogPath)) {
        continue;
      }
      const message = execSync(`git show -s --format=%s%n%b ${sha}`, { encoding: 'utf8' });
      const diff = execSync(`git show ${sha} --patch --no-color --no-prefix -- ${relevant.join(' ')}`, { encoding: 'utf8' });
      if (!diff.trim()) {
        continue;
      }
      commits += `Commit ${sha}\n${message}\n${diff}\n`;
    }
    
    if (!commits.trim()) {
      core.info('No new commits found for changelog generation.');
      return;
    }
    
    const prompt = `Generate a ${style} changelog entry for the following git commits:\n${commits}`;
    
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
    
    let header;
    if (useTags) {
      try {
        const latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
        header = `## ${latestTag}`;
      } catch {
        header = `## ${new Date().toISOString().split('T')[0]}`;
      }
    } else {
      header = `## ${new Date().toISOString().split('T')[0]}`;
    }
    const entry = `${changelog}\n`;
    
    let existing = '';
    try {
      existing = execSync(`git show origin/${headBranch}:${changelogPath}`, { encoding: 'utf8' });
    } catch (_) {
      if (fs.existsSync(changelogPath)) {
        existing = fs.readFileSync(changelogPath, 'utf8');
      }
    }
    
    if (!existing.startsWith('# Changelog')) {
      existing = `# Changelog\n\n${existing}`;
    }
    const mainHeader = '# Changelog';
    let rest = existing.replace(/^# Changelog\n*/, '');
    
    if (rest.startsWith(`${header}\n`)) {
      const lines = rest.split('\n');
      let i = 1;
      while (i < lines.length && !lines[i].startsWith('## ')) {
        i++;
      }
      const current = lines.slice(0, i).join('\n');
      const remainder = lines.slice(i).join('\n');
      rest = `${current}\n${entry}${remainder}`.replace(/\n+$/, '\n');
    } else {
      rest = `${header}\n${entry}${rest}`;
    }
    
    const newContent = `${mainHeader}\n\n${rest}`;
    fs.writeFileSync(changelogPath, newContent);
    
    execSync('git config user.name "github-actions"');
    execSync('git config user.email "github-actions@users.noreply.github.com"');
    execSync(`git checkout -B ${headBranch}`);
    execSync(`git add ${changelogPath}`);
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