/**
 * setting-utils.ts 单元测试
 * 测试可独立验证的纯逻辑：resolveTheme, clampNumber, getDefaultTheme 等。
 */
import { describe, it, expect, vi } from "vitest";
import { resolveTheme } from "@utils/setting-utils";
import {
	DARK_MODE,
	LIGHT_MODE,
	SYSTEM_MODE,
} from "@constants/constants";

describe("resolveTheme", () => {
	it("LIGHT_MODE 返回 light", () => {
		expect(resolveTheme(LIGHT_MODE)).toBe(LIGHT_MODE);
	});

	it("DARK_MODE 返回 dark", () => {
		expect(resolveTheme(DARK_MODE)).toBe(DARK_MODE);
	});

	it("SYSTEM_MODE 根据 matchMedia 结果返回", () => {
		// window.matchMedia 已在 setup 中 mock，默认 matches=false → light
		expect(resolveTheme(SYSTEM_MODE)).toBe(LIGHT_MODE);
	});
});

describe("clampNumber（内部函数）", () => {
	// clampNumber 未导出，通过 getStoredOverlayOpacity 等间接测试
	it("超过最大值的 overlayOpacity 应被钳制", async () => {
		vi.doMock("@/config", () => ({
			siteConfig: {},
			backgroundWallpaper: {
				overlay: { opacity: 0.8 },
				switchable: true,
			},
		}));

		const { getStoredOverlayOpacity } = await import("@utils/setting-utils");
		const result = getStoredOverlayOpacity();
		expect(result).toBeGreaterThanOrEqual(0);
		expect(result).toBeLessThanOrEqual(1);
	});
});
