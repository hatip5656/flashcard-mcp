#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerCreateFlashcard } from "./tools/create-flashcard.js";
import { registerSearchImage } from "./tools/search-image.js";
import { registerAdminTools } from "./tools/admin-tools.js";
import { login, createAdminClient } from "./services/admin-api.js";

const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
const adminApiUrl = process.env.ADMIN_API_URL || "https://wordagram.hatip.dev/api";
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

const server = new McpServer(
  {
    name: "flashcard-mcp",
    version: "2.0.0",
  },
  {
    instructions:
      "Flashcard MCP server for Estonian language learning.\n\n" +
      "FLASHCARD TOOLS (require UNSPLASH_ACCESS_KEY):\n" +
      "- create_flashcard: Generate visual flashcards with Unsplash images\n" +
      "- search_image: Search Unsplash for images\n\n" +
      "ADMIN TOOLS (require ADMIN_USERNAME + ADMIN_PASSWORD):\n" +
      "- get_unlinked_sentences: Find sentences without grammar links\n" +
      "- get_grammar_ai_prompt: Get AI prompt template for grammar analysis\n" +
      "- link_sentence_grammar: Connect a sentence to a grammar rule\n" +
      "- bulk_link_sentence_grammar: Batch connect sentences to grammar\n" +
      "- get_sentence_grammar_stats: Coverage statistics\n" +
      "- get_grammar_lessons: List all grammar lessons\n" +
      "- get_word_sentences: Get sentences for a word\n" +
      "- get_words: Browse vocabulary\n" +
      "- get_user_context: Export learner profile\n" +
      "- get_system_health: Check backend services\n\n" +
      "GRAMMAR LINKING WORKFLOW:\n" +
      "1. get_unlinked_sentences → batch of sentences to analyze\n" +
      "2. get_grammar_ai_prompt → prompt template with all grammar rules\n" +
      "3. Analyze each sentence against the grammar list\n" +
      "4. link_sentence_grammar or bulk_link_sentence_grammar → save connections",
  },
);

// Register flashcard tools (Unsplash — optional)
if (unsplashKey) {
  registerCreateFlashcard(server, unsplashKey);
  registerSearchImage(server, unsplashKey);
} else {
  console.error("[flashcard-mcp] UNSPLASH_ACCESS_KEY not set — flashcard tools disabled");
}

async function main(): Promise<void> {
  // Register admin tools (requires auth)
  if (adminUsername && adminPassword) {
    try {
      await login(adminApiUrl, adminUsername, adminPassword);
      console.error(`[flashcard-mcp] Authenticated as ${adminUsername}`);
      const client = createAdminClient(adminApiUrl);
      registerAdminTools(server, client);
      console.error("[flashcard-mcp] Admin tools registered (10 tools)");
    } catch (e) {
      console.error(`[flashcard-mcp] Admin auth failed: ${e}`);
    }
  } else {
    console.error("[flashcard-mcp] ADMIN_USERNAME/ADMIN_PASSWORD not set — admin tools disabled");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[flashcard-mcp] MCP server connected via stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
