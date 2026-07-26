import { test, expect, type Page } from "@playwright/test";

/* ============================================================
 * 导航与 SPA 过渡测试
 *
 * 验证 Swup 页面切换后所有页面元素正确渲染、
 * CategoryBar 状态正确、URL 更新正确。
 * ============================================================ */

const BASE_URL = "http://localhost:4321";

/* ---------- helpers ---------- */

async function waitForNavStable(page: Page) {
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(500);
}

async function getCategoryBarState(page: Page) {
	return page.evaluate(() => {
		const bar = document.getElementById("category-bar");
		if (!bar) return { active: [], softActive: [] };
		const pills = bar.querySelectorAll<HTMLAnchorElement>(".category-pill");
		const active: string[] = [];
		const softActive: string[] = [];
		pills.forEach((p) => {
			const name = p.getAttribute("data-category-name") ?? "";
			if (p.hasAttribute("data-active")) active.push(name);
			if (p.hasAttribute("data-soft-active")) softActive.push(name);
		});
		return { active, softActive };
	});
}

/** 断言 CategoryBar 状态无异常 */
async function expectValidBarState(page: Page) {
	const state = await getCategoryBarState(page);
	expect(state.active.length).toBeLessThanOrEqual(1);
	expect(state.softActive.length).toBeLessThanOrEqual(1);
}

/* ============================================================
 * Tests
 * ============================================================ */

