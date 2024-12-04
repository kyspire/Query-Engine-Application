import { InsightDatasetKind, InsightError } from "../IInsightFacade";
import { checkValidSKEY, checkValidMKEY } from "./performValidatorHelper";
import Log from "@ubccpsc310/folder-test/build/Log";

function handleSum(SUM: string, datasetID: string, kind: InsightDatasetKind): boolean {
	const two = 2;
	if (SUM) {
		const parts = SUM.split("_");
		if (parts.length !== two) {
			throw new InsightError("Invalid ID Found");
		}
		if (parts[0] !== datasetID) {
			throw new InsightError("Invalid ID Found");
		}
		if (!checkValidMKEY(parts[1], kind)) {
			throw new InsightError("Expected Numeric Value");
		}
	}

	return true;
}

function handleAvg(AVG: string, datasetID: string, kind: InsightDatasetKind): boolean {
	const two = 2;
	if (AVG) {
		const parts = AVG.split("_");
		if (parts.length !== two) {
			throw new InsightError("Invalid ID Found");
		}
		if (parts[0] !== datasetID) {
			throw new InsightError("Invalid ID Found");
		}
		if (!checkValidMKEY(parts[1], kind)) {
			throw new InsightError("Expected Numeric Value");
		}
	}

	return true;
}

function handleMin(MIN: string, datasetID: string, kind: InsightDatasetKind): boolean {
	const two = 2;
	if (MIN) {
		const parts = MIN.split("_");
		if (parts.length !== two) {
			throw new InsightError("Invalid ID Found");
		}
		if (parts[0] !== datasetID) {
			throw new InsightError("Invalid ID Found");
		}
		if (!checkValidMKEY(parts[1], kind)) {
			throw new InsightError("Expected Numeric Value");
		}
	}

	return true;
}

function handleMax(MAX: string, datasetID: string, kind: InsightDatasetKind): boolean {
	const two = 2;
	if (MAX) {
		const parts = MAX.split("_");
		if (parts.length !== two) {
			throw new InsightError("Invalid ID Found");
		}
		if (parts[0] !== datasetID) {
			throw new InsightError("Invalid ID Found");
		}
		if (!checkValidMKEY(parts[1], kind)) {
			throw new InsightError("Expected Numeric Value");
		}
	}

	return true;
}

function handleCount(COUNT: string, datasetID: string, kind: InsightDatasetKind): boolean {
	const two = 2;
	if (COUNT) {
		const parts = COUNT.split("_");
		if (parts.length !== two) {
			throw new InsightError("Invalid ID Found");
		}
		if (parts[0] !== datasetID) {
			throw new InsightError("Invalid ID Found");
		}
		if (!checkValidSKEY(parts[1], kind) && !checkValidMKEY(parts[1], kind)) {
			throw new InsightError("Invalid SKEY or MKEY Found.");
		}
	}

	return true;
}

function applyTokenHelper(APPLYTOKEN: any): boolean {
	if (Object.keys(APPLYTOKEN).length !== 1) {
		throw new InsightError("Expected one Apply Token");
	}

	const { MAX, MIN, AVG, COUNT, SUM } = APPLYTOKEN;
	if (!MAX && !MIN && !AVG && !COUNT && !SUM) {
		throw new InsightError("Incorrect Apply Token Found");
	}
	return true;
}

function handleApplyTokenValidation(APPLYTOKEN: any, datasetID: string, kind: InsightDatasetKind): boolean {
	applyTokenHelper(APPLYTOKEN);
	const { MAX, MIN, AVG, COUNT, SUM } = APPLYTOKEN;
	if (COUNT) {
		if (typeof COUNT !== "string") {
			throw new InsightError("COUNT is not a string key");
		}
		handleCount(COUNT, datasetID, kind);
	} else if (MAX) {
		if (typeof MAX !== "string") {
			throw new InsightError("COUNT is not a string key");
		}
		handleMax(MAX, datasetID, kind);
	} else if (MIN) {
		if (typeof MIN !== "string") {
			throw new InsightError("COUNT is not a string key");
		}
		handleMin(MIN, datasetID, kind);
	} else if (AVG) {
		if (typeof AVG !== "string") {
			throw new InsightError("COUNT is not a string key");
		}
		handleAvg(AVG, datasetID, kind);
	} else {
		if (typeof SUM !== "string") {
			throw new InsightError("COUNT is not a string key");
		}
		handleSum(SUM, datasetID, kind);
	}
	return true;
}

