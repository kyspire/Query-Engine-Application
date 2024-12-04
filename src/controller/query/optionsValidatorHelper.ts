import { InsightDatasetKind, InsightError } from "../IInsightFacade";
import { checkValidSKEY, checkValidMKEY } from "./performValidatorHelper";
import Log from "@ubccpsc310/folder-test/build/Log";

function orderAndColumnsValidation(COLUMNS: any, ORDER: any, options: any): boolean {
	if (COLUMNS === undefined || COLUMNS.length === 0 || !Array.isArray(COLUMNS)) {
		//Log.trace("No Columns key or empty Columns ");
		throw new InsightError("No Columns Key or empty Columns");
	}
	const two = 2;
	if (Object.keys(options).length === two && ORDER === undefined) {
		//Log.trace("Invalid Order Key");
		throw new InsightError("Invalid Order Key");
	}
	if (Object.keys(options).length > two) {
		//Log.trace("Excess Keys Error");
		throw new InsightError("Excess Keys Error");
	}
	if (ORDER && typeof ORDER !== "string" && typeof ORDER !== "object") {
		throw new InsightError("Incorrect type for Order");
	}
	if (ORDER instanceof Array) {
		throw new InsightError("Incorrect type for Order");
	}
	return true;
}
//need to fix this. dont need to return ids, just need to validate it when apply is/isnt present
function checkColumnIds(COLUMNS: any, datasetID: string, state: boolean, kind: InsightDatasetKind): boolean {
	COLUMNS.map((ids: string) => {
		const two = 2;
		if (!state) {
			const parts = ids.split("_");
			if (parts.length !== two) {
				throw new InsightError("Found apply key when transformations not present");
			}
		}
		if (ids.split("_").length > two) {
			throw new InsightError("Underscores Found");
		}
		if (ids.split("_").length === two) {
			const dataId = ids.split("_")[0];
			if (dataId !== datasetID) {
				throw new InsightError("Cannot parse data from two different IDs");
			}
			const key = ids.split("_")[1];
			if (!checkValidSKEY(key, kind) && !checkValidMKEY(key, kind)) {
				throw new InsightError("Invalid Skey or Mkey Found");
			}
		} else {
			if (ids.includes("_")) {
				throw new InsightError("Apply key has underscore");
			}
		}
	});
	return true;
}

export function optionsHelper(options: any, datasetID: string, state: boolean, kind: InsightDatasetKind): boolean {
	const { COLUMNS, ORDER } = options;
	orderAndColumnsValidation(COLUMNS, ORDER, options);
	const two = 2;
	if ((typeof ORDER === "string" && ORDER && !COLUMNS.includes(ORDER)) || ORDER === "") {
		//Log.trace("Order key must be in columns");
		throw new InsightError("Order Key must be in Columns");
	}
	if (typeof ORDER === "object" && (Object.keys(ORDER) === undefined || Object.keys(ORDER).length !== two)) {
		throw new InsightError("Keys should be dir and keys of length 2.");
	}
	if (typeof ORDER === "object" && Object.keys(ORDER) !== undefined && Object.keys(ORDER).length === two) {
		const { dir, keys } = ORDER;
		if (dir === undefined || keys === undefined) {
			Log.trace("Invalid dir or keys Key");
			throw new InsightError("Invalid dir or keys Key");
		}
		if (dir !== "UP" && dir !== "DOWN") {
			Log.trace("Invalid Direction");
			throw new InsightError("Invalid Direction in dir");
		}
		const colKeys = COLUMNS;
		if (keys.length === 0) {
			throw new InsightError("Keys list cannot be empty.");
		}
		keys.forEach((key: string) => {
			//dont need to check keys here, will validate in cols.
			if (!colKeys.includes(key)) {
				Log.trace("Sort must have all keys in Cols.");
				throw new InsightError("Sort must have all keys in Cols.");
			}
		});
	}
	return checkColumnIds(COLUMNS, datasetID, state, kind);
}
