import { AbstractParser } from "./AbstractParser";
import { InsightError, InsightResult } from "../IInsightFacade";
import JSZip from "jszip";
import { DefaultTreeAdapterMap } from "parse5";
import { HTMLParser } from "./HTMLParser";
import { GeoLocation } from "../utils/GeoLocation";
import { RoomParser } from "./RoomParser";

type Document = DefaultTreeAdapterMap["document"];
type Node = DefaultTreeAdapterMap["node"];

export class BuildingParser extends AbstractParser {
	private document: Document | undefined;
	private buildingTables: Node[] | undefined;
	private validBuildingTable: Node | undefined;
	private buildingsData: InsightResult[] | undefined;

	constructor(id: string, content: string) {
		super(id, content);
	}

	public async isValid(): Promise<boolean> {
		return await super.isValid();
	}

	public async parse(): Promise<InsightResult[]> {
		const files = await this.getFiles();
		const index = files.get("index.htm");

		if (!index) {
			throw new InsightError("Index file not found");
		}

		this.document = index;
		this.buildingTables = HTMLParser.findElementsByTagName(this.document, "table");

		if (this.buildingTables.length === 0) {
			throw new InsightError("Unable to find a table");
		}

		this.validBuildingTable = this.findValidBuildingTable();

		if (!this.validBuildingTable) {
			throw new InsightError("Unable to find a valid table");
		}
		const roomParser = new RoomParser(this.id);
		this.buildingsData = [];
		const rows = HTMLParser.findElementsByTagName(this.validBuildingTable, "tr").slice(1);
		for (const row of rows) {
			this.getValidData(roomParser, files, row);
		}
		await this.setGeoLocation();

		if (this.buildingsData.length === 0) {
			throw new InsightError("No valid rooms found");
		}

		return this.buildingsData;
	}

	private getValidData(roomParser: RoomParser, files: Map<string, Document>, row: Node): void {
		const buildingData: InsightResult = {};
		const sliceLength = 2;
		const buildingLink = HTMLParser.findElementsByTagNameAndClassName(row, "td", "views-field-title")[0];
		const buildingPath = HTMLParser.getHref(buildingLink);
		const queryableFields = new Map([
			["shortname", "views-field-field-building-code"],
			["fullname", "views-field-title"],
			["address", "views-field-field-building-address"],
		]);
		for (const [key, field] of queryableFields) {
			const nodes = HTMLParser.findElementsByTagNameAndClassName(row, "td", field);
			if (nodes.length === 0) {
				return;
			}
			buildingData[`${this.id}_${key}`] = HTMLParser.getTextContent(nodes[0]);
		}
		const roomsHTML = files.get(buildingPath.slice(sliceLength));
		if (!roomsHTML) {
			return;
		}
		const roomData = roomParser.parse(roomsHTML);
		if (roomData.length > 0) {
			for (const room of roomData) {
				const merged = { ...buildingData, ...room };
				merged[`${this.id}_name`] = merged[`${this.id}_shortname`] + "_" + merged[`${this.id}_number`];
				this.buildingsData?.push(merged);
			}
		}
	}

	// Must be called after setting the address of a building
	private async setGeoLocation(): Promise<void> {
		const geoLocationPromises = [];

		for (const data of this.buildingsData!) {
			geoLocationPromises.push(GeoLocation.getLocation(data[`${this.id}_address`] as string));
		}
		const geoLocations = await Promise.all(geoLocationPromises);
		for (let i = 0; i < this.buildingsData!.length; i++) {
			if (geoLocations[i].error !== undefined) {
				this.buildingsData?.splice(i, 1);
				i--;
				continue;
			}
			this.buildingsData![i][`${this.id}_lat`] = geoLocations[i].lat as number;
			this.buildingsData![i][`${this.id}_lon`] = geoLocations[i].lon as number;
		}
	}

	private async getFiles(): Promise<Map<string, Document>> {
		const files = new Map<string, Document>();
		// Load the zip content (assumed to be in base64)
		const zip = await JSZip.loadAsync(this.content, { base64: true });

		const parsedFilesPromises: Promise<Document>[] = [];
		// Iterate through all files in the zip archive
		zip.forEach((_, file) => {
			parsedFilesPromises.push(HTMLParser.parseFile(file));
		});

		const parsedFiles = await Promise.all(parsedFilesPromises);
		Object.entries(zip.files).forEach(([fileName], index) => {
			files.set(fileName, parsedFiles[index]);
		});

		return files;
	}

	private findValidBuildingTable(): Node | undefined {
		for (const table of this.buildingTables!) {
			const validTdCells = HTMLParser.findElementsByTagNameAndClassName(table, "td", "views-field-title");
			if (validTdCells.length !== 0) {
				return table;
			}
		}
		return undefined;
	}
}
