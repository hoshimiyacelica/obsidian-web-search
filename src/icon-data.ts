const SAFE_CUSTOM_ICON_PREFIXES = [
	"data:image/png;base64,",
	"data:image/jpeg;base64,",
	"data:image/webp;base64,",
];

export function isSafeCustomIconDataUrl(value: string): boolean {
	return SAFE_CUSTOM_ICON_PREFIXES.some((prefix) => value.startsWith(prefix));
}
