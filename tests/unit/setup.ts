/**
 * Vitest 全局 setup 文件
 *
 * 为单元测试提供模拟环境，避免测试 Astro 相关模块时出错。
 */

import { vi } from "vitest";

// === Mock astro:content（使用 vi.mock 在具体测试中按需覆盖）===
vi.mock("astro:content", () => ({
	getCollection: vi.fn(),
	getEntryBySlug: vi.fn(),
	z: {},
	defineCollection: vi.fn(),
}));

// === Mock localStorage（Node 默认没有 localStorage）===
if (typeof globalThis.localStorage === "undefined") {
	const store = new Map<string, string>();
	Object.defineProperty(globalThis, "localStorage", {
		value: {
			getItem: vi.fn((key: string) => store.get(key) ?? null),
			setItem: vi.fn((key: string, value: string) => {
				store.set(key, value);
			}),
			removeItem: vi.fn((key: string) => store.delete(key)),
			clear: vi.fn(() => store.clear()),
			get length() {
				return store.size;
			},
			key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
		},
		writable: false,
	});
}

// === Mock window（部分函数依赖 window 对象）===
if (typeof globalThis.window === "undefined") {
	Object.defineProperty(globalThis, "window", {
		value: {
			matchMedia: vi.fn(() => ({
				matches: false,
				media: "",
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
			localStorage: (globalThis as any).localStorage,
			location: { href: "http://localhost:4321/", pathname: "/" },
			innerWidth: 1280,
			innerHeight: 720,
		},
		writable: false,
	});
}

// === Mock document ===
if (typeof globalThis.document === "undefined") {
	Object.defineProperty(globalThis, "document", {
		value: {
			documentElement: { classList: { contains: vi.fn() } },
			getElementById: vi.fn(),
			querySelector: vi.fn(),
			querySelectorAll: vi.fn(() => []),
			createElement: vi.fn(() => ({})),
		},
		writable: false,
	});
}
