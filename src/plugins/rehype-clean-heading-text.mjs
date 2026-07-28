/**
 * rehype 插件：提取标题纯文本前移除 KaTeX 的 MathML 隐藏元素
 *
 * 问题：KaTeX 为每个公式同时输出 .katex-mathml（语义 MathML）和
 * .katex-html（视觉渲染），hast-util-to-string 通过 textContent
 * 提取标题文本时会将两者拼接，导致如 "A,BA, BA,B" 这样的文本重复。
 *
 * 本插件在标题元素内移除 .katex-mathml 子元素，使 textContent
 * 只保留视觉渲染的文本，避免重复。
 */
import { visit } from "unist-util-visit";

/** @type {import("unified").Plugin} */
export default function rehypeCleanHeadingText() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (/^h[1-6]$/i.test(node.tagName)) {
				if (!node.children) return;

				node.children = node.children.map((child) => {
					if (
						child.type === "element" &&
						child.tagName === "span" &&
						Array.isArray(child.properties?.className) &&
						child.properties.className.includes("katex")
					) {
						// 在 .katex 容器内移除 .katex-mathml 子元素
						const filtered = (child.children || []).filter(
							(gc) =>
								!(
									gc.type === "element" &&
									gc.tagName === "span" &&
									Array.isArray(gc.properties?.className) &&
									gc.properties.className.includes("katex-mathml")
								),
						);
						return { ...child, children: filtered };
					}
					return child;
				});
			}
		});
	};
}
