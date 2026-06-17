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
import { isSafeCustomIconDataUrl } from "./icon-data";
import {
	getFaviconUrl,
	validateSearchUrlTemplate,
	type SearchUrlValidationError,
} from "./search-url";
import {
	DEFAULT_SETTINGS,
	PRESET_ENGINES,
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
const SUPPORTED_IMAGE_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
]);

// ── Image processing ───────────────────────────────────────────

function processImage(file: File, doc: Document): Promise<string> {
	if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
		return Promise.reject(new Error(t("notice.unsupportedImageType")));
	}
	if (file.size > MAX_FILE_BYTES) {
		return Promise.reject(new Error(t("notice.imageTooLarge")));
	}
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = reject;

		reader.onload = () => {
			if (typeof reader.result !== "string") {
				reject(new Error(t("notice.invalidImage")));
				return;
			}

			const img = doc.createElement("img");
			img.onload = () => {
				let w = img.width;
				let h = img.height;
				if (w > MAX_ICON_PX || h > MAX_ICON_PX) {
					const scale = MAX_ICON_PX / Math.max(w, h);
					w = Math.round(w * scale);
					h = Math.round(h * scale);
				}
				const canvas = doc.createElement("canvas");
				canvas.width = w;
				canvas.height = h;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error(t("notice.invalidImage")));
					return;
				}
				ctx.drawImage(img, 0, 0, w, h);
				resolve(canvas.toDataURL("image/png"));
			};
			img.onerror = () => reject(new Error(t("notice.invalidImage")));
			img.src = reader.result;
		};
		reader.readAsDataURL(file);
	});
}

function getUrlValidationMessage(error: SearchUrlValidationError): string {
	switch (error) {
		case "missing-placeholder":
			return t("notice.missingQueryPlaceholder");
		case "unsupported-protocol":
			return t("notice.httpsRequired");
		case "invalid-url":
			return t("notice.invalidUrlTemplate");
	}
}

// ── Icon rendering helper ──────────────────────────────────────

