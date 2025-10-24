const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Generates a header for the changelog entry
 * @param {boolean} useTags - Whether to use git tags as reference
 * @returns {string} Header string
 */
function generateChangelogHeader(useTags) {
  if (useTags) {
    try {
      const latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
      return `## ${latestTag}`;
    } catch {
      return `## ${new Date().toISOString().split('T')[0]}`;
    }
  } else {
    return `## ${new Date().toISOString().split('T')[0]}`;
  }
}

/**
 * Reads existing changelog content
 * @param {string} headBranch - The branch name to check
 * @param {string} changelogPath - Path to the changelog file
 * @returns {string} Existing changelog content
 */
function readExistingChangelog(headBranch, changelogPath) {
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
  
  return existing;
}

/**
 * Updates changelog content with new entry
 * @param {string} existing - Existing changelog content
 * @param {string} header - Header for the new entry
 * @param {string} entry - New changelog entry
 * @param {string} changelogPath - Path to the changelog file
 * @returns {string} Updated changelog content
 */
function updateChangelogContent(existing, header, entry, changelogPath) {
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
  
  return `${mainHeader}\n\n${rest}`;
}

/**
 * Writes updated changelog to file
 * @param {string} changelogPath - Path to the changelog file
 * @param {string} content - Content to write
 */
function writeChangelog(changelogPath, content) {
  fs.writeFileSync(changelogPath, content);
}

/**
 * Creates or updates a pull request with the changelog changes
 * @param {object} octokit - Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} headBranch - Branch name
 * @param {string} baseBranch - Base branch name
 * @param {string} title - Pull request title
 * @param {string} body - Pull request body
 */
async function createOrUpdatePullRequest(octokit, owner, repo, headBranch, baseBranch, title, body) {
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
      title,
      head: headBranch,
      base: baseBranch,
      body
    });
  } else {
    await octokit.rest.pulls.update({
      owner,
      repo,
      pull_number: pulls[0].number,
      body
    });
  }
}

/**
 * Handles git operations for pushing changelog changes
 * @param {string} headBranch - Branch name
 * @param {string} changelogPath - Path to the changelog file
 */
function handleGitOperations(headBranch, changelogPath) {
  execSync('git config user.name "github-actions"');
  execSync('git config user.email "github-actions@users.noreply.github.com"');
  execSync(`git checkout -B ${headBranch}`);
  execSync(`git add ${changelogPath}`);
  execSync('git commit -m "chore: update changelog"');
  execSync(`git push --force origin ${headBranch}`);
}

module.exports = {
  generateChangelogHeader,
  readExistingChangelog,
  updateChangelogContent,
  writeChangelog,
  createOrUpdatePullRequest,
  handleGitOperations
};
