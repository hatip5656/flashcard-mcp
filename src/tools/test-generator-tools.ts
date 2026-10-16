import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TestGeneratorClient } from "../services/test-generator-api.js";

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });

/** A short, readable result: what was saved and what still needs attention. */
function summarize(test: any): string {
  const gen = test?.generation ?? {};
  const lines = [
    `Test ${test?.id} — "${test?.title}" (${test?.cefr_level}, ${test?.skill}), status ${test?.status}`,
    `${test?.questions?.length ?? 0} questions; audio: ${gen.audio?.status ?? "none"}`,
  ];
  if (gen.errors?.length) lines.push(`ERRORS (fix with update_test_draft):\n- ${gen.errors.join("\n- ")}`);
  if (gen.warnings?.length) lines.push(`Warnings to check:\n- ${gen.warnings.join("\n- ")}`);
  if (!gen.errors?.length) lines.push("The draft is valid. A person reviews and publishes it in the admin Test generator page.");
  return lines.join("\n");
}

export function registerTestGeneratorTools(server: McpServer, client: TestGeneratorClient): void {
  server.tool(
    "list_test_blueprints",
    "List the test blueprints (listening, reading, grammar & vocabulary, which-sentence-did-you-hear) with their task specs.",
    {},
    async () => {
      const { blueprints } = await client.blueprints();
      return text(JSON.stringify(blueprints.map(b => ({
        id: b.id, title: b.title, type: b.test_type, skill: b.skill, active: b.active, description: b.description, spec: b.spec,
      })), null, 2));
    },
  );

  server.tool(
    "get_test_instructions",
    "Get the full instructions for writing a test from a blueprint at a CEFR level: what to write, the tasks, and the exact draft JSON format. Read this before writing a draft.",
    {
      blueprintId: z.string().describe("Blueprint id from list_test_blueprints, e.g. 'listening-standard'"),
      level: z.string().describe("CEFR level: A2, B1, B2 or C1"),
      topic: z.string().optional().describe("Optional topic, e.g. 'arsti juures'"),
    },
    async ({ blueprintId, level, topic }) => text((await client.instructions(blueprintId, level, topic)).instructions),
  );

  server.tool(
    "create_test_draft",
    "Save a test draft written in the draft JSON format (see get_test_instructions). The server validates it, builds the questions and voices any listening scripts with TTS. Drafts are invisible to learners until a person publishes them.",
    {
      blueprintId: z.string().describe("The blueprint the draft follows"),
      level: z.string().describe("CEFR level of the test"),
      topic: z.string().optional().describe("Topic of the test, for the record"),
      draft: z.record(z.string(), z.any()).describe("The draft object: {title, titleEn, titleTr, tasks: [...]}"),
    },
    async ({ blueprintId, level, topic, draft }) => text(summarize(await client.createDraft(blueprintId, level, draft, topic))),
  );

  server.tool(
    "list_test_drafts",
    "List generated tests (drafts and published) with their status, audio state and number of errors/warnings.",
    {},
    async () => text(JSON.stringify((await client.listDrafts()).tests, null, 2)),
  );

  server.tool(
    "get_test_draft",
    "Get a generated test: its draft JSON (generation.draft), the built questions, errors, warnings and audio state.",
    { id: z.string().describe("Generated test id, e.g. 'gen-b1-listening-1a2b3c4d'") },
    async ({ id }) => text(JSON.stringify(await client.getDraft(id), null, 2)),
  );

  server.tool(
    "update_test_draft",
    "Replace a draft's content (the whole draft object). The questions are rebuilt and the audio rendered again. Only drafts can be edited.",
    {
      id: z.string().describe("Generated test id"),
      draft: z.record(z.string(), z.any()).describe("The full corrected draft object"),
    },
    async ({ id, draft }) => text(summarize(await client.updateDraft(id, draft))),
  );

  server.tool(
    "publish_test_draft",
    "Publish a reviewed draft so learners can take it. Only do this when the user has reviewed the test and asked for it to be published.",
    {
      id: z.string().describe("Generated test id"),
      planRole: z.enum(["practice", "goal", ""]).default("practice").describe("'practice': the feed draws questions from it; 'goal': a goal exam; '': not in the learning plan"),
    },
    async ({ id, planRole }) => text(summarize(await client.publish(id, planRole))),
  );

  server.tool(
    "delete_test_draft",
    "Delete a draft and its audio. Published tests must be unpublished in the admin first.",
    { id: z.string().describe("Generated test id") },
    async ({ id }) => {
      await client.remove(id);
      return text(`Deleted ${id}`);
    },
  );
}
