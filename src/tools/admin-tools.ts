import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AdminClient } from "../services/admin-api.js";

export function registerAdminTools(server: McpServer, client: AdminClient): void {

  // ── Sentence-Grammar Linking ──────────────────────────────

  server.tool(
    "get_unlinked_sentences",
    "Get sentences that haven't been linked to grammar rules yet. Use this to find sentences to analyze.",
    {
      limit: z.number().default(20).describe("Number of sentences to fetch"),
      offset: z.number().default(0).describe("Offset for pagination"),
    },
    async ({ limit, offset }) => {
      const result = await client.getUnlinkedSentences(limit, offset);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    },
  );

  server.tool(
    "get_grammar_ai_prompt",
    "Get the AI prompt template with all available grammar lessons listed. Use this to build prompts for analyzing sentences.",
    {},
    async () => {
      const result = await client.getAIPrompt();
      return {
        content: [{
          type: "text" as const,
          text: result.prompt,
        }],
      };
    },
  );

  server.tool(
    "link_sentence_grammar",
    "Link a sentence to a grammar rule. Creates a connection in the knowledge graph.",
    {
      wordId: z.string().describe("The word ID that owns the sentence"),
      sentenceEstonian: z.string().describe("The Estonian sentence text"),
      grammarLessonId: z.string().describe("The grammar lesson ID to link to"),
      confidence: z.number().min(0).max(1).default(0.9).describe("Confidence 0-1 (1=textbook example)"),
      notes: z.string().optional().describe("Brief explanation of how this grammar appears"),
    },
    async ({ wordId, sentenceEstonian, grammarLessonId, confidence, notes }) => {
      const result = await client.createSentenceGrammarLink({
        wordId, sentenceEstonian, grammarLessonId, confidence, notes,
      });
      return {
        content: [{
          type: "text" as const,
          text: `Linked: ${sentenceEstonian} → ${grammarLessonId} (confidence: ${confidence})`,
        }],
      };
    },
  );

  server.tool(
    "bulk_link_sentence_grammar",
    "Bulk link multiple sentences to grammar rules. More efficient for batch operations.",
    {
      links: z.array(z.object({
        wordId: z.string(),
        sentenceEstonian: z.string(),
        grammarLessonId: z.string(),
        confidence: z.number().min(0).max(1).default(0.9),
        notes: z.string().optional(),
      })).describe("Array of links to create"),
    },
    async ({ links }) => {
      const linksWithCreator = links.map(l => ({ ...l, createdBy: "mcp-ai" }));
      const result = await client.bulkCreateLinks(linksWithCreator);
      return {
        content: [{
          type: "text" as const,
          text: `Bulk link: ${result.created} created, ${result.failed} failed out of ${result.total}`,
        }],
      };
    },
  );

  server.tool(
    "get_sentence_grammar_stats",
    "Get statistics about sentence-grammar link coverage.",
    {},
    async () => {
      const result = await client.getSentenceGrammarStats();
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    },
  );

  // ── Data Exploration ──────────────────────────────────────

  server.tool(
    "get_grammar_lessons",
    "List all grammar lessons with their IDs, levels, and topics.",
    {},
    async () => {
      const result = await client.getGrammarLessons();
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    },
  );

  server.tool(
    "get_word_sentences",
    "Get all example sentences for a specific word.",
    {
      wordId: z.string().describe("The word ID"),
    },
    async ({ wordId }) => {
      const result = await client.getWordSentences(wordId);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    },
  );

  server.tool(
    "get_words",
    "List words in the vocabulary database.",
    {
      limit: z.number().default(50).describe("Number of words to fetch"),
    },
    async ({ limit }) => {
      const result = await client.getAllWords(limit);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    },
  );

  server.tool(
    "get_user_context",
    "Export a user's learning context (level, weak words, quiz stats) for personalized content generation.",
    {
      chatId: z.number().describe("The user's chat ID"),
    },
    async ({ chatId }) => {
      const result = await client.exportUserContext(chatId);
      return {
        content: [{
          type: "text" as const,
          text: result.textSummary || JSON.stringify(result, null, 2),
        }],
      };
    },
  );

  server.tool(
    "get_system_health",
    "Check the health of all backend services (database, Redis, TTS).",
    {},
    async () => {
      const result = await client.getHealth();
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    },
  );
}
