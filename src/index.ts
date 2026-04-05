#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerCreateFlashcard } from "./tools/create-flashcard.js";
import { registerSearchImage } from "./tools/search-image.js";

const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
if (!unsplashKey) {
  console.error("UNSPLASH_ACCESS_KEY environment variable is required");
  process.exit(1);
}

const server = new McpServer(
  {
    name: "flashcard-mcp",
    version: "1.0.0",
  },
  {
    instructions:
      "Flashcard MCP server for language learning. Use create_flashcard to generate a visual flashcard with an Unsplash image, word, translation, and example sentence. The result includes an image URL and formatted caption — use telegram-mcp's send_photo to deliver it to the user. Default language pair: Estonian → English.",
  },
);

registerCreateFlashcard(server, unsplashKey);
registerSearchImage(server, unsplashKey);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[flashcard-mcp] MCP server connected via stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
