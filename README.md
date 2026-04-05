# flashcard-mcp

MCP server for language learning flashcards with Unsplash images. Designed to work alongside [telegram-mcp](https://github.com/hatip5656/telegram-mcp) for delivery via Telegram.

## How it works

1. Claude calls `create_flashcard` with a word and translation
2. The server searches Unsplash for a relevant image
3. Returns the image URL and a formatted caption
4. Use telegram-mcp's `send_photo` to deliver the flashcard

## Tools

### `create_flashcard`

Creates a visual flashcard with an Unsplash image.

| Parameter | Required | Description |
|---|---|---|
| `word` | Yes | The word to learn |
| `translation` | Yes | Translation of the word |
| `example_sentence` | No | Example sentence using the word |
| `example_translation` | No | Translation of the example sentence |
| `image_query` | No | Custom image search query (defaults to translation) |
| `source_lang` | No | Source language code (default: `et`) |
| `target_lang` | No | Target language code (default: `en`) |

### `search_image`

Search Unsplash for a photo without creating a flashcard.

| Parameter | Required | Description |
|---|---|---|
| `query` | Yes | Search query |

## Setup

### 1. Get an Unsplash API key

Register at [unsplash.com/developers](https://unsplash.com/developers) and create an app.

### 2. Add to Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "flashcard": {
      "command": "node",
      "args": ["/path/to/flashcard-mcp/dist/index.js"],
      "env": {
        "UNSPLASH_ACCESS_KEY": "your-access-key"
      }
    }
  }
}
```

### 3. Build

```bash
npm install
npm run build
```

## Usage with telegram-mcp

```
1. @flashcard create_flashcard word="tere" translation="hello"
2. Take the image URL + caption from the result
3. @telegram send_photo chat_id=123 photo=<url> caption=<caption>
```

Or let Claude orchestrate the flow automatically with a polling loop.

## License

MIT
