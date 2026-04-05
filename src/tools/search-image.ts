import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchPhoto } from "../services/unsplash.js";

export function registerSearchImage(server: McpServer, unsplashKey: string): void {
  server.tool(
    "search_image",
    "Search Unsplash for a photo matching a query. Returns the image URL and metadata without sending it.",
    {
      query: z.string().describe("Search query for the image"),
    },
    async ({ query }) => {
      try {
        const photo = await searchPhoto(query, unsplashKey);

        if (!photo) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ success: true, found: false }),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                found: true,
                photo: {
                  id: photo.id,
                  url: photo.url,
                  thumbUrl: photo.thumbUrl,
                  description: photo.description,
                  photographer: photo.photographer,
                  photographerUrl: photo.photographerUrl,
                },
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
