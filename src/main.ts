import { Editor, Menu, Notice, Plugin, setIcon } from "obsidian";
import { WebSearchSettingTab } from "./settings";
import { t, getDefaultCategoryName } from "./i18n";
import {
	DEFAULT_CATEGORIES,
	DEFAULT_SETTINGS,
	PRESET_ENGINES,
	getFaviconUrl,
	type SearchEngine,
	type WebSearchSettings,
} from "./types";

export default class WebSearchPlugin extends Plugin {
	settings: WebSearchSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new WebSearchSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				this.addSearchMenuItems(menu, editor);
			})
		);

		this.addCommand({
			id: "search-selected-text",
			name: t("command.searchSelectedText"),
			editorCallback: (editor) => {
				const selected = editor.getSelection().trim();
				if (!selected) {
					new Notice(t("notice.noTextSelected"));
					return;
				}
				const enabled = this.getEnabledEngines();
				if (enabled.length === 0) {
					new Notice(t("notice.noSitesEnabled"));
					return;
				}
				if (enabled.length === 1) {
					this.performSearch(enabled[0], selected);
				} else {
					this.showEngineSelectionMenu(enabled, selected);
				}
			},
		});
	}

	private addSearchMenuItems(menu: Menu, editor: Editor): void {
		const selected = editor.getSelection().trim();
		if (!selected) return;

		const enabled = this.getEnabledEngines();
		if (enabled.length === 0) return;

		const visible = enabled.slice(0, this.settings.maxContextMenuItems);
		for (const engine of visible) {
			menu.addItem((item) => {
				item.setTitle(t("context.searchWith", engine.name))
					.setIcon(engine.icon)
					.onClick(() => this.performSearch(engine, selected));
				this.replaceMenuIcon((item as any).dom, engine);
			});
		}
	}

	private showEngineSelectionMenu(
		engines: SearchEngine[],
		query: string
	): void {
		const menu = new Menu();
		for (const engine of engines) {
			menu.addItem((item) => {
				item.setTitle(engine.name)
					.setIcon(engine.icon)
					.onClick(() => this.performSearch(engine, query));
				this.replaceMenuIcon((item as any).dom, engine);
			});
		}
		menu.showAtMouseEvent(
			new MouseEvent("contextmenu", {
				clientX: window.innerWidth / 2,
				clientY: window.innerHeight / 2,
			})
		);
	}

	private replaceMenuIcon(dom: HTMLElement, engine: SearchEngine): void {
		const iconEl = dom.querySelector(".menu-item-icon");
		if (!(iconEl instanceof HTMLElement)) return;

		let src: string | null = null;
		if (engine.iconType === "custom" && engine.customIcon) {
			src = engine.customIcon;
		} else if (engine.iconType === "favicon") {
			src = getFaviconUrl(engine.urlTemplate);
		}

		if (!src) return;

		iconEl.empty();
		const img = iconEl.createEl("img", {
			attr: { src, alt: engine.name },
			cls: "web-search-menu-favicon",
		});
		img.onerror = () => {
			img.remove();
			setIcon(iconEl, engine.icon);
		};
	}

	private performSearch(engine: SearchEngine, query: string): void {
		const encoded = encodeURIComponent(query);
		const url = engine.urlTemplate.replace("{{query}}", encoded);
		if (this.settings.openInBrowser) {
			window.open(url, "_blank");
		} else {
			const leaf = this.app.workspace.getLeaf("tab");
			leaf.setViewState({ type: "web-search-view", state: { url } });
		}
	}

	private getEnabledEngines(): SearchEngine[] {
		return this.settings.engines.filter((e) => e.enabled);
	}

	async loadSettings(): Promise<void> {
		const saved = await this.loadData();
		if (!saved) {
			this.settings = {
				engines: PRESET_ENGINES.map((e) => ({ ...e })),
				categories: DEFAULT_CATEGORIES.map((c) => ({
					...c,
					name: getDefaultCategoryName(c.id),
				})),
				deletedPresetIds: [],
				openInBrowser: DEFAULT_SETTINGS.openInBrowser,
				maxContextMenuItems: DEFAULT_SETTINGS.maxContextMenuItems,
			};
			return;
		}

		const categories = saved.categories
			? (saved.categories as WebSearchSettings["categories"])
			: DEFAULT_CATEGORIES.map((c) => ({
					...c,
					name: getDefaultCategoryName(c.id),
				}));

		const deletedPresetIds: string[] = saved.deletedPresetIds ?? [];

		this.settings = {
			openInBrowser: saved.openInBrowser ?? DEFAULT_SETTINGS.openInBrowser,
			maxContextMenuItems:
				saved.maxContextMenuItems ??
				DEFAULT_SETTINGS.maxContextMenuItems,
			categories,
			deletedPresetIds,
			engines: this.mergeEngines(saved.engines ?? [], deletedPresetIds),
		};
	}

	private mergeEngines(
		saved: SearchEngine[],
		deletedIds: string[]
	): SearchEngine[] {
		const result: SearchEngine[] = [];
		const savedById = new Map(saved.map((e) => [e.id, e]));

		for (const preset of PRESET_ENGINES) {
			if (deletedIds.includes(preset.id)) continue;

			const existing = savedById.get(preset.id);
			if (existing) {
				result.push({
					...preset,
					enabled: existing.enabled,
					urlTemplate: existing.urlTemplate,
					name: existing.name ?? preset.name,
					iconType: existing.iconType ?? "favicon",
					icon: existing.icon ?? preset.icon,
					customIcon: existing.customIcon,
					category: existing.category ?? preset.category,
				});
				savedById.delete(preset.id);
			} else {
				result.push({ ...preset });
			}
		}

		for (const engine of saved) {
			if (!engine.isPreset && savedById.has(engine.id)) {
				result.push({
					...engine,
					iconType: engine.iconType ?? "favicon",
					icon: engine.icon || "search",
					category: engine.category || "search",
				});
			}
		}

		return result;
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
