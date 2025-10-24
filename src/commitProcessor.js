const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const ignore = require('ignore');

// Simple token counting function (approximates tokens as 4 chars per token for ASCII text)
function countTokens(text) {
  if (!text) return 0;
  // This is a rough approximation - in practice, you might want to use a proper tokenizer
  // For now, we'll estimate based on character count
  return Math.ceil(text.length / 4);
}

/**
 * Collects commits from git history
 * @param {string} baseBranch - The base branch to compare against
 * @param {string} headBranch - The head branch to compare against
 * @param {string} changelogPath - Path to the changelog file
 * @param {boolean} useTags - Whether to use git tags as reference
 * @returns {Array} Array of commit objects
 */
function collectCommitsFromGit(baseBranch, headBranch, changelogPath, useTags) {
  try {
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
        console.warn('No tags found, using default commit tracking');
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
    
    return shas;
  } catch (error) {
    console.error('Error collecting commits:', error);
    throw error;
  }
}

/**
 * Gets file changes for a specific commit
 * @param {string} sha - Git commit SHA
 * @returns {Array} Array of file paths
 */
function getFilesForCommit(sha) {
  try {
    const files = execSync(`git show --pretty="" --name-only ${sha}`, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
    return files;
  } catch (error) {
    console.error(`Error getting files for commit ${sha}:`, error);
    throw error;
  }
}

/**
 * Gets commit message for a specific commit
 * @param {string} sha - Git commit SHA
 * @returns {string} Commit message
 */
function getCommitMessage(sha) {
  try {
    const message = execSync(`git show -s --format=%s%n%b ${sha}`, { encoding: 'utf8' });
    return message;
  } catch (error) {
    console.error(`Error getting message for commit ${sha}:`, error);
    throw error;
  }
}

/**
 * Gets diff for a specific commit and files
 * @param {string} sha - Git commit SHA
 * @param {Array} files - Array of file paths
 * @returns {string} Diff content
 */
function getCommitDiff(sha, files) {
  try {
    // Use spawnSync with separate arguments for safety (avoiding shell injection)
    const gitArgs = ['show', sha, '--patch', '--no-color', '--no-prefix', '--', ...files];
    const diffResult = spawnSync('git', gitArgs, { encoding: 'utf8' });
    let diff = diffResult.stdout;
    if (!diff.trim()) {
      return '';
    }
    return diff;
  } catch (error) {
    console.error(`Error getting diff for commit ${sha}:`, error);
    throw error;
  }
}

/**
 * Normalizes file path for consistent bucketing
 * @param {string} filePath - Original file path
 * @returns {string} Normalized file path
 */
function normalizeFilePath(filePath) {
  // Remove leading dots and slashes
  return filePath.replace(/^\.?\//, '');
}

/**
 * Buckets commits by file path
 * @param {Array} commits - Array of commit objects
 * @param {string} changelogPath - Path to the changelog file
 * @param {number} maxDiffChars - Maximum characters per diff
 * @returns {Map} Map of file paths to commit arrays
 */
function bucketCommitsByFile(commits, changelogPath, maxDiffChars) {
  const commitBuckets = new Map();
  const ig = ignore();
  
  if (fs.existsSync('.gitignore')) {
    ig.add(fs.readFileSync('.gitignore', 'utf8'));
  }
  ig.add(['dist/', 'bin/']);
  
  console.info(`Starting bucketing process for ${commits.length} commits`);
  
  for (const sha of commits) {
    const files = getFilesForCommit(sha);
    const relevant = files.filter(f => !ig.ignores(f));
    
    if (relevant.length === 0 || relevant.every(f => f === changelogPath)) {
      console.debug(`Skipping commit ${sha} - no relevant files or only changelog file`);
      continue;
    }
    
    const message = getCommitMessage(sha);
    const diff = getCommitDiff(sha, relevant);
    
    // Truncate diff if it's too large
    let truncatedDiff = diff;
    if (diff && diff.length > maxDiffChars) {
      truncatedDiff = diff.substring(0, maxDiffChars) + '\n... (diff truncated due to size limit)';
      console.info(`Diff for commit ${sha} truncated from ${diff.length} to ${maxDiffChars} characters`);
    }
    
    // Bucket commits by normalized file path - group all commits affecting the same file
    for (const file of relevant) {
      const normalizedPath = normalizeFilePath(file);
      if (!commitBuckets.has(normalizedPath)) {
        commitBuckets.set(normalizedPath, []);
      }
      commitBuckets.get(normalizedPath).push({
        sha,
        message,
        diff: truncatedDiff
      });
    }
  }
  
  console.info(`Completed bucketing: ${commitBuckets.size} buckets created from ${commits.length} commits`);
  return commitBuckets;
}

/**
 * Builds prompt from commit buckets with token awareness
 * @param {Map} commitBuckets - Map of file paths to commit arrays
 * @param {number} maxTokens - Maximum tokens allowed
 * @param {string} style - Changelog style
 * @returns {Object} Object containing prompt text and token count
 */
function buildPromptFromCommits(commitBuckets, maxTokens, style) {
  let commits = '';
  let totalTokens = 0;
  
  console.info(`Building prompt from ${commitBuckets.size} commit buckets`);
  
  // Process each file's commits with token awareness
  for (const [path, bucketCommits] of commitBuckets) {
    console.debug(`Processing bucket for path: ${path} with ${bucketCommits.length} commits`);
    
    // Process commits in batches to stay within token limits
    // We'll use a more conservative approach: if a single commit is larger than maxTokens, we'll still include it
    // but warn about it. If multiple commits are too large, we'll split them appropriately.
    
    // First, let's check if we have a very large commit that might cause issues
    let currentBatch = [];
    let batchTokens = 0;
    
    for (const commit of bucketCommits) {
      // Estimate tokens for this commit
      const commitText = `Files: ${path}\nCommit ${commit.sha}\n${commit.message}\n${commit.diff}\n\n`;
      const commitTokens = countTokens(commitText);
      
      // If adding this commit would exceed token limits, we need to handle it carefully
      if (commitTokens > maxTokens) {
        // If a single commit exceeds the limit, we still include it but warn
        console.warn(`Commit ${commit.sha} exceeds token limit (${commitTokens} tokens). Including anyway.`);
        commits += `Files: ${path}\nCommit ${commit.sha}\n${commit.message}\n${commit.diff}\n\n`;
        totalTokens += commitTokens;
      } else if (batchTokens + commitTokens > maxTokens && currentBatch.length > 0) {
        // Add the current batch to the prompt
        for (const batchCommit of currentBatch) {
          commits += `Files: ${path}\n`;
          commits += `Commit ${batchCommit.sha}\n${batchCommit.message}\n${batchCommit.diff}\n\n`;
          totalTokens += countTokens(`Files: ${path}\nCommit ${batchCommit.sha}\n${batchCommit.message}\n${batchCommit.diff}\n\n`);
        }
        // Start new batch with current commit
        currentBatch = [commit];
        batchTokens = commitTokens;
      } else {
        // Add to current batch
        currentBatch.push(commit);
        batchTokens += commitTokens;
      }
    }
    
    // Add the final batch for this file
    for (const batchCommit of currentBatch) {
      commits += `Files: ${path}\n`;
      commits += `Commit ${batchCommit.sha}\n${batchCommit.message}\n${batchCommit.diff}\n\n`;
      totalTokens += countTokens(`Files: ${path}\nCommit ${batchCommit.sha}\n${batchCommit.message}\n${batchCommit.diff}\n\n`);
    }
  }
  
  console.info(`Total estimated tokens in prompt: ${totalTokens}`);
  
  // If we're still over the limit, we need to handle this gracefully
  if (totalTokens > maxTokens) {
    console.warn(`Prompt exceeds token limit (${maxTokens}). This may cause issues with some providers.`);
  }
  
  const prompt = `Generate a ${style} changelog entry for the following git commits:\n${commits}`;
  
  // Add a warning if prompt is very large
  if (totalTokens > maxTokens * 0.9) { // Warn if we're at 90% of limit
    console.warn(`Prompt is approaching token limit (${totalTokens}/${maxTokens}). Consider reducing max_diff_chars or using a provider with higher limits.`);
  }
  
  // Additional check for empty prompt
  if (commits.trim() === '') {
    console.warn('Built prompt is empty - this may indicate all commits were filtered out or had no content');
  }
  
  return { prompt, totalTokens };
}

module.exports = {
  collectCommitsFromGit,
  bucketCommitsByFile,
  normalizeFilePath,
  buildPromptFromCommits,
  countTokens
};
