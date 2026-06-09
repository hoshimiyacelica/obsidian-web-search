const QUERY_PLACEHOLDER = "{{query}}";

export type SearchUrlValidationError =
	| "missing-placeholder"
	| "invalid-url"
	| "unsupported-protocol";

function parseSearchUrlTemplate(urlTemplate: string): URL | null {
	try {
		return new URL(urlTemplate.replaceAll(QUERY_PLACEHOLDER, "test"));
	} catch {
		return null;
	}
}

export function validateSearchUrlTemplate(
	urlTemplate: string,
): SearchUrlValidationError | null {
	if (!urlTemplate.includes(QUERY_PLACEHOLDER)) {
		return "missing-placeholder";
	}

	const url = parseSearchUrlTemplate(urlTemplate);
	if (!url) {
		return "invalid-url";
	}

	if (url.protocol !== "https:") {
		return "unsupported-protocol";
	}

	return null;
}

export function buildSearchUrl(
	urlTemplate: string,
	query: string,
): string | null {
	if (validateSearchUrlTemplate(urlTemplate)) {
		return null;
	}

	return urlTemplate.replaceAll(QUERY_PLACEHOLDER, encodeURIComponent(query));
}

export function getFaviconUrl(urlTemplate: string): string | null {
	if (validateSearchUrlTemplate(urlTemplate)) {
		return null;
	}

	const url = parseSearchUrlTemplate(urlTemplate);
	return url ? new URL("/favicon.ico", url.origin).toString() : null;
}
