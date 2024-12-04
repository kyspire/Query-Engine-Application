// Gets the ids
import fs from "fs-extra";
import { InsightError } from "../IInsightFacade";
import Log from "@ubccpsc310/folder-test/build/Log";

// export async function checkValidID(id: string, content: string): Promise<boolean> {
// 	if (id.includes("_") || id.length === 0 || id.replace(/\s/g, "").length === 0) {
// 		throw new InsightError("Invalid ID");
// 	}
// 	const two = 2;
// 	const contentStringNoPad = content.substring(0, content.length - two);
// 	//check if mod 4, check if includes special characters, == OK if its at second last or last pos
// 	if (!isValidBase64(content) || contentStringNoPad.includes("=")) {
// 		throw new InsightError("Invalid Zip");
// 	}
// 	return true;
// }

export async function getIds(): Promise<string[]> {
	const result: string[] = [];
	for (const file of await fs.readdir("./data")) {
		result.push(file.split(".")[0]);
	}
	return result;
}

export async function createEmptyDataset(filePath: string): Promise<void> {
	try {
		await fs.ensureFile(filePath);
	} catch (err) {
		Log.trace(`Error creating file ${err}`);
	}
}

export function checkValidQueryString(query: unknown): boolean {
	const queryInput: string = JSON.stringify(query) as string;
	try {
		JSON.parse(queryInput);
	} catch (_) {
		throw new InsightError("Invalid JSON");
	}
	return true;
}
