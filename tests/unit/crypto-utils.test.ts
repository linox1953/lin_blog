/**
 * crypto-utils.ts 单元测试
 * 测试：encryptContent
 */
import { describe, it, expect } from "vitest";
import { encryptContent } from "@utils/crypto-utils";

describe("encryptContent", () => {
	it("加密返回 base64 字符串", () => {
		const result = encryptContent("<p>Hello World</p>", "mypassword", "test-post");
		expect(typeof result).toBe("string");
		// base64 编码的字符串应该符合 base64 格式
		expect(result).toMatch(/^[A-Za-z0-9+/=]+$/);
	});

	it("相同输入产生相同输出（确定性加密）", () => {
		const input = "<h1>Title</h1><p>Content</p>";
		const password = "test123";
		const slug = "my-post";

		const result1 = encryptContent(input, password, slug);
		const result2 = encryptContent(input, password, slug);

		expect(result1).toBe(result2);
	});

	it("不同密码产生不同输出", () => {
		const input = "<p>Secret</p>";
		const slug = "same-slug";

		const r1 = encryptContent(input, "password1", slug);
		const r2 = encryptContent(input, "password2", slug);

		expect(r1).not.toBe(r2);
	});

	it("不同 slug 产生不同输出", () => {
		const input = "<p>Secret</p>";
		const password = "pass";

		const r1 = encryptContent(input, password, "post-1");
		const r2 = encryptContent(input, password, "post-2");

		expect(r1).not.toBe(r2);
	});

	it("空内容也能加密", () => {
		const result = encryptContent("", "password", "empty-post");
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("加密结果包含盐值、IV、认证标签和密文", () => {
		// salt[16] + iv[12] + authTag[16] + ciphertext ≥ 44 bytes → base64 ≥ 60 chars
		const result = encryptContent("Hello", "pass", "slug");
		// base64 编码后至少 60 字符
		expect(result.length).toBeGreaterThanOrEqual(60);
	});
});
