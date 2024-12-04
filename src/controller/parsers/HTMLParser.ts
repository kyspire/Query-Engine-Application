import JSZip from "jszip";
import { DefaultTreeAdapterMap } from "parse5";
import * as parse5 from "parse5";

type Document = DefaultTreeAdapterMap["document"];
type Node = DefaultTreeAdapterMap["node"];

export class HTMLParser {
	public static async parseFile(data: JSZip.JSZipObject): Promise<Document> {
		const dataContent = await data.async("text");
		return parse5.parse(dataContent);
	}

	public static findElementsByTagName(node: Node, tagName: string): Node[] {
		let results: Node[] = [];

		// Check if the current node is an element and matches the tag name
		if (node.nodeName === tagName) {
			results.push(node);
		}

		// Recursively traverse the child nodes
		if ("childNodes" in node) {
			for (const child of node.childNodes) {
				results = results.concat(this.findElementsByTagName(child, tagName));
			}
		}

		return results;
	}

	public static findElementsByTagNameAndClassName(node: Node, tagName: string, className: string): Node[] {
		const nodes = HTMLParser.findElementsByTagName(node, tagName);
		const result = [];
		for (const cell of nodes) {
			if ("attrs" in cell) {
				for (const attr of cell.attrs) {
					if (attr.name === "class" && attr.value.split(" ").includes(className)) {
						result.push(cell);
					}
				}
			}
		}
		return result;
	}

	public static getTextContent(node: Node): string {
		if (node.nodeName === "#text") {
			return (node as any).value.trim();
		}

		let textContent = "";
		if ("childNodes" in node) {
			for (const childNode of node.childNodes) {
				textContent += this.getTextContent(childNode) + " ";
			}
		}
		return textContent.trim();
	}

	public static getHref(node: Node): string {
		if (node.nodeName === "a") {
			for (const { name, value } of node.attrs) {
				if (name === "href") {
					return value;
				}
			}
		}
		let hrefLink = "";
		if ("childNodes" in node) {
			for (const childNode of node.childNodes) {
				hrefLink += this.getHref(childNode);
			}
		}
		return hrefLink;
	}
}
