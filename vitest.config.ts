import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
	test: {
		include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts"],
		exclude: ["node_modules/**", "dist/**"],
		setupFiles: ["./tests/unit/setup.ts"],
		globals: true,
		environment: "node",
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@components": path.resolve(__dirname, "./src/components"),
			"@assets": path.resolve(__dirname, "./src/assets"),
			"@constants": path.resolve(__dirname, "./src/constants"),
			"@utils": path.resolve(__dirname, "./src/utils"),
			"@i18n": path.resolve(__dirname, "./src/i18n"),
			"@layouts": path.resolve(__dirname, "./src/layouts"),
		},
	},
});
