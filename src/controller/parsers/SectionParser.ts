import { AbstractParser } from "./AbstractParser";
import { InsightError, InsightResult } from "../IInsightFacade";
import JSZip from "jszip";
import Section from "../utils/Section";
import Log from "@ubccpsc310/folder-test/build/Log";

export class SectionParser extends AbstractParser {
	constructor(id: string, content: string) {
		super(id, content);
	}

	public async isValid(): Promise<boolean> {
		//check if mod 4, check if includes special characters, == OK if its at second last or last pos
		return (await super.isValid()) && (await this.checkZipDirectory());
	}

	public async parse(): Promise<InsightResult[]> {
		const sectionsArray: InsightResult[] = [];

		const zip = await JSZip.loadAsync(this.content, { base64: true });

		// Use `Promise.all()` to handle asynchronous processing for all entries
		await Promise.all(
			zip
				.filter((_, zipEntry) => !zipEntry.dir) // Filter out directories
				.map(async (zipEntry) => {
					const fileData = await zipEntry.async("text");
					let results;

					try {
						results = JSON.parse(fileData);
					} catch (_) {
						throw new InsightError("Syntax Error in JSON file");
					}

					if (results && results.result.length !== 0) {
						for (const section of results.result) {
							const sectionObj = new Section(section);
							if (sectionObj.checkSection()) {
								sectionsArray.push(sectionObj.getSection(this.id));
							}
						}
					}
				})
		);

		if (sectionsArray.length === 0) {
			throw new InsightError("error no sections occured");
		}

		return sectionsArray;
	}

	private async checkZipDirectory(): Promise<boolean> {
		try {
			//Load the binary data into JSZip
			const zip = await JSZip.loadAsync(this.content, { base64: true });

			//Need to check if more than 1 Directory? or nah
			let rootDirectory: string | null = null;

			zip.forEach((relativePath) => {
				// Extract the first part of the relative path to identify the root directory
				const parts = relativePath.split("/");
				rootDirectory = parts[0];
				if (rootDirectory !== "courses") {
					throw new InsightError();
				}
			});

			return true;
		} catch (err) {
			Log.error(err);
			return false;
		}
	}
}
