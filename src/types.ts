export type IconType = "favicon" | "lucide" | "custom";

export interface SiteCategory {
	id: string;
	name: string;
}

export interface SearchEngine {
	id: string;
	name: string;
	urlTemplate: string;
	enabled: boolean;
	isPreset: boolean;
	iconType: IconType;
	icon: string;
	customIcon?: string;
	category: string;
}

export interface WebSearchSettings {
	engines: SearchEngine[];
	categories: SiteCategory[];
	deletedPresetIds: string[];
	maxContextMenuItems: number;
}

export const PRESET_ENGINES: SearchEngine[] = [
	{
		id: "google",
		name: "Google",
		urlTemplate: "https://www.google.com/search?q={{query}}",
		enabled: true,
		isPreset: true,
		iconType: "favicon",
		icon: "search",
		category: "search",
	},
	{
		id: "bing",
		name: "Bing",
		urlTemplate: "https://www.bing.com/search?q={{query}}",
		enabled: false,
		isPreset: true,
		iconType: "favicon",
		icon: "globe",
		category: "search",
	},
	{
		id: "duckduckgo",
		name: "DuckDuckGo",
		urlTemplate: "https://duckduckgo.com/?q={{query}}",
		enabled: false,
		isPreset: true,
		iconType: "favicon",
		icon: "shield",
		category: "search",
	},
	{
		id: "brave",
		name: "Brave Search",
		urlTemplate: "https://search.brave.com/search?q={{query}}",
		enabled: false,
		isPreset: true,
		iconType: "favicon",
		icon: "compass",
		category: "search",
	},
	{
		id: "perplexity",
		name: "Perplexity",
		urlTemplate: "https://www.perplexity.ai/search?q={{query}}",
		enabled: false,
		isPreset: true,
		iconType: "favicon",
		icon: "sparkles",
		category: "search",
	},
	{
		id: "wikipedia",
		name: "Wikipedia",
		urlTemplate: "https://en.wikipedia.org/w/index.php?search={{query}}",
		enabled: false,
		isPreset: true,
		iconType: "favicon",
		icon: "book-open",
		category: "reference",
	},
	{
		id: "wikipedia-ja",
		name: "Wikipedia (日本語)",
		urlTemplate: "https://ja.wikipedia.org/w/index.php?search={{query}}",
		enabled: false,
		isPreset: true,
		iconType: "favicon",
		icon: "book-open",
		category: "reference",
	},
	{
		id: "google-scholar",
		name: "Google Scholar",
		urlTemplate: "https://scholar.google.com/scholar?q={{query}}",
		enabled: false,
		isPreset: true,
		iconType: "favicon",
		icon: "graduation-cap",
		category: "reference",
	},
	{
		id: "weblio",
		name: "Weblio",
		urlTemplate: "https://www.weblio.jp/content/{{query}}",
		enabled: false,
		isPreset: true,
		iconType: "favicon",
		icon: "languages",
		category: "dictionary",
	},
	{
		id: "wiktionary",
		name: "Wiktionary",
		urlTemplate:
			"https://en.wiktionary.org/wiki/Special:Search?search={{query}}",
		enabled: false,
		isPreset: true,
		iconType: "favicon",
		icon: "book-text",
		category: "dictionary",
	},
];

export const DEFAULT_CATEGORIES: SiteCategory[] = [
	{ id: "search", name: "Search" },
	{ id: "reference", name: "Reference" },
	{ id: "dictionary", name: "Dictionary" },
];

export const DEFAULT_SETTINGS: WebSearchSettings = {
	engines: PRESET_ENGINES.map((e) => ({ ...e })),
	categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
	deletedPresetIds: [],
	maxContextMenuItems: 1,
};
