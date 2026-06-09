import {
	App,
	Modal,
	Notice,
	PluginSettingTab,
	Setting,
	ToggleComponent,
	setIcon,
} from "obsidian";
import type WebSearchPlugin from "./main";
import {
	PRESET_ENGINES,
	getFaviconUrl,
	type IconType,
	type SearchEngine,
	type SiteCategory,
} from "./types";
import { t, getDefaultCategoryName } from "./i18n";

// ── Constants ──────────────────────────────────────────────────

const LUCIDE_OPTIONS: { value: string; label: string }[] = [
	{ value: "search", label: "Search" },
	{ value: "globe", label: "Globe" },
	{ value: "shield", label: "Shield" },
	{ value: "compass", label: "Compass" },
	{ value: "sparkles", label: "Sparkles" },
	{ value: "book-open", label: "Book (open)" },
	{ value: "book-text", label: "Book (text)" },
	{ value: "graduation-cap", label: "Academic" },
	{ value: "languages", label: "Languages" },
	{ value: "library", label: "Library" },
	{ value: "bot", label: "Bot" },
];

const MAX_ICON_PX = 128;
const MAX_FILE_BYTES = 512 * 1024;

// ── Image processing ───────────────────────────────────────────

function processImage(file: File): Promise<string> {
	if (file.size > MAX_FILE_BYTES) {
		return Promise.reject(new Error("File too large (max 512 KB)"));
	}
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = reject;

		if (file.type === "image/svg+xml") {
			reader.onload = () => resolve(reader.result as string);
			reader.readAsDataURL(file);
			return;
		}

		reader.onload = () => {
			const img = new Image();
			img.onload = () => {
				let w = img.width;
				let h = img.height;
				if (w > MAX_ICON_PX || h > MAX_ICON_PX) {
					const scale = MAX_ICON_PX / Math.max(w, h);
					w = Math.round(w * scale);
					h = Math.round(h * scale);
				}
				const canvas = document.createElement("canvas");
				canvas.width = w;
				canvas.height = h;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("Canvas not available"));
					return;
				}
				ctx.drawImage(img, 0, 0, w, h);
				resolve(canvas.toDataURL("image/png"));
			};
			img.onerror = () => reject(new Error("Invalid image"));
			img.src = reader.result as string;
		};
		reader.readAsDataURL(file);
	});
}

// ── Icon rendering helper ──────────────────────────────────────

function renderEngineIcon(
	container: HTMLElement,
	engine: SearchEngine
): void {
	if (engine.iconType === "custom" && engine.customIcon) {
		const img = container.createEl("img", {
			attr: { src: engine.customIcon, alt: engine.name },
		});
		img.onerror = () => {
			img.remove();
			setIcon(container, engine.icon);
		};
		return;
	}

	if (engine.iconType === "lucide") {
		setIcon(container, engine.icon);
		return;
	}

	// favicon (default)
	const url = getFaviconUrl(engine.urlTemplate);
	if (url) {
		const img = container.createEl("img", {
			attr: { src: url, alt: engine.name },
		});
		img.onerror = () => {
			img.remove();
			setIcon(container, engine.icon);
		};
	} else {
		setIcon(container, engine.icon);
	}
}

// ── Settings tab ───────────────────────────────────────────────

export class WebSearchSettingTab extends PluginSettingTab {
	plugin: WebSearchPlugin;
	private draggedIndex: number | null = null;
	private dragSourceList: HTMLElement | null = null;

