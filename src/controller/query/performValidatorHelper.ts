import { InsightDatasetKind, InsightError } from "../IInsightFacade";
import Log from "@ubccpsc310/folder-test/build/Log";
import fs from "fs-extra";
import { optionsHelper } from "./optionsValidatorHelper";
import { checkTransformationsField, checkTransformations } from "./transformationsValidatorHelper";

export function checkValidMKEY(mkey: string, kind: InsightDatasetKind): boolean {
	const year = "year";
	const avg = "avg";
	const pass = "pass";
	const fail = "fail";
	const audit = "audit";
	if (kind === InsightDatasetKind.Sections) {
		return mkey === year || mkey === avg || mkey === pass || mkey === fail || mkey === audit;
	}
	if (kind === InsightDatasetKind.Rooms) {
		return ["lat", "lon", "seats"].includes(mkey);
	}
	return false;
}

export function checkValidSKEY(skey: string, kind: InsightDatasetKind): boolean {
	Log.trace(skey);
	const uuid = "uuid";
	const id = "id";
	const title = "title";
	const instructor = "instructor";
	const dept = "dept";
	if (kind === InsightDatasetKind.Sections) {
		return skey === uuid || skey === id || skey === title || skey === instructor || skey === dept;
	}
	if (kind === InsightDatasetKind.Rooms) {
		return ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"].includes(skey);
	}
	return false;
}

function getID(COLUMNS: any, TRANSFORMATIONS: any): string {
	if (!COLUMNS || COLUMNS.length === 0) {
		throw new InsightError("Invalid Columns");
	}
	const two = 2;
	if (!TRANSFORMATIONS) {
		for (const keys of COLUMNS) {
			const parts = keys.split("_");
			Log.trace(keys);
			if (parts.length > two) {
				//Log.trace("UnderScore found in id string or invalid skey with _");
				throw new InsightError("Invalid id string or skey");
			}
			if (parts.length === two) {
				return parts[0];
			}
		}
		throw new InsightError("No valid IDS in Columns");
	}
	const { GROUP } = TRANSFORMATIONS;
	if (!GROUP) {
		throw new InsightError("GROUP not in query");
	}
	for (const key of GROUP) {
		const parts = key.split("_");
		Log.trace(key);
		if (parts.length > two) {
			//Log.trace("UnderScore found in id string or invalid skey with _");
			throw new InsightError("Invalid id string or skey");
		}
		if (parts.length === two) {
			return parts[0];
		}
	}
	throw new InsightError("No valid IDS in GROUPS");
}

async function checkValidID(datasetID: string): Promise<boolean> {
	if (datasetID.includes("_") || datasetID.length === 0 || datasetID.replace(/\s/g, "").length === 0) {
		return false;
	}
	return await fs.pathExists(`./data/${datasetID}.json`);
}
function checkValidWhereAndOptionsHelper(WHERE: any, OPTIONS: any): boolean {
	if (WHERE === undefined || OPTIONS === undefined || Object.keys(OPTIONS).length === 0) {
		//Log.trace("Query doesn't have WHERE and/or OPTIONS");
		throw new InsightError("Query doesn't have WHERE and OPTIONS");
	}
	if (typeof WHERE !== "object" || Array.isArray(WHERE) || WHERE === null) {
		//Log.trace("Where is not JSON obj");
		throw new InsightError("WHERE is not an object");
	}
	if (typeof OPTIONS !== "object" || Array.isArray(OPTIONS) || OPTIONS === null) {
		//Log.trace("Options is not JSON obj");
		throw new InsightError("WHERE is not an object");
	}
	return true;
}

