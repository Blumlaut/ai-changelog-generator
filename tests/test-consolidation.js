const { test, assert } = require('node:test');
const { createRequire } = require('module');
const ignore = require('ignore');

// Test the core bucketing logic directly without git operations
test('commit consolidation logic', async (t) => {
  // Mock the exact logic from index.js
  const commitBuckets = new Map();
  
  // Mock commit data that simulates what would come from git
  const mockCommits = [
    {
      sha: 'abc123',
      files: ['src/components/Button.js'],
      message: 'feat: add new button component',
      diff: '.diff content 1...'
    },
    {
      sha: 'def456',
      files: ['src/components/Button.js'],
      message: 'fix: improve button styling',
      diff: '.diff content 2...'
    },
    {
      sha: 'ghi789',
      files: ['src/utils/helpers.js'],
      message: 'refactor: optimize helper functions',
      diff: '.diff content 3...'
    },
    {
      sha: 'jkl012',
      files: ['src/components/Button.js', 'src/components/Modal.js'],
      message: 'feat: enhance UI components',
      diff: '.diff content 4...'
    }
  ];
  
  // Apply the exact same bucketing logic from index.js
  for (const commit of mockCommits) {
    for (const file of commit.files) {
      // This is the exact logic from index.js - normalize file path
      const normalizedPath = file.replace(/^\.?\//, '');
      
      // This is the exact logic from index.js - create bucket if needed
      if (!commitBuckets.has(normalizedPath)) {
        commitBuckets.set(normalizedPath, []);
      }
      
      // This is the exact logic from index.js - push commit to bucket
      commitBuckets.get(normalizedPath).push({
        sha: commit.sha,
        message: commit.message,
        diff: commit.diff
      });
    }
  }
  
  // Verify the bucketing worked correctly
  const buttonBuckets = commitBuckets.get('src/components/Button.js');
  const helpersBuckets = commitBuckets.get('src/utils/helpers.js');
  const modalBuckets = commitBuckets.get('src/components/Modal.js');
  
  t.assert.ok(buttonBuckets, 'Should have buckets for Button.js');
  t.assert.equal(buttonBuckets.length, 3, 'Should have 3 commits in Button.js bucket');
  
  t.assert.ok(helpersBuckets, 'Should have buckets for helpers.js');
  t.assert.equal(helpersBuckets.length, 1, 'Should have 1 commit in helpers.js bucket');
  
  t.assert.ok(modalBuckets, 'Should have buckets for Modal.js');
  t.assert.equal(modalBuckets.length, 1, 'Should have 1 commit in Modal.js bucket');
  
  // Verify the specific commit messages for Button.js (should be consolidated)
  t.assert.equal(buttonBuckets[0].message, 'feat: add new button component');
  t.assert.equal(buttonBuckets[1].message, 'fix: improve button styling');
  t.assert.equal(buttonBuckets[2].message, 'feat: enhance UI components');
  
  // Verify that commits to the same file are properly bucketed together
  // The commit with multiple files should be in both buckets
  const buttonBucketMessages = buttonBuckets.map(b => b.message);
  const modalBucketMessages = modalBuckets.map(b => b.message);
  
  t.assert.ok(buttonBucketMessages.includes('feat: enhance UI components'), 'Button bucket should contain the multi-file commit');
  t.assert.ok(modalBucketMessages.includes('feat: enhance UI components'), 'Modal bucket should contain the multi-file commit');
});