	constructor(app: App, plugin: WebSearchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// ── General ──
		containerEl.createEl("h3", { text: t("settings.general") });

		new Setting(containerEl)
			.setName(t("settings.openInBrowser"))
			.setDesc(t("settings.openInBrowserDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.openInBrowser)
					.onChange(async (v) => {
						this.plugin.settings.openInBrowser = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t("settings.maxContextMenuItems"))
			.setDesc(t("settings.maxContextMenuItemsDesc"))
			.addDropdown((dd) => {
				for (let i = 1; i <= 10; i++)
					dd.addOption(String(i), String(i));
				dd.setValue(
					String(this.plugin.settings.maxContextMenuItems)
				);
				dd.onChange(async (v) => {
					this.plugin.settings.maxContextMenuItems = parseInt(
						v,
						10
					);
					await this.plugin.saveSettings();
				});
			});

		// ── Sites by category ──
		const allEngines = this.plugin.settings.engines;
		const cats = this.plugin.settings.categories;

		for (const cat of cats) {
			const engines = allEngines.filter((e) => e.category === cat.id);

			// Category header
			const header = containerEl.createDiv({
				cls: "web-search-category-header",
			});
			header.createEl("h3", { text: cat.name });
			const delCatBtn = header.createDiv({
				cls: "clickable-icon web-search-category-delete",
			});
			setIcon(delCatBtn, "x");
			delCatBtn.addEventListener("click", async () => {
				if (engines.length > 0) {
					new Notice(t("notice.categoryNotEmpty"));
					return;
				}
				this.plugin.settings.categories =
					this.plugin.settings.categories.filter(
						(c) => c.id !== cat.id
					);
				await this.plugin.saveSettings();
				this.display();
			});

			// Engine list
			const list = containerEl.createDiv({
				cls: "web-search-engine-list",
			});
			for (const engine of engines) {
				const absIndex = allEngines.indexOf(engine);
				this.renderEngineRow(list, engine, absIndex);
			}
			this.setupListDragListeners(list);
		}

		// ── Bottom actions ──
		const actions = containerEl.createDiv({
			cls: "web-search-bottom-actions",
		});

		const addSiteBtn = actions.createEl("button", {
			text: t("settings.addSite"),
			cls: "mod-cta",
		});
		addSiteBtn.addEventListener("click", () => {
			new SiteEditModal(
				this.app,
				null,
				this.plugin.settings.categories,
				async (created) => {
					this.plugin.settings.engines.push(created);
					await this.plugin.saveSettings();
					this.display();
				}
			).open();
		});

		const addCatBtn = actions.createEl("button", {
			text: t("settings.addCategory"),
		});
		addCatBtn.addEventListener("click", () => {
			new AddCategoryModal(this.app, async (name) => {
				this.plugin.settings.categories.push({
					id: "cat-" + Date.now().toString(36),
					name,
				});
				await this.plugin.saveSettings();
				this.display();
			}).open();
		});

		if (this.plugin.settings.deletedPresetIds.length > 0) {
			const restoreBtn = actions.createEl("button", {
				text: t("settings.restorePresets"),
			});
			restoreBtn.addEventListener("click", () => {
				new RestorePresetsModal(
					this.app,
					this.plugin,
					async () => this.display()
				).open();
			});
		}
	}

	// ── Engine row ──

	private renderEngineRow(
		listEl: HTMLElement,
		engine: SearchEngine,
		index: number
	): void {
		const row = listEl.createDiv({ cls: "web-search-engine-item" });
		row.draggable = true;
		row.dataset.index = String(index);

		// Drag handle
		const handle = row.createDiv({
			cls: "web-search-engine-drag-handle",
		});
		setIcon(handle, "grip-vertical");

		// Icon
		const iconWrap = row.createDiv({ cls: "web-search-engine-favicon" });
		renderEngineIcon(iconWrap, engine);

		// Info
		const info = row.createDiv({ cls: "web-search-engine-info" });
		info.createDiv({ cls: "web-search-engine-name", text: engine.name });
		info.createDiv({
			cls: "web-search-engine-alias",
			text: `@${engine.id}`,
		});

		// Actions
		const acts = row.createDiv({ cls: "web-search-engine-actions" });

		const editBtn = acts.createDiv({ cls: "clickable-icon" });
		setIcon(editBtn, "pencil");
		editBtn.addEventListener("click", () => {
			new SiteEditModal(
				this.app,
				engine,
				this.plugin.settings.categories,
				async (updated) => {
					Object.assign(engine, updated);
					await this.plugin.saveSettings();
					this.display();
				}
			).open();
		});

		const delBtn = acts.createDiv({ cls: "clickable-icon" });
		setIcon(delBtn, "trash");
		delBtn.addEventListener("click", async () => {
			if (engine.isPreset) {
				this.plugin.settings.deletedPresetIds.push(engine.id);
			}
			this.plugin.settings.engines =
				this.plugin.settings.engines.filter(
					(e) => e.id !== engine.id
				);
			await this.plugin.saveSettings();
			this.display();
		});

		new ToggleComponent(acts)
			.setValue(engine.enabled)
			.onChange(async (v) => {
				engine.enabled = v;
				await this.plugin.saveSettings();
			});

		// Drag events on the row
		row.addEventListener("dragstart", (e) => {
			this.draggedIndex = index;
			this.dragSourceList = listEl;
			row.classList.add("is-dragging");
			if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
		});

		row.addEventListener("dragend", () => {
			this.draggedIndex = null;
			this.dragSourceList = null;
			row.classList.remove("is-dragging");
			listEl
				.querySelectorAll(".drag-over")
				.forEach((el) => el.classList.remove("drag-over"));
		});
	}

	// ── Drag on list container ──

	private setupListDragListeners(listEl: HTMLElement): void {
		listEl.addEventListener("dragover", (e) => {
			e.preventDefault();
			if (this.draggedIndex === null || this.dragSourceList !== listEl)
				return;
			const target = (e.target as HTMLElement).closest(
				".web-search-engine-item"
			) as HTMLElement | null;
			if (!target?.dataset.index) return;
			if (parseInt(target.dataset.index) === this.draggedIndex) return;
			listEl
				.querySelectorAll(".drag-over")
				.forEach((el) => el.classList.remove("drag-over"));
			target.classList.add("drag-over");
		});

		listEl.addEventListener("dragleave", (e) => {
			if (!listEl.contains(e.relatedTarget as Node))
				listEl
					.querySelectorAll(".drag-over")
					.forEach((el) => el.classList.remove("drag-over"));
		});

		listEl.addEventListener("drop", async (e) => {
			e.preventDefault();
			listEl
				.querySelectorAll(".drag-over")
				.forEach((el) => el.classList.remove("drag-over"));
			if (this.draggedIndex === null || this.dragSourceList !== listEl)
				return;
			const target = (e.target as HTMLElement).closest(
				".web-search-engine-item"
			) as HTMLElement | null;
			if (!target?.dataset.index) return;
			const targetIndex = parseInt(target.dataset.index);
			if (targetIndex === this.draggedIndex) return;

			const engines = this.plugin.settings.engines;
			const [dragged] = engines.splice(this.draggedIndex, 1);
			const insertAt =
				this.draggedIndex < targetIndex
					? targetIndex - 1
					: targetIndex;
			engines.splice(insertAt, 0, dragged);

			this.draggedIndex = null;
			this.dragSourceList = null;
			await this.plugin.saveSettings();
			this.display();
		});
	}
}

// ── Site edit modal ────────────────────────────────────────────

class SiteEditModal extends Modal {
	private engine: SearchEngine | null;
	private onSubmit: (engine: SearchEngine) => void;
	private categories: SiteCategory[];

	private nameValue: string;
	private urlValue: string;
	private iconTypeValue: IconType;
	private iconValue: string;
	private customIconValue: string | undefined;
	private categoryValue: string;

	private iconOptionsEl!: HTMLElement;

	constructor(
		app: App,
		engine: SearchEngine | null,
		categories: SiteCategory[],
		onSubmit: (engine: SearchEngine) => void
	) {
		super(app);
		this.engine = engine;
		this.onSubmit = onSubmit;
		this.categories = categories;
		this.nameValue = engine?.name ?? "";
		this.urlValue =
			engine?.urlTemplate ?? "https://example.com/search?q={{query}}";
		this.iconTypeValue = engine?.iconType ?? "favicon";
		this.iconValue = engine?.icon ?? "search";
		this.customIconValue = engine?.customIcon;
		this.categoryValue =
			engine?.category ?? categories[0]?.id ?? "search";
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", {
			text: this.engine ? t("modal.editSite") : t("modal.addSite"),
		});

		new Setting(contentEl)
			.setName(t("modal.name"))
			.addText((text) =>
				text.setValue(this.nameValue).onChange((v) => {
					this.nameValue = v;
				})
			);

		new Setting(contentEl)
			.setName(t("modal.category"))
			.addDropdown((dd) => {
				for (const cat of this.categories)
					dd.addOption(cat.id, cat.name);
				dd.setValue(this.categoryValue);
				dd.onChange((v) => {
					this.categoryValue = v;
				});
			});

		new Setting(contentEl)
			.setName(t("modal.iconType"))
			.addDropdown((dd) => {
				dd.addOption("favicon", t("modal.iconTypeFavicon"));
				dd.addOption("lucide", t("modal.iconTypeLucide"));
				dd.addOption("custom", t("modal.iconTypeCustom"));
				dd.setValue(this.iconTypeValue);
				dd.onChange((v) => {
					this.iconTypeValue = v as IconType;
					this.renderIconOptions();
				});
			});

		this.iconOptionsEl = contentEl.createDiv();
		this.renderIconOptions();

		new Setting(contentEl)
			.setName(t("modal.urlTemplate"))
			.setDesc(t("modal.urlTemplateDesc"))
			.addText((text) =>
				text
					.setPlaceholder("https://example.com/search?q={{query}}")
					.setValue(this.urlValue)
					.onChange((v) => {
						this.urlValue = v;
					})
			);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText(t("modal.save"))
				.setCta()
				.onClick(() => {
					if (!this.nameValue.trim() || !this.urlValue.trim())
						return;
					const result: SearchEngine = {
						id:
							this.engine?.id ??
							"custom-" + Date.now().toString(36),
						name: this.nameValue.trim(),
						urlTemplate: this.urlValue.trim(),
						enabled: this.engine?.enabled ?? true,
						isPreset: this.engine?.isPreset ?? false,
						iconType: this.iconTypeValue,
						icon: this.iconValue,
						customIcon:
							this.iconTypeValue === "custom"
								? this.customIconValue
								: undefined,
						category: this.categoryValue,
					};
					this.onSubmit(result);
					this.close();
				})
		);
	}

