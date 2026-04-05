import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchPhoto, triggerDownload } from "../services/unsplash.js";

export function registerCreateFlashcard(
  server: McpServer,
  unsplashKey: string,
): void {
  server.tool(
    "create_flashcard",
    "Create a visual language flashcard. Searches Unsplash for a relevant image and returns the flashcard data (image URL, caption, word, translation). Use telegram-mcp's send_photo to deliver it.",
    {
      word: z.string().describe("The word to learn"),
      translation: z.string().describe("Translation of the word"),
      example_sentence: z.string().optional().describe("Example sentence using the word"),
      example_translation: z.string().optional().describe("Translation of the example sentence"),
      image_query: z.string().optional().describe("Custom search query for the image (defaults to the translation)"),
      source_lang: z.string().default("et").describe("Source language code (default: et for Estonian)"),
      target_lang: z.string().default("en").describe("Target language code (default: en for English)"),
    },
    async ({ word, translation, example_sentence, example_translation, image_query, source_lang, target_lang }) => {
      try {
        const query = image_query ?? translation ?? word;
        const photo = await searchPhoto(query, unsplashKey);

        const langLabel = `${source_lang.toUpperCase()} → ${target_lang.toUpperCase()}`;
        let caption = `📚 *${word}*\n🔄 ${translation}\n🌐 ${langLabel}`;

        if (example_sentence) {
          caption += `\n\n💬 _${example_sentence}_`;
        }
        if (example_translation) {
          caption += `\n📝 _${example_translation}_`;
        }

        if (photo) {
          caption += `\n\n📷 [${photo.photographer}](${photo.photographerUrl}) / Unsplash`;
          triggerDownload(photo.downloadUrl, unsplashKey).catch(() => {});
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                word,
                translation,
                caption,
                parse_mode: "Markdown",
                image: photo
                  ? { id: photo.id, url: photo.url, description: photo.description }
                  : null,
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
