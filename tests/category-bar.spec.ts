import { test, expect, type Page } from "@playwright/test";

/* ============================================================
 * CategoryBar 状态验证测试套件
 *
 * 模拟快速点击分类和文章，验证 CategoryBar 高亮状态是否错乱。
 *
 * 测试场景：
 *   1. 首页初始状态 — Home pill 高亮
 *   2. 单一点击分类 — 每个分类 pill 点击后正确高亮
 *   3. 文章点击 → 所属分类 soft-active
 *   4. 快速连续点击分类 — 状态不错乱（无重复高亮）
 *   5. 分类 ↔ 文章 快速切换 — 状态正确
 *   6. data-current-post-category 同步验证
 *   7. 快速返回 Home — 状态正确
 * ============================================================ */

const BASE_URL = "http://localhost:4321";

/* ---------- helpers ---------- */

/** 简易 CSS 选择器值转义（处理含特殊字符的分类名） */
function escCSS(value: string): string {
	return value.replace(/["\\]/g, "\\$&");
}

/** 等待 Swup 导航稳定（URL 变更 + astro:page-load 已触发） */
async function waitForNavigationStable(page: Page, timeout = 10_000) {
	await page.waitForLoadState("networkidle", { timeout });
	// 再给 Swup 过渡 + 脚本执行额外缓冲
	await page.waitForTimeout(500);
}

/**
 * 统计当前页面的 CategoryBar pill 状态。
 * 返回 { active: string[], softActive: string[] }
 */
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
async function expectValidCategoryBarState(page: Page) {
	const state = await getCategoryBarState(page);

	// 最多只能有一个 active pill
	expect(
		state.active.length,
		`应最多 1 个 active pill，实际有 ${state.active.length}: ${JSON.stringify(state.active)}`,
	).toBeLessThanOrEqual(1);

	// 最多只能有一个 soft-active pill
	expect(
		state.softActive.length,
		`应最多 1 个 soft-active pill，实际有 ${state.softActive.length}: ${JSON.stringify(state.softActive)}`,
	).toBeLessThanOrEqual(1);

	// active 和 soft-active 不共存
	if (state.active.length > 0 && state.softActive.length > 0) {
		console.warn(
			`\u26A0\uFE0F 警告：同时存在 active(${state.active}) 和 soft-active(${state.softActive})，可能异常`,
		);
	}
}

/** 获取当前页面上所有可点击的分类 pill 信息 */
async function getCategoryPillsInfo(page: Page) {
	return page.evaluate(() => {
		const bar = document.getElementById("category-bar");
		if (!bar) return [];

		const pills = bar.querySelectorAll<HTMLAnchorElement>(".category-pill");
		return Array.from(pills).map((p) => ({
			name: p.getAttribute("data-category-name") ?? "",
			href: p.getAttribute("href") ?? "",
			text: p.textContent?.trim() ?? "",
		}));
	});
}

/** 获取当前页面上所有文章卡片的信息 */
async function getArticleCardsInfo(page: Page) {
	return page.evaluate(() => {
		const cards = document.querySelectorAll<HTMLElement>(".post-card-item");
		return Array.from(cards).map((card) => {
			const titleLink = card.querySelector<HTMLAnchorElement>("a.post-card-title");
			const categoryLink = card.querySelector<HTMLAnchorElement>('a[href*="category="]');
			return {
				title: titleLink?.textContent?.trim() ?? "",
				href: titleLink?.getAttribute("href") ?? "",
				category: categoryLink?.textContent?.trim() ?? "",
			};
		});
	});
}

/** 获取当前页面 `#swup-container` 上的 data-current-post-category */
async function getSwupContainerCategory(page: Page) {
	return page.evaluate(() => {
		const el = document.getElementById("swup-container");
		return el?.getAttribute("data-current-post-category") ?? "";
	});
}

/** 获取 CategoryBar 上的 data-current-post-category */
async function getCategoryBarCategoryAttr(page: Page) {
	return page.evaluate(() => {
		const el = document.getElementById("category-bar");
		return el?.getAttribute("data-current-post-category") ?? "";
	});
}

/** 使用 page.locator 点击指定 data-category-name 的 pill */
async function clickCategoryPill(page: Page, name: string) {
	const locator = page.locator(
		`.category-pill[data-category-name="${escCSS(name)}"]`,
	);
	await locator.first().click();
}

/* ============================================================
 * Tests
 * ============================================================ */
test.describe("CategoryBar 状态验证", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });
		await page.waitForTimeout(500); // 等 Swup + CategoryBar 初始渲染
	});

	/* ---------- 1. 首页初始状态 ---------- */
	test("首页初始状态 — Home pill 应高亮", async ({ page }) => {
		const state = await getCategoryBarState(page);
		expect(state.active).toEqual([""]); // data-category-name="" 表示 Home
		expect(state.softActive).toEqual([]);
	});

	/* ---------- 2. 单一点击每一个分类 ---------- */
	test("单一点击每个分类 pill — 正确高亮", async ({ page }) => {
		const pills = await getCategoryPillsInfo(page);
		// 跳过特殊 pill（Home/Archive/Categories）
		const categoryPills = pills.filter(
			(p) =>
				p.name !== "" &&
				p.name !== "__archive__" &&
				p.name !== "__categories__",
		);

		if (categoryPills.length === 0) {
			test.skip(true, "没有分类可点击");
			return;
		}

		for (const pill of categoryPills) {
			// 点击分类 pill
			await clickCategoryPill(page, pill.name);
			await waitForNavigationStable(page);
			await expectValidCategoryBarState(page);

			const state = await getCategoryBarState(page);
			expect(
				state.active,
				`点击分类 "${pill.name}" 后应高亮该分类`,
			).toEqual([pill.name]);
			expect(state.softActive, "分类页不应有 soft-active").toEqual([]);

			// 回到首页
			await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });
			await page.waitForTimeout(500);
		}
	});

	/* ---------- 3. 点击 Archive pill ---------- */
	test("点击 Archive pill — Archive 高亮", async ({ page }) => {
		await clickCategoryPill(page, "__archive__");
		await waitForNavigationStable(page);
		await expectValidCategoryBarState(page);

		const state = await getCategoryBarState(page);
		expect(state.active).toEqual(["__archive__"]);
	});

	/* ---------- 4. 点击 Home pill ---------- */
	test("从其他页面点击 Home pill — Home 高亮", async ({ page }) => {
		// 先导航到 Archive
		await clickCategoryPill(page, "__archive__");
		await waitForNavigationStable(page);

		// 再点 Home
		await clickCategoryPill(page, "");
		await waitForNavigationStable(page);
		await expectValidCategoryBarState(page);

		const state = await getCategoryBarState(page);
		expect(state.active).toEqual([""]);
	});

	/* ---------- 5. 点击文章 → 所属分类 soft-active ---------- */
	test("点击文章 — 所属分类显示 soft-active", async ({ page }) => {
		const articles = await getArticleCardsInfo(page);

		if (articles.length === 0) {
			test.skip(true, "首页没有文章可点击");
			return;
		}

		const articleWithCategory = articles.find((a) => a.category && a.href);
		if (!articleWithCategory) {
			test.skip(true, "没有找到带有分类的文章");
			return;
		}

		await page.click(`a.post-card-title[href="${escCSS(articleWithCategory.href)}"]`);
		await waitForNavigationStable(page);
		await expectValidCategoryBarState(page);

		const state = await getCategoryBarState(page);
		expect(state.active, "文章页不应有 active pill").toEqual([]);
		expect(
			state.softActive,
			`文章 "${articleWithCategory.title}" 的分类 "${articleWithCategory.category}" 应 soft-active`,
		).toEqual([articleWithCategory.category]);
	});

	/* ---------- 6. 快速连续点击分类 ---------- */
	test("快速连续点击分类 — 状态不错乱", async ({ page }) => {
		const pills = await getCategoryPillsInfo(page);
		const clickablePills = pills.filter(
			(p) =>
				p.name !== "" &&
				p.name !== "__archive__" &&
				p.name !== "__categories__",
		);

		if (clickablePills.length < 2) {
			test.skip(true, "至少需要 2 个分类才能测试快速切换");
			return;
		}

		// 快速点击：A → B → C（不等待中间导航）
		const [p1, p2] = [clickablePills[0], clickablePills[1]];
		const p3 = clickablePills.length > 2 ? clickablePills[2] : clickablePills[0];

		await clickCategoryPill(page, p1.name);
		// 不等待，立即点第二个
		await clickCategoryPill(page, p2.name);
		// 不等待，立即点第三个
		await clickCategoryPill(page, p3.name);

		// 等待最终导航稳定
		await waitForNavigationStable(page);
		await expectValidCategoryBarState(page);

		const state = await getCategoryBarState(page);
		expect(
			state.active.length,
			`快速切换后应有且仅有 1 个 active pill，实际: ${JSON.stringify(state)}`,
		).toBe(1);
	});

	/* ---------- 7. 分类 → 文章 → 分类 顺序切换 ---------- */
	test("分类→文章→分类 顺序切换 — 状态正确", async ({ page }) => {
		const pills = await getCategoryPillsInfo(page);
		const categoryPills = pills.filter(
			(p) =>
				p.name !== "" &&
				p.name !== "__archive__" &&
				p.name !== "__categories__",
		);
		const articles = await getArticleCardsInfo(page);

		if (categoryPills.length === 0 || articles.length === 0) {
			test.skip(true, "需要至少一个分类和一篇文章");
			return;
		}

		const catPill = categoryPills[0];
		const article = articles.find((a) => a.href);
		if (!article) {
			test.skip(true, "没有找到文章链接");
			return;
		}

		// 点击分类 → 等待 → 点击文章 → 等待 → 再点分类
		await clickCategoryPill(page, catPill.name);
		await waitForNavigationStable(page);

		// 导航到新页面后重新获取文章列表
		const freshArticles = await getArticleCardsInfo(page);
		const freshArticle = freshArticles.find((a) => a.category === catPill.name && a.href);
		if (!freshArticle) {
			test.skip(true, "该分类下没有找到文章");
			return;
		}
		await page.click(`a.post-card-title[href="${escCSS(freshArticle.href)}"]`);
		await waitForNavigationStable(page);

		const anotherPill =
			categoryPills.length > 1 ? categoryPills[1] : categoryPills[0];
		await clickCategoryPill(page, anotherPill.name);
		await waitForNavigationStable(page);
		await expectValidCategoryBarState(page);

		const state = await getCategoryBarState(page);
		expect(state.active.length, "最终应进入分类页，对应分类高亮").toBe(1);
	});

	/* ---------- 8. 快速返回 Home ---------- */
	test("从分类页面快速点击 Home — Home 正确高亮", async ({ page }) => {
		const pills = await getCategoryPillsInfo(page);
		const categoryPills = pills.filter(
			(p) =>
				p.name !== "" &&
				p.name !== "__archive__" &&
				p.name !== "__categories__",
		);

		if (categoryPills.length === 0) {
			test.skip(true, "没有分类可点击");
			return;
		}

		// 进入某个分类
		await clickCategoryPill(page, categoryPills[0].name);
		await waitForNavigationStable(page);

		// 快速点击 Home
		await clickCategoryPill(page, "");
		await waitForNavigationStable(page);
		await expectValidCategoryBarState(page);

		const state = await getCategoryBarState(page);
		expect(state.active).toEqual([""]);
		expect(state.softActive).toEqual([]);
	});

	/* ---------- 9. data-current-post-category 同步验证 ---------- */
	test("data-current-post-category 在文章页同步正确", async ({ page }) => {
		const articles = await getArticleCardsInfo(page);
		const articleWithCategory = articles.find((a) => a.category && a.href);

		if (!articleWithCategory) {
			test.skip(true, "没有找到带分类的文章");
			return;
		}

		await page.click(`a.post-card-title[href="${escCSS(articleWithCategory.href)}"]`);
		await waitForNavigationStable(page);

		const swupCategory = await getSwupContainerCategory(page);
		const barCategory = await getCategoryBarCategoryAttr(page);
		const expectedCategory = articleWithCategory.category;

		expect(swupCategory).toBe(expectedCategory);
		expect(barCategory).toBe(expectedCategory);
	});

	/* ---------- 10. 压力测试：快速循环点击 ---------- */
	test("压力测试 — 10 次快速切换不出现状态错乱", async ({ page }) => {
		const pills = await getCategoryPillsInfo(page);
		const targets = pills.filter(
			(p) =>
				p.name !== "" &&
				p.name !== "__archive__" &&
				p.name !== "__categories__",
		);

		if (targets.length < 2) {
			test.skip(true, "至少需要 2 个分类");
			return;
		}

		// 来回快速切换 10 次
		for (let i = 0; i < 10; i++) {
			const target = targets[i % targets.length];
			await clickCategoryPill(page, target.name);
			// 不等待
		}

		// 等待最终稳定
		await waitForNavigationStable(page);
		await expectValidCategoryBarState(page);

		const state = await getCategoryBarState(page);
		expect(
			state.active.length,
			`压力测试后应有且仅有 1 个 active pill (${JSON.stringify(state)})`,
		).toBe(1);
	});

	/* ---------- 11. 检查 active 和 soft-active 不冲突 ---------- */
	test("同一页面上 active 和 soft-active 不应并存", async ({ page }) => {
		const articles = await getArticleCardsInfo(page);
		const articleWithCategory = articles.find((a) => a.category && a.href);
		const pills = await getCategoryPillsInfo(page);
		const categoryPills = pills.filter(
			(p) =>
				p.name !== "" &&
				p.name !== "__archive__" &&
				p.name !== "__categories__",
		);

		if (!articleWithCategory || categoryPills.length === 0) {
			test.skip(true, "需要至少一个分类和一篇文章");
			return;
		}

		// 进入文章页
		await page.click(`a.post-card-title[href="${escCSS(articleWithCategory.href)}"]`);
		await waitForNavigationStable(page);

		// 回到分类页 → 等待 → 再点另一篇文章
		await clickCategoryPill(page, categoryPills[0].name);
		await waitForNavigationStable(page);

		const freshArticles = await getArticleCardsInfo(page);
		const anotherArticle = freshArticles.find(
			(a) => a.href && a.href !== articleWithCategory.href,
		) || freshArticles[0];
		if (!anotherArticle || !anotherArticle.href) {
			test.skip(true, "没有找到可点击的第二篇文章");
			return;
		}

		await page.click(`a.post-card-title[href="${escCSS(anotherArticle.href)}"]`);
		await waitForNavigationStable(page);
		await expectValidCategoryBarState(page);

		const state = await getCategoryBarState(page);

		// 最终是文章页，不应有 active
		expect(state.active).toEqual([]);
		expect(state.softActive.length).toBeLessThanOrEqual(1);
	});
});
