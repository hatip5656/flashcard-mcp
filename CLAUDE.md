# Flashcard MCP - Project Instructions

## Overview

MCP server for language learning flashcards. Searches Unsplash for relevant images and returns flashcard data (image URL + formatted caption). Designed to work alongside telegram-mcp for delivery.

## Architecture

- **Runtime**: Node.js + TypeScript
- **MCP transport**: stdio
- **Image source**: Unsplash API
- **No Telegram dependency** — this server only creates flashcard data; use telegram-mcp's `send_photo` to deliver

## Key Files

- `src/index.ts` — Entry point, MCP server setup
- `src/services/unsplash.ts` — Unsplash API client (search, download trigger)
- `src/tools/create-flashcard.ts` — Main tool: generates flashcard with image + caption
- `src/tools/search-image.ts` — Standalone Unsplash image search

## Code Conventions

- ES modules (`"type": "module"` in package.json)
- `.js` extensions in imports (required for ESM)
- Zod for tool parameter validation
- Functional style for tool registration

## Build & Run

```bash
npm install
npm run build          # tsc
npm run dev            # tsx src/index.ts
UNSPLASH_ACCESS_KEY=... node dist/index.js
```

## Environment Variables

- `UNSPLASH_ACCESS_KEY` — Required. Get from unsplash.com/developers

## Git

- Repo-level git config only (no --global)
- User: Hatip Aksunger <hatip.aksunger@gmail.com>
- Co-author Claude in commits
