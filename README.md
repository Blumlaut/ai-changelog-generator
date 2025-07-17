# AI Changelog Generator

This repository contains a reusable GitHub Action that automatically
updates `CHANGELOG.md` using an AI model. On every push to the base
branch, the action collects commit messages since the last changelog
update, sends them to an AI provider such as OpenAI, Deepseek, Anthropic
or Ollama, then pushes the result to a `generate-ai-changelog` branch.
A pull request is opened or updated with the generated changelog.

## Adding to your repository

1. Copy the workflow from `.github/workflows/generate-changelog.yml` into your
   repository.
2. Replace the `uses: ./` line with `uses: owner/ai-changelog-generator@main` or
   a pinned version.
3. Provide your AI provider API key as a secret named `AI_API_KEY`.


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
          api_key: ${{ secrets.AI_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          provider: openai
          system_prompt: "You are an AI changelog generator"
```

The action accepts the following inputs:

- `api_key` (required) – API key for the chosen AI provider.
- `api_base_url` – Override the provider API base URL.
- `provider` – Which provider module to use (`openai`, `deepseek`, `anthropic`, `ollama`).
- `github_token` (required) – Token used to push changes and open PRs.
- `base_branch` – Branch to track for new commits (default `main`).
- `style` – `summary` or `full` changelog style.
- `system_prompt` – Optional system prompt sent to the AI model before the commit summary.

Each provider is implemented as a small module under `providers/`. You can
add your own module and select it via the `provider` input.

## Development

The action is implemented in `index.js` and described by `action.yml`.
It can be published to the GitHub Marketplace for reuse across repositories.
