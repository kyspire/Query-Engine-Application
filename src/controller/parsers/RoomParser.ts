import { InsightResult } from "../IInsightFacade";
import { HTMLParser } from "./HTMLParser";
import { DefaultTreeAdapterMap } from "parse5";

type Document = DefaultTreeAdapterMap["document"];
type Node = DefaultTreeAdapterMap["node"];

export class RoomParser {
	private id: string;
	private parsedHTML: Document | undefined;

	constructor(id: string) {
		this.id = id;
	}

	public parse(buildingHTML: Document): InsightResult[] {
		this.parsedHTML = buildingHTML;
		const validTable = this.findValidTable();
		if (!validTable) {
			return [];
		}
		const roomsData = [];
		const rows = HTMLParser.findElementsByTagName(validTable, "tr").slice(1);

		for (const row of rows) {
			const data = this.getValidData(row);
			if (Object.keys(data).length !== 0) {
				roomsData.push(data);
			}
		}
		return roomsData;
	}

	private getValidData(row: Node): InsightResult {
		const roomData: InsightResult = {};
		const queryableFields = new Map([
			["number", "views-field-field-room-number"],
			["seats", "views-field-field-room-capacity"],
			["furniture", "views-field-field-room-furniture"],
			["type", "views-field-field-room-type"],
		]);
		for (const [key, field] of queryableFields) {
			const nodes = HTMLParser.findElementsByTagNameAndClassName(row, "td", field);
			if (nodes.length === 0) {
				return {};
			}
			roomData[`${this.id}_${key}`] = HTMLParser.getTextContent(nodes[0]);
		}
		roomData[`${this.id}_seats`] = Number(roomData[`${this.id}_seats`]);
		roomData[`${this.id}_href`] = HTMLParser.getHref(
			HTMLParser.findElementsByTagNameAndClassName(row, "td", "views-field-field-room-number")[0]
		);
		return roomData;
	}

	private findValidTable(): Node | undefined {
		const tables = HTMLParser.findElementsByTagName(this.parsedHTML!, "table");
		for (const table of tables) {
			const validTdCells = HTMLParser.findElementsByTagNameAndClassName(table, "td", "views-field");
			if (validTdCells.length !== 0) {
				return table;
			}
		}
		return undefined;
	}
}
