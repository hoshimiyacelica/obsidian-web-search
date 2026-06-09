import assert from "node:assert/strict";
import test from "node:test";
import { isSafeCustomIconDataUrl } from "../src/icon-data.ts";
import {
	buildSearchUrl,
	getFaviconUrl,
	validateSearchUrlTemplate,
} from "../src/search-url.ts";
import { parseSavedSettings } from "../src/settings-data.ts";

test("buildSearchUrl encodes the query and replaces every placeholder", () => {
	assert.equal(
		buildSearchUrl(
			"https://example.com/search?q={{query}}&copy={{query}}",
			"Obsidian security",
		),
		"https://example.com/search?q=Obsidian%20security&copy=Obsidian%20security",
	);
});

test("validateSearchUrlTemplate accepts HTTPS templates", () => {
	assert.equal(
		validateSearchUrlTemplate("https://example.com/search?q={{query}}"),
		null,
	);
});

test("validateSearchUrlTemplate rejects missing placeholders", () => {
	assert.equal(
		validateSearchUrlTemplate("https://example.com/search"),
		"missing-placeholder",
	);
});

test("validateSearchUrlTemplate rejects non-HTTPS schemes", () => {
	for (const template of [
		"http://example.com/?q={{query}}",
		"javascript:alert({{query}})",
		"data:text/html,{{query}}",
		"file:///tmp/{{query}}",
	]) {
		assert.equal(validateSearchUrlTemplate(template), "unsupported-protocol");
		assert.equal(buildSearchUrl(template, "test"), null);
	}
});

test("validateSearchUrlTemplate rejects malformed URLs", () => {
	assert.equal(validateSearchUrlTemplate("not a URL {{query}}"), "invalid-url");
});

test("getFaviconUrl uses the configured site's HTTPS origin", () => {
	assert.equal(
		getFaviconUrl("https://example.com/search?q={{query}}"),
		"https://example.com/favicon.ico",
	);
	assert.equal(getFaviconUrl("javascript:alert({{query}})"), null);
});

test("isSafeCustomIconDataUrl only accepts raster image data URLs", () => {
	for (const value of [
		"data:image/png;base64,AAAA",
		"data:image/jpeg;base64,AAAA",
		"data:image/webp;base64,AAAA",
	]) {
		assert.equal(isSafeCustomIconDataUrl(value), true);
	}

	for (const value of [
		"data:image/svg+xml;base64,AAAA",
		"data:text/html;base64,AAAA",
		"https://example.com/icon.png",
		"javascript:alert(1)",
		"",
	]) {
		assert.equal(isSafeCustomIconDataUrl(value), false);
	}
});

test("parseSavedSettings accepts valid fields and rejects malformed entries", () => {
	assert.deepEqual(
		parseSavedSettings({
			maxContextMenuItems: 3,
			deletedPresetIds: ["google", 42],
			categories: [
				{ id: "search", name: "Search" },
				{ id: 42, name: "Invalid" },
			],
			engines: [
				{
					id: "example",
					name: "Example",
					urlTemplate: "https://example.com/?q={{query}}",
					enabled: true,
					isPreset: false,
					iconType: "lucide",
					icon: "search",
					category: "search",
				},
				{ id: "invalid" },
			],
		}),
		{
			maxContextMenuItems: 3,
			deletedPresetIds: ["google"],
			categories: [{ id: "search", name: "Search" }],
			engines: [
				{
					id: "example",
					name: "Example",
					urlTemplate: "https://example.com/?q={{query}}",
					enabled: true,
					isPreset: false,
					iconType: "lucide",
					icon: "search",
					category: "search",
				},
			],
		},
	);
});

test("parseSavedSettings returns an empty object for non-object data", () => {
	assert.deepEqual(parseSavedSettings("invalid"), {});
	assert.deepEqual(parseSavedSettings(null), {});
});
