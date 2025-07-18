# Changelog

## 2025-07-18
- Updated README.md with instructions to create a "CHANGELOG.md" file
- Updated README.md to remove development section and streamline documentation
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

- Ignored changes to CHANGELOG.md in GitHub Actions workflow
- Updated README.md to reflect CHANGELOG.md ignore changes

- Updated default system prompt in index.js to exclude changelog-related changes from being included in generated changelogs

- Added GitHub workflow for bundling action on push to main branch
- Updated changelog generation workflow to ignore dist/ and bin/ directories
- Improved commit filtering logic in changelog generator to use ignore patterns
- Added ignore package as dependency for better file filtering
- Fixed missing ignore dependency initialization in changelog generator script

- Added `@vercel/ncc` as a dev dependency for building the project
- Added build script using `ncc` in package.json
- Updated package-lock.json with new dependencies

- Updated `action.yml` to change the main script path from `index.js` to `dist/index.js`

- Updated README.md to clarify GitHub Actions permissions requirements

- Removed npm CI usage in favor of bundled files
- Updated provider handling to use predefined providers instead of dynamic imports
- Modified workflow paths in generate-changelog.yml
- Fixed base commit range determination logic (reverted experimental changes)
- Added default providers configuration (OpenAI, Deepseek, Anthropic, Ollama)

- Updated README.md to include `fetch-depth: 0` in the checkout step for the GitHub Action workflow

- Improved system prompt for changelog generation to clarify handling of multi-file changes