function renderEngineIcon(container: HTMLElement, engine: SearchEngine): void {
	if (
		engine.iconType === "custom" &&
		engine.customIcon &&
		isSafeCustomIconDataUrl(engine.customIcon)
	) {
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
	private collapsedCategories: Set<string> = new Set();

	constructor(app: App, plugin: WebSearchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("web-search-settings");

		const settingsPanel = containerEl.createDiv({
			cls: "web-search-panel web-search-settings-panel",
		});

		const contextMenuSetting = new Setting(settingsPanel)
			.setName(t("settings.maxContextMenuItems"))
			.setDesc(t("settings.maxContextMenuItemsDesc"))
			.addDropdown((dd) => {
				for (let i = 1; i <= 10; i++) dd.addOption(String(i), String(i));
				dd.setValue(String(this.plugin.settings.maxContextMenuItems));
				dd.onChange(async (v) => {
					this.plugin.settings.maxContextMenuItems = parseInt(v, 10);
					await this.plugin.saveSettings();
				});
			});
		contextMenuSetting.settingEl.addClass("web-search-setting-row");

		// ── Sites by category ──
		const allEngines = this.plugin.settings.engines;
		const cats = this.plugin.settings.categories;
		const sitesPanel = containerEl.createDiv({
			cls: "web-search-panel web-search-sites-panel",
		});
		const toolbar = sitesPanel.createDiv({ cls: "web-search-sites-toolbar" });
		const toolbarTitle = toolbar.createDiv({ cls: "web-search-sites-title" });
		const toolbarIcon = toolbarTitle.createSpan({
			cls: "web-search-sites-title-icon",
		});
		setIcon(toolbarIcon, "search");
		toolbarTitle.createSpan({ text: t("settings.searchSites") });

		const actions = toolbar.createDiv({
			cls: "web-search-top-actions",
		});
		this.createActionButton(
			actions,
			"plus",
			t("settings.addSite"),
			"mod-cta",
			() => {
				new SiteEditModal(
					this.app,
					null,
					this.plugin.settings.categories,
					(created) => {
						void this.addEngine(created);
					},
				).open();
			},
		);
		this.createActionButton(
			actions,
			"folder-plus",
			t("settings.addCategory"),
			"",
			() => {
				new AddCategoryModal(this.app, (name) => {
					void this.addCategory(name);
				}).open();
			},
		);
		if (this.plugin.settings.deletedPresetIds.length > 0) {
			this.createActionButton(
				actions,
				"rotate-ccw",
				t("settings.restorePresets"),
				"",
				() => {
					new RestorePresetsModal(this.app, this.plugin, () =>
						this.display(),
					).open();
				},
			);
		}

		for (const cat of cats) {
			const engines = allEngines.filter((e) => e.category === cat.id);

			const collapsed = this.collapsedCategories.has(cat.id);
			const section = sitesPanel.createEl("section", {
				cls: "web-search-category-section",
			});

			// Category header
			const header = section.createDiv({
				cls: "web-search-category-header",
			});

			const chevron = header.createDiv({
				cls: "clickable-icon web-search-category-chevron",
			});
			setIcon(chevron, collapsed ? "chevron-right" : "chevron-down");

			const title = header.createDiv({
				cls: "web-search-category-title",
				text: cat.name,
			});

			if (engines.length > 0) {
				title.createEl("span", {
					cls: "web-search-category-count",
					text: String(engines.length),
				});
			}

			const delCatBtn = header.createDiv({
				cls: "clickable-icon web-search-category-delete",
			});
			delCatBtn.ariaLabel = t("modal.delete");
			delCatBtn.title = t("modal.delete");
			setIcon(delCatBtn, "x");
			delCatBtn.addEventListener("click", () => {
				new DeleteCategoryModal(
					this.app,
					this.plugin,
					cat,
					engines.length,
					() => this.display(),
				).open();
			});

			// Engine list
			const list = section.createDiv({
				cls: "web-search-engine-list",
			});
			list.toggleClass("is-collapsed", collapsed);

			for (const engine of engines) {
				const absIndex = allEngines.indexOf(engine);
				this.renderEngineRow(list, engine, absIndex);
			}
			this.setupListDragListeners(list);

			// Toggle collapse
			const toggleCollapse = () => {
				if (this.collapsedCategories.has(cat.id)) {
					this.collapsedCategories.delete(cat.id);
				} else {
					this.collapsedCategories.add(cat.id);
				}
				const isNowCollapsed = this.collapsedCategories.has(cat.id);
				list.toggleClass("is-collapsed", isNowCollapsed);
				chevron.empty();
				setIcon(chevron, isNowCollapsed ? "chevron-right" : "chevron-down");
			};
			chevron.addEventListener("click", toggleCollapse);
			title.addEventListener("click", toggleCollapse);
		}

		// ── Reset all ──
		const dangerPanel = containerEl.createDiv({
			cls: "web-search-panel web-search-danger-panel",
		});
		const resetSetting = new Setting(dangerPanel)
			.setName(t("settings.resetAll"))
			.setDesc(t("settings.resetAllDesc"))
			.addButton((btn) =>
				btn
					.setButtonText(t("settings.resetAll"))
					.setWarning()
					.onClick(() => {
						new ResetAllModal(this.app, this.plugin, () =>
							this.display(),
						).open();
					}),
			);
		resetSetting.settingEl.addClass("web-search-setting-row");
	}

	private createActionButton(
		container: HTMLElement,
		icon: string,
		label: string,
		extraClass: string,
		onClick: () => void,
	): HTMLButtonElement {
		const button = container.createEl("button", {
			cls: ["web-search-action-button", extraClass].filter(Boolean).join(" "),
			attr: { type: "button", "aria-label": label, title: label },
		});
		const iconEl = button.createSpan({ cls: "web-search-action-button-icon" });
		setIcon(iconEl, icon);
		button.createSpan({ cls: "web-search-action-button-label", text: label });
		button.addEventListener("click", onClick);
		return button;
	}

	private async addEngine(engine: SearchEngine): Promise<void> {
		this.plugin.settings.engines.push(engine);
		await this.plugin.saveSettings();
		this.display();
	}

	private async addCategory(name: string): Promise<void> {
		this.plugin.settings.categories.push({
			id: "cat-" + Date.now().toString(36),
			name,
		});
		await this.plugin.saveSettings();
		this.display();
	}

	// ── Engine row ──

	private renderEngineRow(
		listEl: HTMLElement,
		engine: SearchEngine,
		index: number,
	): void {
		const row = listEl.createDiv({ cls: "web-search-engine-item" });
		row.draggable = true;
		row.dataset.index = String(index);

		// Drag handle
		const handle = row.createDiv({
			cls: "web-search-engine-drag-handle",
			attr: {
				"aria-label": t("settings.dragSite"),
				title: t("settings.dragSite"),
			},
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
			text: engine.urlTemplate.replace(/^https?:\/\//, ""),
		});

		// Actions
		const acts = row.createDiv({ cls: "web-search-engine-actions" });

		const editBtn = acts.createDiv({ cls: "clickable-icon" });
		editBtn.ariaLabel = t("modal.editSite");
		editBtn.title = t("modal.editSite");
		setIcon(editBtn, "pencil");
		editBtn.addEventListener("click", () => {
			new SiteEditModal(
				this.app,
				engine,
				this.plugin.settings.categories,
				(updated) => {
					void this.updateEngine(engine, updated);
				},
			).open();
		});

		const delBtn = acts.createDiv({ cls: "clickable-icon" });
		delBtn.ariaLabel = t("modal.delete");
		delBtn.title = t("modal.delete");
		setIcon(delBtn, "trash");
		delBtn.addEventListener("click", () => {
			void this.deleteEngine(engine);
		});

		new ToggleComponent(acts).setValue(engine.enabled).onChange((enabled) => {
			void this.setEngineEnabled(engine, enabled);
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
			if (this.draggedIndex === null || this.dragSourceList !== listEl) return;
			const targetNode = e.targetNode;
			if (!targetNode?.instanceOf(HTMLElement)) return;
			const target = targetNode.closest(".web-search-engine-item");
			if (!target?.instanceOf(HTMLElement)) return;
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

		listEl.addEventListener("drop", (e) => {
			e.preventDefault();
			void this.handleDrop(e, listEl);
		});
	}

	private async updateEngine(
		original: SearchEngine,
		updated: SearchEngine,
	): Promise<void> {
		const engineIndex = this.plugin.settings.engines.indexOf(original);
		if (engineIndex === -1) return;
		this.plugin.settings.engines[engineIndex] = updated;
		await this.plugin.saveSettings();
		this.display();
	}

	private async deleteEngine(engine: SearchEngine): Promise<void> {
		if (engine.isPreset) {
			this.plugin.settings.deletedPresetIds.push(engine.id);
		}
		this.plugin.settings.engines = this.plugin.settings.engines.filter(
			(candidate) => candidate.id !== engine.id,
		);
		await this.plugin.saveSettings();
		this.display();
	}

	private async setEngineEnabled(
		engine: SearchEngine,
		enabled: boolean,
	): Promise<void> {
		engine.enabled = enabled;
		await this.plugin.saveSettings();
	}

	private async handleDrop(e: DragEvent, listEl: HTMLElement): Promise<void> {
		listEl
			.querySelectorAll(".drag-over")
			.forEach((el) => el.classList.remove("drag-over"));
		if (this.draggedIndex === null || this.dragSourceList !== listEl) return;

		const targetNode = e.targetNode;
		if (!targetNode?.instanceOf(HTMLElement)) return;
		const target = targetNode.closest(".web-search-engine-item");
		if (!target?.instanceOf(HTMLElement) || !target.dataset.index) return;

		const targetIndex = parseInt(target.dataset.index);
		if (targetIndex === this.draggedIndex) return;

		const engines = this.plugin.settings.engines;
		const [dragged] = engines.splice(this.draggedIndex, 1);
		if (!dragged) return;
		const insertAt =
			this.draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
		engines.splice(insertAt, 0, dragged);

		this.draggedIndex = null;
		this.dragSourceList = null;
		await this.plugin.saveSettings();
		this.display();
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
		onSubmit: (engine: SearchEngine) => void,
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
		this.categoryValue = engine?.category ?? categories[0]?.id ?? "search";
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		this.setTitle(this.engine ? t("modal.editSite") : t("modal.addSite"));

		new Setting(contentEl).setName(t("modal.name")).addText((text) =>
			text.setValue(this.nameValue).onChange((v) => {
				this.nameValue = v;
			}),
		);

		new Setting(contentEl).setName(t("modal.category")).addDropdown((dd) => {
			for (const cat of this.categories) dd.addOption(cat.id, cat.name);
			dd.setValue(this.categoryValue);
			dd.onChange((v) => {
				this.categoryValue = v;
			});
		});

		new Setting(contentEl).setName(t("modal.iconType")).addDropdown((dd) => {
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
					}),
			);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText(t("modal.save"))
				.setCta()
				.onClick(() => {
					if (!this.nameValue.trim() || !this.urlValue.trim()) return;
					const urlError = validateSearchUrlTemplate(this.urlValue.trim());
					if (urlError) {
						new Notice(getUrlValidationMessage(urlError));
						return;
					}
					const result: SearchEngine = {
						id: this.engine?.id ?? "custom-" + Date.now().toString(36),
						name: this.nameValue.trim(),
						urlTemplate: this.urlValue.trim(),
						enabled: this.engine?.enabled ?? true,
						isPreset: this.engine?.isPreset ?? false,
						iconType: this.iconTypeValue,
						icon: this.iconValue,
						customIcon:
							this.iconTypeValue === "custom" &&
							this.customIconValue &&
							isSafeCustomIconDataUrl(this.customIconValue)
								? this.customIconValue
								: undefined,
						category: this.categoryValue,
					};
					this.onSubmit(result);
					this.close();
				}),
		);
	}

	private renderIconOptions(): void {
		this.iconOptionsEl.empty();

		if (this.iconTypeValue === "lucide") {
			new Setting(this.iconOptionsEl)
				.setName(t("modal.icon"))
				.addDropdown((dd) => {
					for (const opt of LUCIDE_OPTIONS) dd.addOption(opt.value, opt.label);
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
					accept: "image/png,image/jpeg,image/webp",
				},
				cls: "web-search-file-input",
			});

			new Setting(this.iconOptionsEl)
				.setName(t("modal.chooseFile"))
				.setDesc(t("modal.imageConstraints"))
				.addButton((btn) =>
					btn
						.setButtonText(t("modal.chooseFile"))
						.onClick(() => fileInput.click()),
				);

			fileInput.addEventListener("change", () => {
				void this.loadCustomIcon(fileInput);
			});

			if (
				this.customIconValue &&
				isSafeCustomIconDataUrl(this.customIconValue)
			) {
				const preview = this.iconOptionsEl.createDiv({
					cls: "web-search-icon-preview",
				});
				preview.createEl("img", {
					attr: { src: this.customIconValue },
				});
			}
		}
	}

	private async loadCustomIcon(fileInput: HTMLInputElement): Promise<void> {
		const file = fileInput.files?.[0];
		if (!file) return;

		try {
			this.customIconValue = await processImage(file, this.contentEl.doc);
			this.renderIconOptions();
		} catch (error: unknown) {
			new Notice(
				error instanceof Error ? error.message : t("notice.invalidImage"),
			);
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
		this.setTitle(t("modal.addCategory"));

		new Setting(contentEl).setName(t("modal.categoryName")).addText((text) =>
			text.onChange((v) => {
				this.nameValue = v;
			}),
		);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText(t("modal.save"))
				.setCta()
				.onClick(() => {
					if (!this.nameValue.trim()) return;
					this.onSubmit(this.nameValue.trim());
					this.close();
				}),
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

// ── Delete category modal ─────────────────────────────────────

class DeleteCategoryModal extends Modal {
	private plugin: WebSearchPlugin;
	private category: SiteCategory;
	private siteCount: number;
	private onDone: () => void;

	constructor(
		app: App,
		plugin: WebSearchPlugin,
		category: SiteCategory,
		siteCount: number,
		onDone: () => void,
	) {
		super(app);
		this.plugin = plugin;
		this.category = category;
		this.siteCount = siteCount;
		this.onDone = onDone;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.setTitle(t("modal.deleteCategoryConfirm"));

		const message =
			this.siteCount > 0
				? t(
						"modal.deleteCategoryWithSites",
						this.category.name,
						String(this.siteCount),
					)
				: t("modal.deleteCategoryEmpty", this.category.name);
		contentEl.createEl("p", { text: message });

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText(t("modal.delete"))
					.setWarning()
					.onClick(async () => {
						const engines = this.plugin.settings.engines;
						for (const e of engines) {
							if (e.category === this.category.id && e.isPreset) {
								this.plugin.settings.deletedPresetIds.push(e.id);
							}
						}
						this.plugin.settings.engines = engines.filter(
							(e) => e.category !== this.category.id,
						);
						this.plugin.settings.categories =
							this.plugin.settings.categories.filter(
								(c) => c.id !== this.category.id,
							);
						await this.plugin.saveSettings();
						this.close();
						this.onDone();
					}),
			)
			.addButton((btn) =>
				btn.setButtonText(t("modal.cancel")).onClick(() => this.close()),
			);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

// ── Reset all modal ───────────────────────────────────────────

class ResetAllModal extends Modal {
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
		this.setTitle(t("modal.resetAllConfirm"));
		contentEl.createEl("p", { text: t("modal.resetAllMessage") });

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText(t("modal.reset"))
					.setWarning()
					.onClick(async () => {
						this.plugin.settings = {
							...DEFAULT_SETTINGS,
							engines: DEFAULT_SETTINGS.engines.map((e) => ({
								...e,
							})),
							categories: DEFAULT_SETTINGS.categories.map((c) => ({
								...c,
								name: getDefaultCategoryName(c.id),
							})),
						};
						await this.plugin.saveSettings();
						this.close();
						this.onDone();
					}),
			)
			.addButton((btn) =>
				btn.setButtonText(t("modal.cancel")).onClick(() => this.close()),
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
		this.setTitle(t("modal.restorePresets"));

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
			btn.addEventListener("click", () => {
				void this.restorePreset(id, preset);
			});
		}
	}

	private async restorePreset(id: string, preset: SearchEngine): Promise<void> {
		const categories = this.plugin.settings.categories;
		if (!categories.find((category) => category.id === preset.category)) {
			categories.push({
				id: preset.category,
				name: getDefaultCategoryName(preset.category),
			});
		}
		this.plugin.settings.engines.push({ ...preset });
		this.plugin.settings.deletedPresetIds =
			this.plugin.settings.deletedPresetIds.filter(
				(deletedId) => deletedId !== id,
			);
		await this.plugin.saveSettings();
		this.onOpen();
		this.onDone();
	}

	onClose(): void {
		this.contentEl.empty();
		this.onDone();
	}
}
