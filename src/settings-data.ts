import { isSafeCustomIconDataUrl } from "./icon-data.ts";
import { validateSearchUrlTemplate } from "./search-url.ts";
import type {
	IconType,
	SearchEngine,
	SiteCategory,
	WebSearchSettings,
} from "./types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIconType(value: unknown): value is IconType {
	return value === "favicon" || value === "lucide" || value === "custom";
}

function parseCategory(value: unknown): SiteCategory | null {
	if (
		!isRecord(value) ||
		typeof value.id !== "string" ||
		typeof value.name !== "string"
	) {
		return null;
	}

	return { id: value.id, name: value.name };
}

function parseEngine(value: unknown): SearchEngine | null {
	if (
		!isRecord(value) ||
		typeof value.id !== "string" ||
		typeof value.name !== "string" ||
		typeof value.urlTemplate !== "string" ||
		validateSearchUrlTemplate(value.urlTemplate) !== null ||
		typeof value.enabled !== "boolean" ||
		typeof value.isPreset !== "boolean" ||
		!isIconType(value.iconType) ||
		typeof value.icon !== "string" ||
		typeof value.category !== "string"
	) {
		return null;
	}

	const customIcon =
		typeof value.customIcon === "string" &&
		isSafeCustomIconDataUrl(value.customIcon)
			? value.customIcon
			: undefined;

	const engine: SearchEngine = {
		id: value.id,
		name: value.name,
		urlTemplate: value.urlTemplate,
		enabled: value.enabled,
		isPreset: value.isPreset,
		iconType: value.iconType,
		icon: value.icon,
		category: value.category,
	};

	if (customIcon) {
		engine.customIcon = customIcon;
	}

	return engine;
}

export function parseSavedSettings(value: unknown): Partial<WebSearchSettings> {
	if (!isRecord(value)) {
		return {};
	}

	const settings: Partial<WebSearchSettings> = {};

	if (
		typeof value.maxContextMenuItems === "number" &&
		Number.isInteger(value.maxContextMenuItems) &&
		value.maxContextMenuItems >= 1 &&
		value.maxContextMenuItems <= 10
	) {
		settings.maxContextMenuItems = value.maxContextMenuItems;
	}

	if (Array.isArray(value.deletedPresetIds)) {
		settings.deletedPresetIds = value.deletedPresetIds.filter(
			(id): id is string => typeof id === "string",
		);
	}

	if (Array.isArray(value.categories)) {
		settings.categories = value.categories
			.map(parseCategory)
			.filter((category): category is SiteCategory => category !== null);
	}

	if (Array.isArray(value.engines)) {
		settings.engines = value.engines
			.map(parseEngine)
			.filter((engine): engine is SearchEngine => engine !== null);
	}

	return settings;
}
