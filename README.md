# Web Search for Obsidian

[English](#english) | [日本語](#日本語)

---

## English

Search selected text on the web directly from Obsidian — via the right-click context menu or the command palette.

### Features

- **Multiple search engines** — Google, Bing, DuckDuckGo, Brave Search, Perplexity, Wikipedia, Google Scholar, Weblio, Wiktionary and more
- **Custom sites** — Add any site that accepts a search query URL
- **Categories** — Organize sites into custom categories (Search, Reference, Dictionary, etc.)
- **Drag & drop reorder** — Arrange sites in your preferred order
- **Custom icons** — Choose from Lucide icons, auto-fetched favicons, or upload your own image
- **Context menu control** — Configure how many sites appear in the right-click menu
- **Open in browser or Obsidian** — Choose whether results open externally or in an Obsidian tab
- **i18n** — English and Japanese UI

### Usage

1. Select text in the editor
2. Right-click and choose a search engine from the context menu, **or** open the command palette and run **"Search selected text on the web"**
3. If multiple engines are enabled, a picker menu appears

### Installation

#### From Obsidian Community Plugins

> Coming soon

#### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/hoshimiyacelica/obsidian-web-search/releases)
2. Create a folder `obsidian-web-search` inside your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into that folder
4. Restart Obsidian and enable the plugin in Settings → Community Plugins

### Development

```bash
npm install
npm run dev     # watch mode
npm run build   # production build
```

### License

[MIT](LICENSE)

---

## 日本語

Obsidian のエディタで選択したテキストを、右クリックメニューまたはコマンドパレットからウェブ検索できるプラグインです。

### 機能

- **複数の検索エンジン** — Google、Bing、DuckDuckGo、Brave Search、Perplexity、Wikipedia、Google Scholar、Weblio、Wiktionary など
- **カスタムサイト** — 検索クエリ URL を受け付ける任意のサイトを追加可能
- **カテゴリ** — サイトをカスタムカテゴリ（検索、リファレンス、辞書など）で整理
- **ドラッグ＆ドロップ並び替え** — サイトを好みの順序に配置
- **カスタムアイコン** — Lucide アイコン、自動取得ファビコン、アップロード画像から選択
- **コンテキストメニュー制御** — 右クリックメニューに表示するサイト数を設定
- **ブラウザまたは Obsidian で開く** — 検索結果を外部ブラウザで開くか Obsidian タブで開くか選択可能
- **多言語対応** — 英語・日本語 UI

### 使い方

1. エディタでテキストを選択
2. 右クリックメニューから検索エンジンを選択、**または**コマンドパレットを開いて **「選択テキストをウェブ検索」** を実行
3. 複数のエンジンが有効な場合、選択メニューが表示されます

### インストール

#### Obsidian コミュニティプラグインから

> 近日公開予定

#### 手動インストール

1. [最新リリース](https://github.com/hoshimiyacelica/obsidian-web-search/releases)から `main.js`、`manifest.json`、`styles.css` をダウンロード
2. Vault の `.obsidian/plugins/` ディレクトリ内に `obsidian-web-search` フォルダを作成
3. ダウンロードしたファイルをそのフォルダにコピー
4. Obsidian を再起動し、設定 → コミュニティプラグインでプラグインを有効化

### 開発

```bash
npm install
npm run dev     # ウォッチモード
npm run build   # プロダクションビルド
```

### ライセンス

[MIT](LICENSE)
