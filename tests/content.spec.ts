import { test, expect, type Page } from "@playwright/test";

/* ============================================================
 * 页面内容渲染测试
 *
 * 验证各个页面的核心内容是否正确渲染，包括文章详情、
 * 分类/标签页、关于页、打赏页等静态内容。
 * ============================================================ */

const BASE_URL = "http://localhost:4321";

async function waitForNavStable(page: Page) {
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(500);
}

test.describe("页面内容渲染", () => {
	/* ---------- 1. 文章详情页 ---------- */
	test("文章详情页应渲染标题、内容、元数据", async ({ page }) => {
		await page.goto(BASE_URL + "/posts/数学归纳法/", { waitUntil: "networkidle" });
		await page.waitForTimeout(500);

		// 标题存在
		const title = page.locator("h1, .post-title, article h1").first();
		await expect(title).toBeVisible();
		const titleText = await title.textContent();
		expect(titleText).toBeTruthy();

		// 内容区域存在
		const content = page.locator(
			".markdown-content, article, .post-content, #post-container",
		).first();
		await expect(content).toBeVisible();

		// 元数据（日期、分类等）
		const meta = page.locator(".post-meta-root, .post-meta, [class*='meta']").first();
		await expect(meta).toBeVisible();

		// Swup 容器存在且有 data-current-post-category
		const swupContainer = page.locator("#swup-container");
		const categoryAttr = await swupContainer.getAttribute("data-current-post-category");
		expect(categoryAttr).toBeTruthy(); // 文章有分类
	});

	/* ---------- 2. KaTeX 数学公式 ---------- */
	test("文章详情页应渲染 KaTeX 数学公式", async ({ page }) => {
		await page.goto(BASE_URL + "/posts/数学归纳法/", { waitUntil: "networkidle" });
		await page.waitForTimeout(1000); // 给 KaTeX 渲染时间

		// KaTeX 公式元素
		const katex = page.locator(".katex, .katex-html, .katex-mathml").first();
		await expect(katex).toBeVisible();

		// 验证公式文本包含数学符号
		const katexText = await page.locator("body").textContent();
		expect(katexText).toContain("数学归纳法");
	});

	/* ---------- 3. 关于页 ---------- */
	test("关于页应渲染 Markdown 内容", async ({ page }) => {
		await page.goto(BASE_URL + "/about/", { waitUntil: "networkidle" });
		await page.waitForTimeout(500);

		// 关于页用 Markdown 组件包裹 Content，直接检查 body 包含预期内容
		const body = page.locator("body");
		const bodyText = await body.textContent();
		expect(bodyText).toBeTruthy();
		expect(bodyText!.length).toBeGreaterThan(50);

		// CategoryBar 状态：关于页不应有 active/soft-active
		await page.waitForTimeout(200);
		const barState = await page.evaluate(() => {
			const bar = document.getElementById("category-bar");
			if (!bar) return null;
			const active = bar.querySelector('[data-active]');
			const soft = bar.querySelector('[data-soft-active]');
			return {
				active: active?.getAttribute("data-category-name") ?? null,
				soft: soft?.getAttribute("data-category-name") ?? null,
			};
		});
		expect(barState?.active).toBeNull();
		expect(barState?.soft).toBeNull();
	});

	/* ---------- 4. 打赏页 ---------- */
	test("打赏页应渲染", async ({ page }) => {
		await page.goto(BASE_URL + "/sponsor/", { waitUntil: "networkidle" });
		await page.waitForTimeout(500);

		const body = page.locator("body");
		await expect(body).toBeVisible();
		const text = await body.textContent();
		expect(text!.length).toBeGreaterThan(50);
	});

	/* ---------- 5. 分类页 ---------- */
	test("分类页应显示所有分类", async ({ page }) => {
		await page.goto(BASE_URL + "/categories/", { waitUntil: "networkidle" });
		await page.waitForTimeout(500);

		// 应有分类列表
		const categoryItems = page.locator(".category-item, [class*='category'], .tag-card");
		const count = await categoryItems.count();
		// 至少有 "学习" 这个分类
		expect(count).toBeGreaterThanOrEqual(1);

		const bodyText = await page.locator("body").textContent();
		expect(bodyText).toContain("学习");
	});

	/* ---------- 6. 标签页 ---------- */
	test("标签页应显示所有标签", async ({ page }) => {
		await page.goto(BASE_URL + "/tags/", { waitUntil: "networkidle" });
		await page.waitForTimeout(500);

		const bodyText = await page.locator("body").textContent();
		expect(bodyText).toContain("数学");
		expect(bodyText).toContain("考研");
	});

	/* ---------- 7. 相册页 ---------- */
	test("相册页应显示相册列表", async ({ page }) => {
		await page.goto(BASE_URL + "/gallery/", { waitUntil: "networkidle" });
		await page.waitForTimeout(500);

		const body = page.locator("body");
		await expect(body).toBeVisible();
		const text = await body.textContent();
		expect(text!.length).toBeGreaterThan(50);
	});

	/* ---------- 8. RSS 馈送 ---------- */
	test("RSS feed 应输出有效 XML", async ({ page }) => {
		const resp = await page.request.get(BASE_URL + "/rss.xml");
		expect(resp.ok()).toBeTruthy();
		const text = await resp.text();
		expect(text).toContain("<rss");
		expect(text).toContain("<channel");
		expect(text).toContain("<item");
		expect(text).toContain("数学归纳法");
	});

	/* ---------- 9. 文章元数据 API ---------- */
	test("文章元数据 API 应返回 JSON", async ({ page }) => {
		const resp = await page.request.get(BASE_URL + "/api/allPostMeta.json");
		expect(resp.ok()).toBeTruthy();

		// 开发服务器可能返回 text/plain，但数据本身是 JSON 格式
		const data = await resp.json();
		expect(Array.isArray(data)).toBeTruthy();
		if (data.length > 0) {
			expect(data[0]).toHaveProperty("title");
			expect(data[0]).toHaveProperty("published");
			expect(data[0]).toHaveProperty("id");
		}
	});

	/* ---------- 10. 导航栏链接 ---------- */
	test("导航栏包含主要链接", async ({ page }) => {
		await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });
		await page.waitForTimeout(500);

		const navLinks = page.locator("nav a, .navbar a, [class*='nav'] a");
		const linkCount = await navLinks.count();
		expect(linkCount).toBeGreaterThan(3);

		// 检查是否存在关键链接文本
		const allText = await navLinks.allTextContents();
		const combinedText = allText.join(" ");

		const hasHome = combinedText.toLowerCase().includes("home") ||
			combinedText.includes("首页");
		const hasArchive = combinedText.includes("archive") ||
			combinedText.includes("归档");
		const hasSearch = combinedText.includes("search") ||
			combinedText.includes("搜索");

		expect(hasHome || hasArchive || hasSearch).toBeTruthy();
	});

	/* ---------- 11. 首页文章卡片 ---------- */
	test("首页文章卡片包含标题和元数据", async ({ page }) => {
		await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });
		await page.waitForTimeout(500);

		const card = page.locator(".post-card-item").first();
		await expect(card).toBeVisible();

		// 应有标题链接
		const titleLink = card.locator("a.post-card-title");
		await expect(titleLink).toBeVisible();
		const href = await titleLink.getAttribute("href");
		expect(href).toBeTruthy();

		// 应有分类信息
		const categoryLink = card.locator('a[href*="category="]');
		if ((await categoryLink.count()) > 0) {
			await expect(categoryLink.first()).toBeVisible();
		}
	});
});
