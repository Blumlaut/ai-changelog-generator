# Changelog

## 2025-07-17
- Added git diff output to commit information in changelog generation
- Modified system prompt to request more informative changelog entries
- Improved commit collection to include full SHAs and diffs for each commit
- Fixed changelog generation to properly handle existing entries for the same date
- Improved date header handling in changelog entries
- Modified changelog formatting to prevent duplicate headers
- Added logic to merge new entries with existing same-day entries
- Updated @actions/github from 5.1.1 to 6.0.1
- Updated @octokit/plugin-paginate-rest from 2.21.3 to 9.2.2
- Updated @octokit/request from 5.6.3 to 8.4.1
- Updated @octokit/request-error from 2.1.0 to 5.1.1
- Merged PR #5: Bump npm_and_yarn group with 4 updates
- Merged PR #3: Bump @actions/github from 5.1.1 to 6.0.1
- Updated changelog with recent changes
- Fixed base commit determination in changelog generation
- Added check to skip changelog updates when CHANGELOG.md is modified
