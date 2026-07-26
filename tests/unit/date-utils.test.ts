/**
 * date-utils.ts 单元测试
 * 测试：formatDateToYYYYMMDD, formatDateI18n, formatDateTimeToYYYYMMDDHHmm
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatDateToYYYYMMDD } from "@utils/date-utils";

// ========== formatDateToYYYYMMDD (纯函数，无外部依赖) ==========
describe("formatDateToYYYYMMDD", () => {
	it("将 Date 转为 YYYY-MM-DD", () => {
		const date = new Date("2025-06-15T12:00:00Z");
		expect(formatDateToYYYYMMDD(date)).toBe("2025-06-15");
	});

	it("处理UTC边界", () => {
		const date = new Date("2024-01-01T00:00:00Z");
		expect(formatDateToYYYYMMDD(date)).toBe("2024-01-01");
	});

	it("处理12月31日", () => {
		const date = new Date("2023-12-31T23:59:59Z");
		expect(formatDateToYYYYMMDD(date)).toBe("2023-12-31");
	});
});

// ========== formatDateI18n (依赖 siteConfig.lang) ==========
describe("formatDateI18n", () => {
	beforeEach(() => {
		// 重置 siteConfig 的 lang 到默认值，避免被其他测试影响
		vi.resetModules();
	});

	it("zh_CN 格式应显示中文日期", async () => {
		// 动态 mock siteConfig，测试 i18n 格式
		vi.doMock("@/config", () => ({
			siteConfig: {
				lang: "zh_CN",
				timezone: "",
			},
		}));

		const { formatDateI18n } = await import("@utils/date-utils");
		const date = new Date("2025-06-15T12:00:00Z");
		const result = formatDateI18n(date);
		// 中文日期应包含"2025年6月15日"或类似格式
		expect(result).toMatch(/2025/);
		expect(result).toMatch(/6月|六月/);
	});

	it("en 格式应显示英文日期", async () => {
		vi.doMock("@/config", () => ({
			siteConfig: {
				lang: "en",
				timezone: "",
			},
		}));

		const { formatDateI18n } = await import("@utils/date-utils");
		const date = new Date("2025-06-15T12:00:00Z");
		const result = formatDateI18n(date);
		// 英文日期应包含 June
		expect(result).toMatch(/June/);
	});

	it("带时间参数应包含时间部分", async () => {
		vi.doMock("@/config", () => ({
			siteConfig: {
				lang: "en",
				timezone: "",
			},
		}));

		const { formatDateI18n } = await import("@utils/date-utils");
		const date = new Date("2025-06-15T14:30:00Z");
		const result = formatDateI18n(date, true);
		expect(result).toMatch(/June/);
		// 时间部分格式因 locale 而异，确保包含具体时间
		expect(result).toMatch(/\d{1,2}:\d{2}/);
	});
});

// ========== formatDateTimeToYYYYMMDDHHmm ==========
describe("formatDateTimeToYYYYMMDDHHmm", () => {
	it("应返回 YYYY-MM-DD HH:mm 格式", async () => {
		vi.doMock("@/config", () => ({
			siteConfig: {
				timezone: "",
			},
		}));

		const { formatDateTimeToYYYYMMDDHHmm } = await import("@utils/date-utils");
		const date = new Date("2025-06-15T14:30:00Z");
		const result = formatDateTimeToYYYYMMDDHHmm(date);
		// "en-CA" locale 的 formatToParts 输出格式
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
	});
});
