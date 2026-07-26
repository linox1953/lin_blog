/**
 * url-utils.ts 单元测试
 * 测试纯函数：removeFileExtension, pathsEqual, getDir, getFileDirFromPath
 *
 * 注意：url() 函数依赖 `import.meta.env.BASE_URL`，
 * getCategoryUrl 依赖 i18n 模块；它们属于集成测试范畴，此处仅测试纯函数。
 */
import { describe, it, expect } from "vitest";
import {
	removeFileExtension,
	pathsEqual,
	getDir,
	getFileDirFromPath,
} from "@utils/url-utils";

describe("removeFileExtension", () => {
	it("移除 .md 扩展名", () => {
		expect(removeFileExtension("hello.md")).toBe("hello");
	});

	it("移除 .mdx 扩展名", () => {
		expect(removeFileExtension("hello.mdx")).toBe("hello");
	});

	it("移除 .markdown 扩展名", () => {
		expect(removeFileExtension("hello.markdown")).toBe("hello");
	});

	it("大小写不敏感", () => {
		expect(removeFileExtension("hello.MD")).toBe("hello");
		expect(removeFileExtension("hello.Mdx")).toBe("hello");
	});

	it("没有扩展名时返回原字符串", () => {
		expect(removeFileExtension("hello")).toBe("hello");
		expect(removeFileExtension("hello.txt")).toBe("hello.txt");
	});

	it("路径中的 .md", () => {
		expect(removeFileExtension("posts/hello.md")).toBe("posts/hello");
	});

	it("多个点时只移除最后匹配的扩展名", () => {
		expect(removeFileExtension("hello.world.md")).toBe("hello.world");
	});
});

describe("pathsEqual", () => {
	it("完全相同的路径", () => {
		expect(pathsEqual("/hello/", "/hello/")).toBe(true);
	});

	it("前后斜杠不影响比较", () => {
		expect(pathsEqual("/hello/", "hello")).toBe(true);
		expect(pathsEqual("hello/", "/hello")).toBe(true);
	});

	it("大小写不敏感", () => {
		expect(pathsEqual("/Hello/", "/hello/")).toBe(true);
	});

	it("不同路径返回 false", () => {
		expect(pathsEqual("/hello/", "/world/")).toBe(false);
	});

	it("空路径", () => {
		expect(pathsEqual("", "")).toBe(true);
		expect(pathsEqual("/", "")).toBe(true);
	});
});

describe("getDir", () => {
	it("返回路径的目录部分（不带前导斜杠）", () => {
		expect(getDir("posts/hello.md")).toBe("posts/");
	});

	it("嵌套路径", () => {
		expect(getDir("category/sub/deep.md")).toBe("category/sub/");
	});

	it("没有斜杠返回 /", () => {
		expect(getDir("hello.md")).toBe("/");
	});

	it("含 .mdx", () => {
		expect(getDir("posts/test.mdx")).toBe("posts/");
	});
});

describe("getFileDirFromPath", () => {
	it("移除 src/ 前缀和文件名，保留路径", () => {
		expect(getFileDirFromPath("src/content/posts/post.md")).toBe(
			"content/posts",
		);
	});
	it("目录层级保留", () => {
		expect(getFileDirFromPath("src/pages/api/test.json.ts")).toBe("pages/api");
	});
	it("只有 src 前缀时返回文件名", () => {
		expect(getFileDirFromPath("src/file.txt")).toBe("file.txt");
	});
});
