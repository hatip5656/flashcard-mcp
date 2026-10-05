# Flashcard MCP - Project Instructions

## Overview

MCP server for Estonian language learning. Two feature sets:

1. **Flashcard Tools** — Unsplash image search + flashcard generation
2. **Admin Tools** — Backend API integration for grammar linking, data exploration, user management

## Architecture

- **Runtime**: Node.js + TypeScript (ESM)
- **MCP transport**: stdio
- **Image source**: Unsplash API
- **Backend**: Wordagram API (JWT auth)

## Key Files

- `src/index.ts` — Entry point, auth, tool registration
- `src/services/unsplash.ts` — Unsplash API client
- `src/services/admin-api.ts` — Wordagram admin API client (JWT auth)
- `src/tools/create-flashcard.ts` — Flashcard generation
- `src/tools/search-image.ts` — Image search
- `src/tools/admin-tools.ts` — All admin tools (grammar linking, data, health)

## Code Conventions

- ES modules (`"type": "module"`)
- `.js` extensions in imports (required for ESM)
- Zod for tool parameter validation
- Functional style for tool registration

## Build & Run

```bash
npm install
npm run build          # tsc
npm run dev            # tsx src/index.ts
```

## Environment Variables

- `UNSPLASH_ACCESS_KEY` — Optional. Enables flashcard tools
- `ADMIN_API_URL` — Optional. Default: https://wordagram.hatip.dev/api
- `ADMIN_USERNAME` — Required for admin tools
- `ADMIN_PASSWORD` — Required for admin tools

## MCP Config Example

```json
{
  "mcpServers": {
    "flashcard": {
      "command": "node",
      "args": ["/path/to/flashcard-mcp/dist/index.js"],
      "env": {
        "ADMIN_USERNAME": "hatip",
        "ADMIN_PASSWORD": "hatip_admin",
        "UNSPLASH_ACCESS_KEY": "optional"
      }
    }
  }
}
```

## Grammar Linking Workflow

1. `get_unlinked_sentences` → batch of sentences to analyze
2. `get_grammar_ai_prompt` → prompt with all grammar rules listed
3. Analyze each sentence against grammar rules
4. `link_sentence_grammar` or `bulk_link_sentence_grammar` → save

## Git

- User: Hatip Aksunger <hatip.aksunger@gmail.com>
- Co-author Claude in commits
