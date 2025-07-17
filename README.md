# AI Changelog Generator

This repository contains a reusable GitHub Action that automatically
updates `CHANGELOG.md` using an AI model. On every push to the base
branch, the action collects commit messages since the last changelog
update, requests a summary from OpenAI (or compatible API) and pushes the
changes to a `generate-ai-changelog` branch. A pull request is opened or
updated with the generated changelog.

## Usage

Create a workflow similar to the example in `.github/workflows/generate-changelog.yml`:

```yaml
name: AI Changelog
on:
  push:
    branches: [main]

jobs:
  changelog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./
        with:
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

The action accepts the following inputs:

- `openai_api_key` (required) – API key for the AI provider.
- `github_token` (required) – Token used to push changes and open PRs.
- `base_branch` – Branch to track for new commits (default `main`).
- `style` – `summary` or `full` changelog style.

## Development

The action is implemented in `index.js` and described by `action.yml`.
It can be published to the GitHub Marketplace for reuse across repositories.
