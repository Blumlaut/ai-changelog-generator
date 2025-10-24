# AI Changelog Generator

This repository contains a reusable GitHub Action that automatically
updates `CHANGELOG.md` using an AI model. On every push to the base
branch, the action collects commit messages since the last changelog
update, sends them to an AI provider such as OpenAI, Deepseek, Anthropic
or Ollama, then pushes the result to a `generate-ai-changelog` branch.
A pull request is opened or updated with the generated changelog. Each
entry is prepended to `CHANGELOG.md` under the current date so the
latest changes appear first.

## Adding to your repository
0. Create a "CHANGELOG.md" file with the contents of "# Changelog" in your main brain.
1. Copy the workflow from `.github/workflows/generate-changelog.yml` into your
   repository.
2. Provide your AI provider API key as a secret named `AI_API_KEY`.
3. Ensure your Repository has "Allow GitHub Actions to create and approve pull requests" and Read/Write Permissions enabled in the Github Action Settings


## Usage

Create a workflow similar to the example in `.github/workflows/generate-changelog.yml`:

```yaml
name: AI Changelog
on:
  push:
    branches: [main]
    paths-ignore:
      - CHANGELOG.md

jobs:
  changelog:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: blumlaut/ai-changelog-generator@main
        with:
          api_key: ${{ secrets.AI_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          provider: openai
          model: o4-mini
```

The action accepts the following inputs:

- `api_key` (required) – API key for the chosen AI provider.
- `api_base_url` – Override the provider API base URL.
- `provider` – Which provider module to use (`openai`, `deepseek`, `anthropic`, `ollama`).
- `github_token` (required) – Token used to push changes and open PRs.
- `base_branch` – Branch to track for new commits (default `main`).
- `changelog_path` - path of your changelog file (default `CHANGELOG.md`)
- `use_tags` - Use git tags instead of rolling release style (default `false`)
- `style` – `summary` or `full` changelog style.
- `system_prompt` – Optional system prompt sent to the AI model before the commit summary.
- `model` – Override the default model used by the provider.
- `max_tokens` – Maximum tokens allowed per prompt (default `12000`). Reduce this value if you're experiencing token limit errors.
- `max_diff_chars` – Maximum characters per diff (default `5000`). Reduce this value to limit the size of diffs included in prompts.

Each provider is implemented as a small module under `providers/`. You can
add your own module and select it via the `provider` input.
