import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import fs from "fs-extra";
import path from "node:path";
import { checkValidQueryString, createEmptyDataset, getIds } from "./utils/helpers";
import { PerformQuery } from "./query/performQueryHelper";
import { AbstractParser } from "./parsers/AbstractParser";
import { SectionParser } from "./parsers/SectionParser";
import { BuildingParser } from "./parsers/BuildingParser";
import { checkValidQuery } from "./query/performValidatorHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let parser: AbstractParser;

		if (kind === InsightDatasetKind.Sections) {
			parser = new SectionParser(id, content);
		} else if (kind === InsightDatasetKind.Rooms) {
			parser = new BuildingParser(id, content);
		} else {
			throw new InsightError("Kind not supported");
		}

		if (!(await parser.isValid())) {
			throw new InsightError("Error invalid id or base64 string or no course folder");
		}
		const filePath = path.resolve(__dirname, `../../data/${id}.json`);

		// If [id].json doesn't exist, create an empty one
		if (await fs.pathExists(filePath)) {
			throw new InsightError("Id already exists");
		}

		try {
			const parsed = await parser.parse();
			await createEmptyDataset(filePath);
			await fs.outputJSON(filePath, { id: id, content: parsed, kind: kind });
			return await getIds();
		} catch (e) {
			throw new InsightError((e as Error).message);
		}
	}

	public async removeDataset(id: string): Promise<string> {
		// TODO: Remove this once you implement the methods!

		// Validate id
		if (id.includes("_") || id.length === 0 || id.replace(/\s/g, "").length === 0) {
			throw new InsightError("Invalid id");
		}

		const filePath = path.resolve(__dirname, `../../data/${id}.json`);

		// If the id doesn't exist, throw an error
		if (!(await fs.pathExists(filePath))) {
			throw new NotFoundError("ID does not exist");
		}

		await fs.unlink(filePath);

		return id;
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// TODO: Remove this once you implement the methods!
		checkValidQueryString(query);
		await checkValidQuery(query);
		return new PerformQuery().handleQuery(query);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		const datasetArray: InsightDataset[] = [];
		const readPromises = [];

		if (!(await fs.pathExists("./data"))) {
			return [];
		}

		for (const file of await fs.readdir("./data")) {
			readPromises.push(fs.readJson(`./data/${file}`));
		}
		const datasets = await Promise.all(readPromises);

		for (const dataset of datasets) {
			datasetArray.push({ id: dataset.id, kind: dataset.kind, numRows: dataset.content.length });
		}

		return datasetArray;
	}
}