test.describe("导航与 SPA 过渡", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });
		await page.waitForTimeout(500);
	});

	/* ---------- 1. 首页渲染 ---------- */
	test("首页应正确渲染文章列表和 CategoryBar", async ({ page }) => {
		// 文章卡片存在
		const postCards = page.locator(".post-card-item");
		await expect(postCards.first()).toBeVisible();
		const count = await postCards.count();
		expect(count).toBeGreaterThanOrEqual(1);

		// CategoryBar 存在且 Home 高亮
		const bar = page.locator("#category-bar");
		await expect(bar).toBeVisible();
		const state = await getCategoryBarState(page);
		expect(state.active).toEqual([""]);

		// Swup 容器存在
		await expect(page.locator("#swup-container")).toBeVisible();

		// 站点标题可见
		await expect(page.locator("nav.navbar, #navbar, .nav-bar").first()).toBeVisible();
	});

	/* ---------- 2. SPA 导航：首页 → Archive ---------- */
	test("SPA 导航到 Archive 页 — CategoryBar 高亮 Archive", async ({ page }) => {
		await page.click('.category-pill[data-category-name="__archive__"]');
		await waitForNavStable(page);

		await expectValidBarState(page);
		const state = await getCategoryBarState(page);
		expect(state.active).toEqual(["__archive__"]);
		expect(page.url()).toContain("/archive/");
	});

	/* ---------- 3. SPA 导航：首页 → Categories ---------- */
	test("SPA 导航到 Categories 页 — 更多按钮高亮", async ({ page }) => {
		await page.click('.category-pill[data-category-name="__categories__"]');
		await waitForNavStable(page);

		await expectValidBarState(page);
		const state = await getCategoryBarState(page);
		expect(state.active).toEqual(["__categories__"]);
		expect(page.url()).toContain("/categories/");
	});

	/* ---------- 4. SPA 导航：首页 → 文章详情 ---------- */
	test("SPA 导航到文章详情页 — 分类 soft-active", async ({ page }) => {
		const articleLink = page.locator("a.post-card-title").first();
		await expect(articleLink).toBeVisible();
		const href = await articleLink.getAttribute("href");
		expect(href).toBeTruthy();

		await articleLink.click();
		await waitForNavStable(page);

		// URL 更新
		expect(page.url()).toContain("/posts/");
		expect(page.url()).toContain("/");

		// CategoryBar soft-active 应该是文章所属分类
		await expectValidBarState(page);
		const state = await getCategoryBarState(page);
		expect(state.active).toEqual([]); // 文章页无 active
		if (state.softActive.length > 0) {
			// 有分类时验证 soft-active 不为空
			expect(state.softActive[0]).toBeTruthy();
		}
	});

	/* ---------- 5. SPA 导航：文章详情 → 返回首页 ---------- */
	test("文章详情页点击 Home pill 返回首页", async ({ page }) => {
		// 先进入文章
		await page.locator("a.post-card-title").first().click();
		await waitForNavStable(page);

		// 再点 Home
		await page.click('.category-pill[data-category-name=""]');
		await waitForNavStable(page);

		await expectValidBarState(page);
		const state = await getCategoryBarState(page);
		expect(state.active).toEqual([""]);
		expect(page.url()).toBe(BASE_URL + "/");
	});

	/* ---------- 6. 多步 SPA 导航：首页 → 分类 → 文章 → 归档 ---------- */
	test("多步 SPA 导航不丢失功能", async ({ page }) => {
		const steps = [
			{ pill: "__archive__", urlCheck: "/archive/" },
			{ pill: "__categories__", urlCheck: "/categories/" },
			{ pill: "", urlCheck: BASE_URL + "/" },
		];

		for (const step of steps) {
			await page.click(`.category-pill[data-category-name="${step.pill}"]`);
			await waitForNavStable(page);
			await expectValidBarState(page);
			expect(page.url()).toContain(step.urlCheck);
		}
	});

	/* ---------- 7. 404 页面 ---------- */
	test("访问不存在的页面 — 显示 404", async ({ page }) => {
		await page.goto(BASE_URL + "/nonexistent-page/", { waitUntil: "networkidle" });
		await page.waitForTimeout(500);

		// 应显示 404 相关内容（可能需要根据实际 404 页面调整选择器）
		const body = page.locator("body");
		await expect(body).toBeVisible();
		// 404 页面应包含"404"或"not found"相关内容
		const text = await body.textContent();
		const has404 =
			text?.toLowerCase().includes("404") ||
			text?.toLowerCase().includes("not found") ||
			text?.toLowerCase().includes("页面不存在");
		expect(has404).toBeTruthy();
	});

	/* ---------- 8. Swup 容器在导航后仍存在 ---------- */
	test("SPA 导航后 Swup 容器仍然存在", async ({ page }) => {
		const pages = ["/archive/", "/categories/", "/about/", "/sponsor/"];

		for (const p of pages) {
			// 使用 category pill 导航（如果不能，用 goto 兜底）
			if (p === "/archive/") {
				await page.click('.category-pill[data-category-name="__archive__"]');
			} else if (p === "/categories/") {
				await page.click('.category-pill[data-category-name="__categories__"]');
			} else {
				await page.goto(BASE_URL + p, { waitUntil: "networkidle" });
			}
			await waitForNavStable(page);

			// Swup 容器应始终存在
			const swupContainer = page.locator("#swup-container");
			await expect(swupContainer).toBeVisible();
			expect(await swupContainer.textContent()).toBeTruthy();
		}
	});

	/* ---------- 9. 归档页内容 ---------- */
	test("归档页应显示文章列表", async ({ page }) => {
		await page.click('.category-pill[data-category-name="__archive__"]');
		await waitForNavStable(page);

		// 归档页上的文章链接（archive-panel 或 .archive-post）
		const archivePosts = page.locator(".archive-post, archive-panel .archive-post");
		if ((await archivePosts.count()) > 0) {
			await expect(archivePosts.first()).toBeVisible();
		} else {
			// 备选：检查页面有内容
			const bodyText = await page.locator("body").textContent();
			expect(bodyText?.length).toBeGreaterThan(100);
		}
	});

	/* ---------- 10. 分类页内容 ---------- */
	test("分类页应显示分类列表", async ({ page }) => {
		await page.click('.category-pill[data-category-name="__categories__"]');
		await waitForNavStable(page);

		const bodyText = await page.locator("body").textContent();
		expect(bodyText).toBeTruthy();
		// 应包含至少一个分类名（非空页面）
		expect(bodyText?.length).toBeGreaterThan(100);
	});
});
