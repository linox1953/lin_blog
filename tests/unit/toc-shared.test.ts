/**
 * toc-shared.ts 单元测试
 * 测试纯函数：computeTocItems, escapeHtmlAttr, renderBadgeInnerHTML, renderTocItemHTML
 */
import { describe, it, expect } from "vitest";
import {
	computeTocItems,
	escapeHtmlAttr,
	renderBadgeInnerHTML,
	renderTocItemHTML,
	type TocInput,
	type TocItem,
} from "@/utils/toc-shared";

describe("computeTocItems", () => {
	const defaultOpts = { maxLevel: 3 };

	it("空输入返回空数组", () => {
		expect(computeTocItems([], defaultOpts)).toEqual([]);
	});

	it("单层 h2 应生成 index 类型目录项", () => {
		const headings: TocInput[] = [
			{ depth: 2, slug: "intro", text: "引言" },
			{ depth: 2, slug: "body", text: "正文" },
		];
		const result = computeTocItems(headings, defaultOpts);

		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({
			headingId: "intro",
			href: "#intro",
			depthLevel: 0,
			badgeKind: "index",
			badgeIndex: 1,
			text: "引言",
			labelPrimary: true,
		});
		expect(result[1].badgeIndex).toBe(2);
	});

	it("多层标题应正确分配 depthLevel", () => {
		// 最小深度=1，maxLevel=3 → 只保留 depth < 4 的标题
		const headings: TocInput[] = [
			{ depth: 1, slug: "s1", text: "第1章" },
			{ depth: 2, slug: "s1-1", text: "1.1" },
			{ depth: 3, slug: "s1-1-1", text: "1.1.1" },
			{ depth: 4, slug: "s1-1-1-1", text: "1.1.1.1" }, // 超过 maxLevel，被过滤
		];
		const result = computeTocItems(headings, defaultOpts);

		expect(result).toHaveLength(3);
		expect(result[0].depthLevel).toBe(0); // depth=minDepth → level 0
		expect(result[0].badgeKind).toBe("index");
		expect(result[0].badgeIndex).toBe(1);
		expect(result[1].depthLevel).toBe(1); // depth=minDepth+1 → level 1
		expect(result[1].badgeKind).toBe("dot");
		expect(result[2].depthLevel).toBe(2); // depth=minDepth+2 → level 2
		expect(result[2].badgeKind).toBe("dot-sm");
	});

	it("没有 slug 的标题应被跳过", () => {
		const headings: TocInput[] = [
			{ depth: 2, slug: "valid", text: "有效" },
			{ depth: 2, slug: "", text: "无锚点" },
			{ depth: 2, slug: "", text: "也无锚点" },
		];
		const result = computeTocItems(headings, defaultOpts);
		expect(result).toHaveLength(1);
		expect(result[0].headingId).toBe("valid");
	});

	it("空文本应回退为 slug", () => {
		const headings: TocInput[] = [
			{ depth: 2, slug: "only-slug", text: "" },
		];
		const result = computeTocItems(headings, defaultOpts);
		expect(result[0].text).toBe("only-slug");
	});

	it("文本末尾的 # 应被去除", () => {
		const headings: TocInput[] = [
			{ depth: 2, slug: "h1", text: "标题#" },
			{ depth: 2, slug: "h2", text: "标题## " },
		];
		const result = computeTocItems(headings, defaultOpts);
		expect(result[0].text).toBe("标题");
		expect(result[1].text).toBe("标题");
	});

	it("index 计数器仅针对最浅层递增", () => {
		const headings: TocInput[] = [
			{ depth: 2, slug: "a", text: "A" },
			{ depth: 3, slug: "a1", text: "A1" }, // 不消耗 index
			{ depth: 2, slug: "b", text: "B" },
		];
		const result = computeTocItems(headings, defaultOpts);
		expect(result[0].badgeIndex).toBe(1);
		expect(result[1].badgeKind).toBe("dot");
		expect(result[1].badgeIndex).toBeUndefined();
		expect(result[2].badgeIndex).toBe(2);
	});
});

describe("escapeHtmlAttr", () => {
	it("转义 &", () => {
		expect(escapeHtmlAttr("a&b")).toBe("a&amp;b");
	});

	it("转义双引号", () => {
		expect(escapeHtmlAttr('a"b')).toBe("a&quot;b");
	});

	it("转义单引号", () => {
		expect(escapeHtmlAttr("a'b")).toBe("a&#39;b");
	});

	it("转义尖括号", () => {
		expect(escapeHtmlAttr("a<b>c")).toBe("a&lt;b&gt;c");
	});

	it("转义混合字符", () => {
		expect(escapeHtmlAttr('<a href="x">')).toBe(
			"&lt;a href=&quot;x&quot;&gt;",
		);
	});

	it("安全字符串不变", () => {
		expect(escapeHtmlAttr("hello world")).toBe("hello world");
	});
});

describe("renderBadgeInnerHTML", () => {
	it("index 类型返回序号", () => {
		const item: TocItem = {
			headingId: "x",
			href: "#x",
			depthLevel: 0,
			badgeKind: "index",
			badgeIndex: 5,
			text: "X",
			labelPrimary: true,
		};
		expect(renderBadgeInnerHTML(item)).toBe("5");
	});

	it("dot 类型返回圆点", () => {
		const item: TocItem = {
			headingId: "y",
			href: "#y",
			depthLevel: 1,
			badgeKind: "dot",
			text: "Y",
			labelPrimary: true,
		};
		expect(renderBadgeInnerHTML(item)).toBe('<span class="toc-badge-dot"></span>');
	});

	it("dot-sm 类型返回小圆点", () => {
		const item: TocItem = {
			headingId: "z",
			href: "#z",
			depthLevel: 2,
			badgeKind: "dot-sm",
			text: "Z",
			labelPrimary: false,
		};
		expect(renderBadgeInnerHTML(item)).toBe(
			'<span class="toc-badge-dot toc-badge-dot-sm"></span>',
		);
	});
});

describe("renderTocItemHTML", () => {
	it("应生成完整的 <a> 标签结构", () => {
		const item: TocItem = {
			headingId: "intro",
			href: "#intro",
			depthLevel: 0,
			badgeKind: "index",
			badgeIndex: 1,
			text: "引言",
			labelPrimary: true,
		};
		const html = renderTocItemHTML(item);

		expect(html).toContain('href="#intro"');
		expect(html).toContain('class="toc-item toc-level-0"');
		expect(html).toContain('data-heading-id="intro"');
		expect(html).toContain('aria-label="引言"');
		expect(html).toContain('title="引言"');
		expect(html).toContain("1"); // badgeIndex
		expect(html).toContain("引言"); // text
	});

	it("应转义特殊字符", () => {
		const item: TocItem = {
			headingId: "test",
			href: "#test",
			depthLevel: 0,
			badgeKind: "index",
			badgeIndex: 1,
			text: 'A&B "test"',
			labelPrimary: true,
		};
		const html = renderTocItemHTML(item);

		expect(html).not.toContain('"A&B"');
		expect(html).toContain("A&amp;B");
	});
});