function checkValidInputString(inputString: string): boolean {
	Log.trace(inputString);
	if (inputString === "") {
		return true;
	}
	const parts = inputString.split("*");
	if (parts.length === 1) {
		return true;
	}
	const three = 3;
	const two = 2;
	if (parts.length === three) {
		if (parts[0] === "" && parts[two] === "") {
			return true;
		} else {
			Log.trace("Asterix Allowed only at begin or end of string");
			throw new InsightError("Asterix Allowed only at begin or end of string");
		}
	}
	if (parts.length === two) {
		if (parts[0] === "" && parts[1] === inputString.substring(1, inputString.length)) {
			return true;
		}
		if (parts[0] === inputString.substring(0, inputString.length - 1) && parts[1] === "") {
			return true;
		}
		Log.trace("Asterix Allowed only at begin or end of string");
		throw new InsightError("Asterix Allowed only at begin or end of string");
	}
	Log.trace("More than 2 asterixs detected");
	throw new InsightError("More than 2 asterixs detected");
}

async function handleFuncValidation(queryObject: any, datasetID: string, kind: InsightDatasetKind): Promise<boolean> {
	const op = Object.keys(queryObject)[0];
	switch (op) {
		case "AND":
			await handleLogicValidation(queryObject[op], datasetID, kind);
			break;
		case "OR":
			await handleLogicValidation(queryObject[op], datasetID, kind);
			break;
		case "GT":
			await handleMCOMPValidation(queryObject[op], datasetID, kind);
			break;
		case "LT":
			await handleMCOMPValidation(queryObject[op], datasetID, kind);
			break;
		case "EQ":
			await handleMCOMPValidation(queryObject[op], datasetID, kind);
			break;
		case "NOT":
			await handleNegationValidation(queryObject[op], datasetID, kind);
			break;
		case "IS":
			await handleSCOMPValidation(queryObject[op], datasetID, kind);
			break;
		default:
			Log.trace("Operator Error Occured when it should not");
			throw new InsightError("Operation not allowed");
	}
	return true;
}

async function handleLogicValidation(operator: any, datasetID: string, kind: InsightDatasetKind): Promise<boolean> {
	const len = operator.length;
	const promises = [];

	for (let i = 0; i < len; i++) {
		const { AND, OR, GT, LT, EQ, NOT, IS } = operator[i];

		if (!GT && !LT && !EQ && !NOT && !AND && !OR && !IS) {
			Log.trace("Invalid Key Found");
			throw new InsightError("Invalid Key Found");
		}

		// Push the promise from handleFunctionsValidation into the array
		promises.push(handleFuncValidation(operator[i], datasetID, kind));
	}

	// Wait for all promises to resolve
	await Promise.all(promises);
	return true;
}

async function handleMCOMPValidation(operator: any, datasetID: string, kind: InsightDatasetKind): Promise<boolean> {
	Log.trace(operator);
	if (typeof operator !== "object" || Array.isArray(operator) || operator === null) {
		throw new InsightError("MCOMP is not an object");
	}
	const mcomp = Object.keys(operator);
	if (mcomp.length !== 1) {
		Log.trace("MCOMP should only have 1 key.");
		throw new InsightError("MCOMP should only have 1 key.");
	}
	const parts = mcomp[0].split("_");
	const two = 2;
	if (parts.length !== two) {
		Log.trace("Underscore found in id or mkey");
		throw new InsightError("Underscore found in id or mkey");
	}
	const mkey = parts[1];
	const idstring = parts[0];
	if (!checkValidMKEY(mkey, kind)) {
		Log.trace("Invalid mkey");
		throw new InsightError("Invalid MKEY");
	}
	if (idstring !== datasetID) {
		Log.trace("Ids dont match");
		throw new InsightError("Multiple Ids found");
	}
	await checkValidID(idstring);
	const val = operator[mcomp[0]];
	if (typeof val !== "number") {
		Log.trace("Invalid MComp type, not a number");
		throw new InsightError("Invalid MComp type, not a number");
	}
	return true;
}

