# Web Search for Obsidian

Search selected text on the web from Obsidian. Use the editor context menu for quick searches, or run a command from the command palette when you prefer keyboard-driven workflows.

## Features

- Search with built-in presets for Google, Bing, DuckDuckGo, Brave Search, Perplexity, Wikipedia, Google Scholar, Weblio, Wiktionary, and more.
- Add custom HTTPS search sites with a `{{query}}` placeholder in the URL.
- Organize sites into categories such as Search, Reference, and Dictionary.
- Reorder sites with drag and drop.
- Choose Lucide icons, site favicons, or custom PNG, JPEG, and WebP icons.
- Control how many search sites appear in the right-click context menu.
- Use the plugin UI in English or Japanese.

## Usage

1. Select text in an editor.
2. Right-click and choose a search site, or open the command palette and run `Search selected text on the web`.
3. If more than one enabled site is available for the command, choose the site from the picker menu.

## Settings

- `Context menu items`: Choose how many enabled sites are shown directly in the editor context menu.
- `Sites`: Enable, disable, edit, delete, and reorder search sites.
- `Categories`: Group sites by workflow, for example general search, reference lookup, or dictionary lookup.
- `URL template`: Custom sites must use HTTPS and include `{{query}}`, for example `https://example.com/search?q={{query}}`.
- `Icons`: Use the configured site's favicon, a Lucide icon, or a locally stored custom raster image.

## Installation

### From Obsidian Community Plugins

Coming soon.

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/hoshimiyacelica/obsidian-web-search/releases).
2. Create a folder named `obsidian-web-search` inside your vault's `.obsidian/plugins/` directory.
3. Copy the downloaded files into that folder.
4. Restart Obsidian.
5. Enable `Web Search` in Settings -> Community plugins.

## Development

This project uses pnpm and Rollup. It does not depend on esbuild.

```bash
pnpm install
pnpm dev
pnpm check
```

- `pnpm dev` watches TypeScript sources and writes `main.js`.
- `pnpm build` type-checks the source and creates a production `main.js`.
- `pnpm check` runs tests, lint, and the production build.

## Privacy and Network Use

- The plugin has no telemetry, ads, account requirement, or server component.
- Search queries are sent only to the search service you choose.
- Favicon mode requests `/favicon.ico` from the configured site's HTTPS origin when the icon is displayed.
- Custom sites and icons are stored locally in Obsidian plugin settings.

## Support

Please use [GitHub Issues](https://github.com/hoshimiyacelica/obsidian-web-search/issues) for bug reports and feature requests.

## License

[MIT](LICENSE)