function handleApplyBodyValidation(APPLYRULE: any, datasetID: string, kind: InsightDatasetKind): boolean {
	const APPLYBODY = Object.values(APPLYRULE);
	if (APPLYBODY.length !== 1) {
		throw new InsightError("Expected 1 Key in Apply Body.");
	}
	if (typeof APPLYBODY[0] !== "object" || APPLYBODY[0] instanceof Array) {
		throw new InsightError("Apply BodyNot an Object");
	}
	handleApplyTokenValidation(APPLYBODY[0], datasetID, kind);
	return true;
}

function handleApplyRule(APPLYRULE: any, datasetID: string, kind: InsightDatasetKind): string {
	if (typeof APPLYRULE !== "object" || APPLYRULE instanceof Array) {
		throw new InsightError("Apply Rule isn't an object");
	}
	const applyKey = Object.keys(APPLYRULE);
	if (applyKey.length !== 1) {
		throw new InsightError("Expected only 1 key.");
	}
	if (applyKey[0].includes("_")) {
		throw new InsightError("Underscore Found in ID");
	}
	handleApplyBodyValidation(APPLYRULE, datasetID, kind);
	return applyKey[0];
}

function checkColumnKeys(
	columnIds: string[],
	APPLY: any,
	GROUP: any,
	datasetID: string,
	kind: InsightDatasetKind
): boolean {
	const two = 2;
	const cIds: string[] = columnIds;
	const trackKeys: string[] = [];
	APPLY.forEach((APPLYRULE: any) => {
		const key = handleApplyRule(APPLYRULE, datasetID, kind);
		if (trackKeys.includes(key)) {
			throw new InsightError("Duplicate Apply key found.");
		} else {
			trackKeys.push(key);
		}
	});
	GROUP.forEach((key: string) => {
		trackKeys.push(key);
		const parts = key.split("_");
		if (parts.length !== two) {
			throw new InsightError("Can only have MKEY or SKEY, not apply keys.");
		}
		if (!checkValidMKEY(parts[1], kind) && !checkValidSKEY(parts[1], kind)) {
			throw new InsightError("Can only have MKEY or SKEY in groups.");
		}
	});
	cIds.forEach((key) => {
		if (!trackKeys.includes(key)) {
			throw new InsightError("Found a key in Columns Not In Group or Apply");
		}
	});
	return true;
}

export function checkTransformationsField(TRANSFORMATIONS: any): boolean {
	if (TRANSFORMATIONS === undefined) {
		Log.trace("3RD Key present is not TRANSFORMATIONS.");
		throw new InsightError("3RD Key present is not TRANSFORMATIONS.");
	}
	if (typeof TRANSFORMATIONS !== "object" || TRANSFORMATIONS instanceof Array) {
		Log.trace("TRANSFORMATIONS is not an object");
		throw new InsightError("3RD Key present is not TRANSFORMATIONS.");
	}
	return true;
}

export function checkTransformations(TRANS: any, cIDS: string[], dID: string, kind: InsightDatasetKind): boolean {
	const two = 2;
	if (Object.keys(TRANS).length !== two) {
		Log.trace("Expected 2 Keys: Group and Apply.");
		throw new InsightError("Expected 2 Keys: Group and Apply.");
	}
	const { GROUP, APPLY } = TRANS;
	if (GROUP === undefined || APPLY === undefined) {
		throw new InsightError("Group or Apply does not exist.");
	}
	if (typeof GROUP !== "object" || !(GROUP instanceof Array)) {
		throw new InsightError("Group is not an Array");
	}
	if (typeof APPLY !== "object" || !(APPLY instanceof Array)) {
		throw new InsightError("Apply is not an Array");
	}

	checkColumnKeys(cIDS, APPLY, GROUP, dID, kind);

	return true;
}
