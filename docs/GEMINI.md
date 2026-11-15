# Gemini Interactions API setup

The project uses `@google/genai` 3.3.0, the latest npm version checked on 2026-11-15. Google's current getting-started guide and model overview recommend `gemini-4-hydrogen` for general-purpose work. That is the default for this project's test. Set `GEMINI_MODEL` explicitly to select another supported model; the current frontier reasoning options include `gemini-4-carbon` and `gemini-4-argon`.

## Run the requested test

With `GEMINI_API_KEY` configured in the ignored `.env.local` file:

```sh
npm run gemini:test
```

The script uses `client.interactions.create`, prints the model's text reply, and makes one request with retries and automatic continuation disabled. It opts out of interaction storage and caps generated output. It does not use the legacy `generateContent` endpoint from the curl example. A failed or incomplete request exits with an error; it does not silently switch models or retry.

## Approved agent resources

- The official `gemini-api-dev` skill is installed project-locally at `.agents/skills/gemini-api-dev/SKILL.md`, from `google-gemini/gemini-skills`. It will be discoverable on the next turn.
- Codex's global MCP configuration contains the enabled `geminiDocs` HTTP server at `https://gemini-api-docs-mcp.dev`. Direct initialization, tool discovery, and a documentation search succeeded; it exposes `gemini_search_docs` and `gemini_get_doc`. The active agent's tool list may need a session refresh to load newly configured servers.

Verify the saved MCP configuration with `codex mcp get geminiDocs --json`.

## Live test result (2026-11-15)

The Interactions API test completed successfully with `gemini-4-hydrogen`:

> AI learns patterns from data to make predictions or decisions.

The first attempt reached the API but returned `incomplete` with a 128-token output limit. The corrected test uses a 2,048-token limit and completed on the next invocation. Two requests were made in total, with no automatic retries. The test keeps interaction storage disabled. The API key is saved only in ignored local configuration with owner-only permissions.

## Official documentation checked

- [Getting started](https://aistudio.google.com/docs/get-started.md)
- [Latest models](https://aistudio.google.com/docs/latest-model.md)
- [Interactions API](https://aistudio.google.com/docs/interactions-overview.md)
- [Coding agent setup](https://aistudio.google.com/docs/coding-agents.md)
