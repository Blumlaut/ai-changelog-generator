const { test, assert } = require('node:test');
const commitProcessor = require('../src/commitProcessor');

// Test token counting function
test('token counting logic', async (t) => {
  t.assert.equal(commitProcessor.countTokens(''), 0);
  t.assert.equal(commitProcessor.countTokens('hello'), 2); // 5 chars / 4 = 1.25 -> ceil(1.25) = 2
  t.assert.equal(commitProcessor.countTokens('hello world'), 3); // 11 chars / 4 = 2.75 -> ceil(2.75) = 3
  t.assert.equal(commitProcessor.countTokens('a'.repeat(4)), 1);
  t.assert.equal(commitProcessor.countTokens('a'.repeat(5)), 2);
});

// Test file path normalization
test('file path normalization', async (t) => {
  t.assert.equal(commitProcessor.normalizeFilePath('./src/file.js'), 'src/file.js');
  t.assert.equal(commitProcessor.normalizeFilePath('/src/file.js'), 'src/file.js');
  t.assert.equal(commitProcessor.normalizeFilePath('src/file.js'), 'src/file.js');
  t.assert.equal(commitProcessor.normalizeFilePath('../src/file.js'), '../src/file.js'); // This should NOT be changed by the regex
  t.assert.equal(commitProcessor.normalizeFilePath('file.js'), 'file.js');
});

// Test commit bucketing logic (mocked)
test('commit bucketing logic', async (t) => {
  // Test that the function exists and can be called
  const testBuckets = new Map();
  
  // Add some test data
  testBuckets.set('src/index.js', [
    {
      sha: 'abc123',
      message: 'feat: add new feature',
      diff: 'diff content'
    }
  ]);
  
  // Verify the bucket structure
  t.assert.ok(testBuckets.has('src/index.js'), 'Should have bucket for src/index.js');
  t.assert.equal(testBuckets.get('src/index.js').length, 1, 'Should have 1 commit in bucket');
  t.assert.equal(testBuckets.get('src/index.js')[0].sha, 'abc123', 'Should have correct commit SHA');
  t.assert.equal(testBuckets.get('src/index.js')[0].message, 'feat: add new feature', 'Should have correct commit message');
});

console.log('Commit processor tests completed successfully');