	private renderIconOptions(): void {
		this.iconOptionsEl.empty();

		if (this.iconTypeValue === "lucide") {
			new Setting(this.iconOptionsEl)
				.setName(t("modal.icon"))
				.addDropdown((dd) => {
					for (const opt of LUCIDE_OPTIONS)
						dd.addOption(opt.value, opt.label);
					dd.setValue(this.iconValue);
					dd.onChange((v) => {
						this.iconValue = v;
					});
				});
			return;
		}

		if (this.iconTypeValue === "custom") {
			const fileInput = this.iconOptionsEl.createEl("input", {
				attr: {
					type: "file",
					accept: "image/png,image/jpeg,image/svg+xml,image/webp",
				},
			});
			fileInput.style.display = "none";

			new Setting(this.iconOptionsEl)
				.setName(t("modal.chooseFile"))
				.setDesc(t("modal.imageConstraints"))
				.addButton((btn) =>
					btn
						.setButtonText(t("modal.chooseFile"))
						.onClick(() => fileInput.click())
				);

			fileInput.addEventListener("change", async () => {
				const file = fileInput.files?.[0];
				if (!file) return;
				try {
					this.customIconValue = await processImage(file);
					this.renderIconOptions();
				} catch (e: any) {
					new Notice(String(e?.message ?? e));
				}
			});

			if (this.customIconValue) {
				const preview = this.iconOptionsEl.createDiv({
					cls: "web-search-icon-preview",
				});
				preview.createEl("img", {
					attr: { src: this.customIconValue },
				});
			}
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

// ── Add category modal ─────────────────────────────────────────

class AddCategoryModal extends Modal {
	private onSubmit: (name: string) => void;
	private nameValue = "";

	constructor(app: App, onSubmit: (name: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: t("modal.addCategory") });

		new Setting(contentEl)
			.setName(t("modal.categoryName"))
			.addText((text) =>
				text.onChange((v) => {
					this.nameValue = v;
				})
			);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText(t("modal.save"))
				.setCta()
				.onClick(() => {
					if (!this.nameValue.trim()) return;
					this.onSubmit(this.nameValue.trim());
					this.close();
				})
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

// ── Restore presets modal ──────────────────────────────────────

class RestorePresetsModal extends Modal {
	private plugin: WebSearchPlugin;
	private onDone: () => void;

	constructor(app: App, plugin: WebSearchPlugin, onDone: () => void) {
		super(app);
		this.plugin = plugin;
		this.onDone = onDone;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: t("modal.restorePresets") });

		const deleted = this.plugin.settings.deletedPresetIds;
		if (deleted.length === 0) {
			contentEl.createEl("p", { text: t("modal.noDeletedPresets") });
			return;
		}

		for (const id of [...deleted]) {
			const preset = PRESET_ENGINES.find((e) => e.id === id);
			if (!preset) continue;

			const row = contentEl.createDiv({
				cls: "web-search-restore-row",
			});

			const iconWrap = row.createDiv({
				cls: "web-search-engine-favicon",
			});
			renderEngineIcon(iconWrap, preset);

			const info = row.createDiv({ cls: "web-search-engine-info" });
			info.createDiv({
				cls: "web-search-engine-name",
				text: preset.name,
			});
			info.createDiv({
				cls: "web-search-engine-alias",
				text: preset.urlTemplate,
			});

			const btn = row.createEl("button", {
				text: t("modal.restore"),
			});
			btn.addEventListener("click", async () => {
				// Ensure category exists
				const cats = this.plugin.settings.categories;
				if (!cats.find((c) => c.id === preset.category)) {
					cats.push({
						id: preset.category,
						name: getDefaultCategoryName(preset.category),
					});
				}
				this.plugin.settings.engines.push({ ...preset });
				this.plugin.settings.deletedPresetIds =
					this.plugin.settings.deletedPresetIds.filter(
						(i) => i !== id
					);
				await this.plugin.saveSettings();
				this.onOpen();
				this.onDone();
			});
		}
	}

	onClose(): void {
		this.contentEl.empty();
		this.onDone();
	}
}
