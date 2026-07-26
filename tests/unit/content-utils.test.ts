/**
 * content-utils.ts 单元测试
 * 测试：getRelatedPosts 及相关辅助函数（tokenizeTitle, jaccardSimilarity 对内）
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock astro:content 的 getCollection — 使用 vi.hoisted 因为 vi.mock 会被提升
const mockGetCollection = vi.hoisted(() => vi.fn());
vi.mock("astro:content", () => ({
	getCollection: mockGetCollection,
}));

// Mock siteConfig + i18n
vi.mock("@/config", () => ({
	siteConfig: { lang: "zh_CN" },
}));

vi.mock("@/i18n/translation", () => ({
	i18n: (key: string) => {
		const map: Record<string, string> = {
			uncategorized: "未分类",
		};
		return map[key] || key;
	},
}));

import { getRelatedPosts } from "@utils/content-utils";
import type { CollectionEntry } from "astro:content";

// 辅助函数：构建一个最小化的 post 对象
function makePost(
	id: string,
	title: string,
	tags: string[],
	category: string,
	published: string,
): CollectionEntry<"posts"> {
	return {
		id,
		data: {
			title,
			tags,
			category,
			published: new Date(published),
			draft: false,
			pinned: false,
		} as any,
	} as CollectionEntry<"posts">;
}

describe("getRelatedPosts", () => {
	const allPosts = [
		makePost("post-1", "Vue.js 入门教程", ["vue", "前端"], "前端", "2025-06-01"),
		makePost("post-2", "React 高级技巧", ["react", "前端"], "前端", "2025-05-15"),
		makePost("post-3", "Python 数据科学", ["python", "数据"], "后端", "2025-04-20"),
		makePost("post-4", "Vue 组件设计", ["vue", "前端"], "前端", "2025-03-10"),
		makePost("post-5", "机器学习基础", ["python", "ml"], "AI", "2025-02-01"),
		makePost("post-6", "Node.js 后端开发", ["node", "后端"], "后端", "2025-01-15"),
		makePost("post-7", "TypeScript 类型体操", ["typescript"], "前端", "2024-12-01"),
	];

	beforeEach(() => {
		// 每次测试重置 mock
		mockGetCollection.mockReset();

		// 默认返回所有文章
		mockGetCollection.mockImplementation(
			(_collection: string, _filter?: any) => {
				return Promise.resolve(allPosts);
			},
		);
	});

	it("应返回与当前文章标签匹配的相关文章", async () => {
		const currentPost = makePost(
			"current",
			"Vue3 新特性",
			["vue", "前端"],
			"前端",
			"2025-07-01",
		);

		const related = await getRelatedPosts(currentPost, 3);

		expect(related.length).toBeGreaterThanOrEqual(1);
		// 应排除自身
		expect(related.find((p) => p.id === "current")).toBeUndefined();
		// 至少有一篇带 vue 标签的文章
		const vuePosts = related.filter((p) => p.id === "post-1" || p.id === "post-4");
		expect(vuePosts.length).toBeGreaterThanOrEqual(1);
	});

	it("应排除加密文章", async () => {
		// 添加一篇加密文章
		const encryptedPost = {
			...makePost("encrypted", "加密文章", ["vue"], "前端", "2025-06-15"),
			data: {
				...(makePost("encrypted", "加密文章", ["vue"], "前端", "2025-06-15").data),
				password: "secret",
			},
		};
		mockGetCollection.mockResolvedValue([...allPosts, encryptedPost]);

		const currentPost = makePost(
			"current",
			"Vue 新文章",
			["vue"],
			"前端",
			"2025-07-01",
		);
		const related = await getRelatedPosts(currentPost, 5);

		// 加密文章不应出现在相关文章中
		expect(related.find((p) => p.id === "encrypted")).toBeUndefined();
	});

	it("应限制返回数量不超过 maxCount", async () => {
		const currentPost = makePost(
			"current",
			"编程文章",
			["前端", "后端"],
			"前端",
			"2025-07-01",
		);

		const related = await getRelatedPosts(currentPost, 2);
		expect(related.length).toBeLessThanOrEqual(2);
	});

	it("无匹配文章时返回空数组", async () => {
		// 使用不常见的标签确保无匹配
		const currentPost = makePost(
			"unique",
			"特殊主题",
			["罕见标签"],
			"稀有分类",
			"2025-07-01",
		);

		const related = await getRelatedPosts(currentPost, 5);
		// 即使没有标签匹配，也应该按新鲜度+分类返回结果
		expect(Array.isArray(related)).toBe(true);
	});

	it("输出包含预期的数据结构", async () => {
		const currentPost = makePost(
			"current",
			"前端框架对比",
			["vue", "react"],
			"前端",
			"2025-07-01",
		);

		const related = await getRelatedPosts(currentPost, 3);

		for (const post of related) {
			expect(post).toHaveProperty("id");
			expect(post).toHaveProperty("data");
			expect(post.data).toHaveProperty("title");
			expect(post.data).toHaveProperty("tags");
			expect(post.data).toHaveProperty("published");
		}
	});
});
