import { moment } from "obsidian";

interface Translations {
	"context.searchWith": string;
	"command.searchSelectedText": string;
	"notice.noTextSelected": string;
	"notice.noSitesEnabled": string;
	"settings.general": string;
	"settings.openInBrowser": string;
	"settings.openInBrowserDesc": string;
	"settings.maxContextMenuItems": string;
	"settings.maxContextMenuItemsDesc": string;
	"settings.addSite": string;
	"settings.addCategory": string;
	"settings.restorePresets": string;
	"modal.editSite": string;
	"modal.addSite": string;
	"modal.addCategory": string;
	"modal.categoryName": string;
	"modal.name": string;
	"modal.icon": string;
	"modal.iconType": string;
	"modal.iconTypeFavicon": string;
	"modal.iconTypeLucide": string;
	"modal.iconTypeCustom": string;
	"modal.chooseFile": string;
	"modal.imageConstraints": string;
	"modal.category": string;
	"modal.urlTemplate": string;
	"modal.urlTemplateDesc": string;
	"modal.save": string;
	"modal.restore": string;
	"modal.restorePresets": string;
	"modal.noDeletedPresets": string;
	"modal.deleteCategoryConfirm": string;
	"modal.deleteCategoryEmpty": string;
	"modal.deleteCategoryWithSites": string;
	"modal.delete": string;
	"settings.resetAll": string;
	"settings.resetAllDesc": string;
	"modal.resetAllConfirm": string;
	"modal.resetAllMessage": string;
	"modal.reset": string;
	"modal.cancel": string;
}

const en: Translations = {
	"context.searchWith": "Search with $1",
	"command.searchSelectedText": "Search selected text on the web",
	"notice.noTextSelected": "No text selected.",
	"notice.noSitesEnabled": "No sites enabled. Enable them in settings.",
	"settings.general": "General",
	"settings.openInBrowser": "Open in browser",
	"settings.openInBrowserDesc":
		"Open search results in the default browser. When disabled, results open in an Obsidian iframe.",
	"settings.maxContextMenuItems": "Context menu items",
	"settings.maxContextMenuItemsDesc":
		"Maximum number of sites shown in the right-click menu. Sites are shown in the order listed below.",
	"settings.addSite": "Add site",
	"settings.addCategory": "Add category",
	"settings.restorePresets": "Restore presets",
	"modal.editSite": "Edit site",
	"modal.addSite": "Add site",
	"modal.addCategory": "Add category",
	"modal.categoryName": "Category name",
	"modal.name": "Name",
	"modal.icon": "Icon",
	"modal.iconType": "Icon type",
	"modal.iconTypeFavicon": "Favicon (auto)",
	"modal.iconTypeLucide": "Lucide icon",
	"modal.iconTypeCustom": "Custom image",
	"modal.chooseFile": "Choose file",
	"modal.imageConstraints": "PNG, JPEG, SVG, WebP — max 128×128",
	"modal.category": "Category",
	"modal.urlTemplate": "URL template",
	"modal.urlTemplateDesc":
		"Use {{query}} as a placeholder for the search text.",
	"modal.save": "Save",
	"modal.restore": "Restore",
	"modal.restorePresets": "Restore presets",
	"modal.noDeletedPresets": "No deleted presets to restore.",
	"modal.deleteCategoryConfirm": "Delete category",
	"modal.deleteCategoryEmpty":
		"Delete the category \"$1\"?",
	"modal.deleteCategoryWithSites":
		"Delete the category \"$1\" and its $2 site(s)? This cannot be undone.",
	"modal.delete": "Delete",
	"settings.resetAll": "Reset all settings",
	"settings.resetAllDesc":
		"Reset all settings to their default values. This cannot be undone.",
	"modal.resetAllConfirm": "Reset all settings",
	"modal.resetAllMessage":
		"Are you sure you want to reset all settings? All custom sites and categories will be lost.",
	"modal.reset": "Reset",
	"modal.cancel": "Cancel",
};

const ja: Translations = {
	"context.searchWith": "$1で検索する",
	"command.searchSelectedText": "選択テキストをウェブ検索",
	"notice.noTextSelected": "テキストが選択されていません。",
	"notice.noSitesEnabled":
		"有効なサイトがありません。設定で有効にしてください。",
	"settings.general": "一般",
	"settings.openInBrowser": "ブラウザで開く",
	"settings.openInBrowserDesc":
		"検索結果をデフォルトブラウザで開きます。無効の場合、Obsidian 内の iframe で開きます。",
	"settings.maxContextMenuItems": "コンテキストメニューの表示数",
	"settings.maxContextMenuItemsDesc":
		"右クリックメニューに表示するサイトの最大数。上から順に表示されます。",
	"settings.addSite": "サイトを追加",
	"settings.addCategory": "カテゴリを追加",
	"settings.restorePresets": "プリセットを復元",
	"modal.editSite": "サイトを編集",
	"modal.addSite": "サイトを追加",
	"modal.addCategory": "カテゴリを追加",
	"modal.categoryName": "カテゴリ名",
	"modal.name": "名前",
	"modal.icon": "アイコン",
	"modal.iconType": "アイコンの種類",
	"modal.iconTypeFavicon": "ファビコン（自動取得）",
	"modal.iconTypeLucide": "Lucide アイコン",
	"modal.iconTypeCustom": "カスタム画像",
	"modal.chooseFile": "ファイルを選択",
	"modal.imageConstraints": "PNG, JPEG, SVG, WebP — 最大 128×128",
	"modal.category": "カテゴリ",
	"modal.urlTemplate": "URL テンプレート",
	"modal.urlTemplateDesc":
		"{{query}} を検索テキストのプレースホルダーとして使用します。",
	"modal.save": "保存",
	"modal.restore": "復元",
	"modal.restorePresets": "プリセットを復元",
	"modal.noDeletedPresets": "復元可能なプリセットはありません。",
	"modal.deleteCategoryConfirm": "カテゴリを削除",
	"modal.deleteCategoryEmpty":
		"カテゴリ「$1」を削除しますか？",
	"modal.deleteCategoryWithSites":
		"カテゴリ「$1」と含まれる $2 件のサイトを削除しますか？この操作は元に戻せません。",
	"modal.delete": "削除",
	"settings.resetAll": "すべての設定をリセット",
	"settings.resetAllDesc":
		"すべての設定を初期値に戻します。この操作は元に戻せません。",
	"modal.resetAllConfirm": "すべての設定をリセット",
	"modal.resetAllMessage":
		"本当にすべての設定をリセットしますか？カスタムサイトやカテゴリはすべて失われます。",
	"modal.reset": "リセット",
	"modal.cancel": "キャンセル",
};

const translations: Record<string, Translations> = { en, ja };

const DEFAULT_CATEGORY_NAMES: Record<string, Record<string, string>> = {
	en: { search: "Search", reference: "Reference", dictionary: "Dictionary" },
	ja: { search: "検索", reference: "リファレンス", dictionary: "辞書" },
};

function getLocale(): string {
	const locale = moment.locale();
	if (locale.startsWith("ja")) return "ja";
	return "en";
}

export function t(key: keyof Translations, ...args: string[]): string {
	const locale = getLocale();
	const table = translations[locale] ?? en;
	let text = table[key] ?? en[key];
	for (let i = 0; i < args.length; i++) {
		text = text.replace(`$${i + 1}`, args[i]);
	}
	return text;
}

export function getDefaultCategoryName(id: string): string {
	const locale = getLocale();
	return DEFAULT_CATEGORY_NAMES[locale]?.[id] ?? DEFAULT_CATEGORY_NAMES.en[id] ?? id;
}
