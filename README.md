# Web Search for Obsidian

Search selected text on the web directly from Obsidian — via the right-click context menu or the command palette.

## Features

- **Multiple search engines** — Google, Bing, DuckDuckGo, Brave Search, Perplexity, Wikipedia, Google Scholar, Weblio, Wiktionary and more
- **Custom sites** — Add any site that accepts a search query URL
- **Categories** — Organize sites into custom categories (Search, Reference, Dictionary, etc.)
- **Drag & drop reorder** — Arrange sites in your preferred order
- **Custom icons** — Choose from Lucide icons, auto-fetched favicons, or upload your own image
- **Context menu control** — Configure how many sites appear in the right-click menu
- **Open in browser or Obsidian** — Choose whether results open externally or in an Obsidian tab
- **i18n** — English and Japanese UI

## Usage

1. Select text in the editor
2. Right-click and choose a search engine from the context menu, **or** open the command palette and run **"Search selected text on the web"**
3. If multiple engines are enabled, a picker menu appears

## Installation

### From Obsidian Community Plugins

> Coming soon

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/hoshimiyacelica/obsidian-web-search/releases)
2. Create a folder `obsidian-web-search` inside your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into that folder
4. Restart Obsidian and enable the plugin in Settings → Community Plugins

## Development

```bash
npm install
npm run dev     # watch mode
npm run build   # production build
```

## License

[MIT](LICENSE)
