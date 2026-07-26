import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	testIgnore: "**/unit/**",
	/* 不并行，避免 CategoryBar 全局状态的相互干扰 */
	fullyParallel: false,
	/* 失败重试 1 次（CI 环境或网络不稳定时） */
	retries: process.env.CI ? 2 : 0,
	/* 一次只跑一个 worker，确保 Swup 缓存等全局状态独立 */
	workers: 1,
	reporter: [["html", { outputFolder: "playwright-report" }]],
	/* 测试超时 */
	timeout: 30_000,

	use: {
		baseURL: "http://localhost:4321",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	/* 启动 Astro 开发服务器 */
	webServer: {
		command: "pnpm dev",
		url: "http://localhost:4321",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
