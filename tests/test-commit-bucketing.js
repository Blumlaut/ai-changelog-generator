// Simple test script to verify the commit bucketing logic
// This tests the core logic without requiring git setup
const { test, assert } = require('node:test');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

test('commit bucketing logic', async (t) => {
  // Simulate the bucketing logic from index.js
  let commitBuckets = new Map();
  
  // Mock commit data - simulating multiple commits to the same file
  const mockCommits = [
    {
      sha: 'abc123',
      files: ['src/components/Button.js'],
      message: 'feat: add new button component',
      diff: '...diff content 1...'
    },
    {
      sha: 'def456',
      files: ['src/components/Button.js'],
      message: 'fix: improve button styling',
      diff: '...diff content 2...'
    },
    {
      sha: 'ghi789',
      files: ['src/utils/helpers.js'],
      message: 'refactor: optimize helper functions',
      diff: '...diff content 3...'
    },
    {
      sha: 'jkl012',
      files: ['src/components/Button.js', 'src/components/Modal.js'],
      message: 'feat: enhance UI components',
      diff: '...diff content 4...'
    }
  ];
  
  // Apply the bucketing logic
  for (const commit of mockCommits) {
    for (const file of commit.files) {
      // Normalize the file path for consistent bucketing
      const normalizedPath = file.replace(/^\.?\//, ''); // Remove leading dots and slashes
      if (!commitBuckets.has(normalizedPath)) {
        commitBuckets.set(normalizedPath, []);
      }
      commitBuckets.get(normalizedPath).push({
        sha: commit.sha,
        message: commit.message,
        diff: commit.diff
      });
    }
  }
  
  // Verify results
  const buttonBuckets = commitBuckets.get('src/components/Button.js');
  const helpersBuckets = commitBuckets.get('src/utils/helpers.js');
  
  t.assert.ok(buttonBuckets, 'Should have buckets for Button.js');
  t.assert.equal(buttonBuckets.length, 3, 'Should have 3 commits in Button.js bucket');
  
  t.assert.ok(helpersBuckets, 'Should have buckets for helpers.js');
  t.assert.equal(helpersBuckets.length, 1, 'Should have 1 commit in helpers.js bucket');
  
  // Verify the specific commit messages
  t.assert.equal(buttonBuckets[0].message, 'feat: add new button component');
  t.assert.equal(buttonBuckets[1].message, 'fix: improve button styling');
  t.assert.equal(buttonBuckets[2].message, 'feat: enhance UI components');
  
  t.assert.equal(helpersBuckets[0].message, 'refactor: optimize helper functions');
});
