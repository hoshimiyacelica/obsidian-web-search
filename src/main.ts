import { Editor, Menu, Notice, Plugin } from "obsidian";
import { WebSearchSettingTab } from "./settings";
import { t, getDefaultCategoryName } from "./i18n";
import { buildSearchUrl } from "./search-url";
import { parseSavedSettings } from "./settings-data";
import {
	DEFAULT_CATEGORIES,
	DEFAULT_SETTINGS,
	PRESET_ENGINES,
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
			}),
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
					const [engine] = enabled;
					if (engine) this.performSearch(engine, selected);
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
				item
					.setTitle(t("context.searchWith", engine.name))
					.setIcon(engine.icon)
					.onClick(() => this.performSearch(engine, selected));
			});
		}
	}

	private showEngineSelectionMenu(
		engines: SearchEngine[],
		query: string,
	): void {
		const menu = new Menu();
		for (const engine of engines) {
			menu.addItem((item) => {
				item
					.setTitle(engine.name)
					.setIcon(engine.icon)
					.onClick(() => this.performSearch(engine, query));
			});
		}
		menu.showAtPosition(
			{
				x: activeWindow.innerWidth / 2,
				y: activeWindow.innerHeight / 2,
			},
			activeDocument,
		);
	}

	private performSearch(engine: SearchEngine, query: string): void {
		const url = buildSearchUrl(engine.urlTemplate, query);
		if (!url) {
			new Notice(t("notice.invalidUrlTemplate"));
			return;
		}

		activeWindow.open(url, "_blank", "noopener,noreferrer");
	}

	private getEnabledEngines(): SearchEngine[] {
		return this.settings.engines.filter((e) => e.enabled);
	}

	async loadSettings(): Promise<void> {
		const saved = parseSavedSettings((await this.loadData()) as unknown);

		const categories = saved.categories
			? saved.categories
			: DEFAULT_CATEGORIES.map((c) => ({
					...c,
					name: getDefaultCategoryName(c.id),
				}));

		const deletedPresetIds: string[] = saved.deletedPresetIds ?? [];

		this.settings = {
			maxContextMenuItems:
				saved.maxContextMenuItems ?? DEFAULT_SETTINGS.maxContextMenuItems,
			categories,
			deletedPresetIds,
			engines: this.mergeEngines(saved.engines ?? [], deletedPresetIds),
		};
	}

	private mergeEngines(
		saved: SearchEngine[],
		deletedIds: string[],
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