async function handleSCOMPValidation(operator: any, datasetID: string, kind: InsightDatasetKind): Promise<boolean> {
	if (typeof operator !== "object" || Array.isArray(operator) || operator === null) {
		throw new InsightError("SCOMP is not an object");
	}
	const scomp = Object.keys(operator);
	if (scomp.length !== 1) {
		//Log.trace("SCOMP should only have 1 key.");
		throw new InsightError("SCOMP should only have 1 key.");
	}
	const two = 2;
	const parts = scomp[0].split("_");
	if (parts.length !== two) {
		//Log.trace("Underscore found in id or skey");
		throw new InsightError("Underscore found in id or skey");
	}
	const skey = parts[1];
	const idstring = parts[0];
	if (!checkValidSKEY(skey, kind)) {
		//Log.trace("Invalid SKEY");
		throw new InsightError("Invalid SKEY");
	}
	if (idstring !== datasetID) {
		//Log.trace("Ids dont match");
		throw new InsightError("Multiple Ids found");
	}
	const idRes = await checkValidID(idstring);
	if (!idRes) {
		Log.trace("Invalid ID Found");
		throw new InsightError("Invalid ID Found");
	}
	const val = operator[scomp[0]];
	if (typeof val !== "string") {
		throw new InsightError("Invalid SComp type, it isn't a string");
	}
	checkValidInputString(val);
	return true;
}

async function handleNegationValidation(operator: any, datasetID: string, kind: InsightDatasetKind): Promise<boolean> {
	if (Object.keys(operator).length !== 1) {
		Log.trace("NOT has more than 1 Filter");
		throw new InsightError("NOT has more than 1 Filter!");
	}
	await handleLogicValidation([operator], datasetID, kind);
	return true;
}

//function getIdsFromApply(apply: any): string[] {
//	return apply.map((func:any) =>  Object.keys(func)[0])
//}

function checkValidOptions(options: any, datasetID: string, state: boolean, kind: InsightDatasetKind): boolean {
	return optionsHelper(options, datasetID, state, kind);
}

async function checkValidWhere(where: any, datasetID: string, kind: InsightDatasetKind): Promise<boolean> {
	Log.trace(Object.keys(where));
	// Log.trace(datasetID);
	if (Object.keys(where).length === 0) {
		return true;
	}
	if (Object.keys(where).length !== 1) {
		Log.trace("Invalid Keys error, can only have 1 key");
		throw new InsightError("Invalid Keys error, can only have 1 key");
	}
	const { AND, OR, GT, LT, EQ, NOT, IS } = where;
	if (!GT && !LT && !EQ && !NOT && !AND && !OR && !IS) {
		Log.trace("Invalid Key Found");
		throw new InsightError("Invalid Key Found");
	}
	await handleFuncValidation(where, datasetID, kind);
	return true;
}

async function getKind(datasetID: string): Promise<InsightDatasetKind> {
	try {
		const content = await fs.readJson(`./data/${datasetID}.json`);
		return content.kind;
	} catch (_) {
		throw new InsightError("Error getting kind of dataset");
	}
}

export async function checkValidQuery(query: unknown): Promise<boolean> {
	let state = false;
	if (typeof query !== "object" || Array.isArray(query) || query === null) {
		throw new InsightError("Query is not an object");
	}
	const parsedQuery = JSON.parse(JSON.stringify(query));
	const { WHERE, OPTIONS, TRANSFORMATIONS } = parsedQuery;
	checkValidWhereAndOptionsHelper(WHERE, OPTIONS);
	const maxQueryKeys = 3;
	if (Object.keys(parsedQuery).length > maxQueryKeys) {
		throw new InsightError("Excess Keys Error");
	}
	if (Object.keys(parsedQuery).length === maxQueryKeys) {
		checkTransformationsField(TRANSFORMATIONS);
		state = true;
	}
	const { COLUMNS } = OPTIONS;
	Log.trace(COLUMNS);
	const datasetID = getID(COLUMNS, TRANSFORMATIONS);
	if (!(await checkValidID(datasetID))) {
		throw new InsightError("Invalid ID");
	}
	const kind = await getKind(datasetID);
	checkValidOptions(OPTIONS, datasetID, state, kind);
	await checkValidWhere(WHERE, datasetID, kind);
	if (TRANSFORMATIONS !== undefined) {
		checkTransformations(TRANSFORMATIONS, COLUMNS, datasetID, kind);
	}
	return true;
}
