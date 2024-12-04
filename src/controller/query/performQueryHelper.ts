import { InsightError, InsightResult, ResultTooLargeError } from "../IInsightFacade";
import Log from "@ubccpsc310/folder-test/build/Log";
import fs from "fs-extra";
import Decimal from "decimal.js";

export const MAX_RESULT_LENGTH = 5000;

interface Query {
	WHERE: object;
	OPTIONS: any;
	TRANSFORMATIONS: any;
}

interface Options {
	COLUMNS: string[];
	ORDER: string;
}

export class PerformQuery {
	private id: string;
	private data: InsightResult[];
	private result: InsightResult[];
	private groups: Map<string, InsightResult[]>;
	private query: Query | undefined;

	constructor() {
		this.id = "";
		this.data = [];
		this.result = [];
		this.groups = new Map();
	}

	public async handleQuery(query: unknown): Promise<InsightResult[]> {
		if (typeof query !== "object" || Array.isArray(query) || query === null) {
			throw new InsightError("Query is not an object");
		}

		const queryObj: Query = query as Query;
		this.query = queryObj;

		if (queryObj.WHERE === undefined || queryObj.OPTIONS === undefined) {
			Log.trace("Query doesn't have WHERE and OPTIONS");
			throw new InsightError("Query doesn't have WHERE and OPTIONS");
		}

		const { COLUMNS } = queryObj.OPTIONS as Options;

		this.id = COLUMNS[0].split("_")[0];
		this.data = await this.getSectionsFromDisk();
		this.handleWhere(queryObj.WHERE, queryObj.OPTIONS);

		if (queryObj.TRANSFORMATIONS !== undefined) {
			this.handleTransformations(queryObj.TRANSFORMATIONS);
		}
		if (queryObj.OPTIONS.ORDER !== undefined) {
			this.handleOrder(queryObj.OPTIONS.ORDER);
		}
		if (this.result.length > MAX_RESULT_LENGTH) {
			throw new ResultTooLargeError("Result too large");
		}
		for (const row of this.result) {
			for (const key of Object.keys(row)) {
				if (!queryObj.OPTIONS.COLUMNS.includes(key)) {
					delete row[key];
				}
			}
		}
		return this.result;
	}

	private handleWhere(filter: any, options: any): void {
		// If there is no filter, return the data as is
		if (Object.keys(filter).length === 0) {
			for (const section of this.data) {
				const validSection: any = {};
				for (const column of options.COLUMNS) {
					validSection[column] = section[column];
				}
				this.result.push(validSection);
			}
			return;
		}
		// Otherwise, go through each row and check if it fits the criteria
		for (const section of this.data) {
			if (this.filterData(filter, section)) {
				let validSection: any = {};
				if (this.query?.TRANSFORMATIONS === undefined) {
					for (const column of options.COLUMNS) {
						validSection[column] = section[column];
					}
				} else {
					validSection = section;
				}
				this.result.push(validSection);
			}
		}
	}

	private filterData(filter: any, section: InsightResult): boolean {
		const key = Object.keys(filter)[0];

		if (key === "GT") {
			return this.handleGT(filter, section);
		}
		if (key === "LT") {
			return this.handleLT(filter, section);
		}
		if (key === "EQ") {
			return this.handleEQ(filter, section);
		}
		if (key === "IS") {
			return this.handleIS(filter, section);
		}
		if (key === "AND") {
			return this.handleAND(filter, section);
		}
		if (key === "OR") {
			return this.handleOR(filter, section);
		}
		if (key === "NOT") {
			return !this.filterData(filter.NOT, section);
		}
		return false;
	}

	private handleOR(filter: any, section: InsightResult): boolean {
		const conditions = filter.OR;
		return conditions.some((cond: any) => this.filterData(cond, section));
	}

	private handleAND(filter: any, section: InsightResult): boolean {
		const conditions = filter.AND;
		return conditions.every((cond: any) => this.filterData(cond, section));
	}

	private handleIS(filter: any, section: InsightResult): boolean {
		const condition = filter.IS;
		const key = Object.keys(condition)[0];
		const pattern: string = condition[key];

		// Check if the column contains the pattern
		if (pattern.startsWith("*") && pattern.endsWith("*")) {
			return (section[key] as string).includes(pattern.slice(1, -1));
		}
		// Check if the column starts with the pattern
		if (pattern.endsWith("*")) {
			return (section[key] as string).startsWith(pattern.slice(0, -1));
		}
		// Check if the column ends with the pattern
		if (pattern.startsWith("*")) {
			return (section[key] as string).endsWith(pattern.substring(1));
		}
		return (section[key] as string) === pattern;
	}

	private handleGT(filter: any, section: InsightResult): boolean {
		const condition = filter.GT;
		const key = Object.keys(condition)[0];
		const value = condition[key];

		return section[key] > value;
	}

	private handleLT(filter: any, section: InsightResult): boolean {
		const condition = filter.LT;
		const key = Object.keys(condition)[0];
		const value = condition[key];

		return section[key] < value;
	}

	private handleEQ(filter: any, section: InsightResult): boolean {
		const condition = filter.EQ;
		const key = Object.keys(condition)[0];
		const value = condition[key];

		return section[key] === value;
	}

	private async getSectionsFromDisk(): Promise<InsightResult[]> {
		const sections: InsightResult[] = [];

		if (!(await fs.pathExists(`./data/${this.id}.json`))) {
			throw new InsightError("Dataset not added");
		}
		const dataset = await fs.readJson(`./data/${this.id}.json`);

		if (dataset.length === 0) {
			throw new InsightError("Dataset not added");
		}

		for (const section of dataset.content) {
			sections.push(section);
		}
		return sections;
	}

	private sort(order: string): void {
		this.result.sort((a: any, b: any): number => {
			if (a[order] < b[order]) {
				return -1;
			}
			if (a[order] > b[order]) {
				return 1;
			}
			return 0;
		});
	}

	private handleOrder(order: any): void {
		if (typeof order === "string") {
			this.sort(order);
		} else {
			this.sortByKeys(order.dir, order.keys);
		}
	}

	private handleTransformations(TRANSFORMATIONS: any): void {
		this.handleGroups(TRANSFORMATIONS.GROUP);
		this.handleApply(TRANSFORMATIONS.APPLY);
	}

	private handleGroups(groupKeys: any): void {
		for (const obj of this.result) {
			const objKeys = this.pick_keys(obj, groupKeys);
			let groupMembers = this.groups.get(objKeys);
			if (groupMembers === undefined) {
				groupMembers = [obj];
				this.groups.set(objKeys, groupMembers);
			} else {
				groupMembers.push(obj);
				this.groups.set(objKeys, groupMembers);
			}
		}
	}

	private checkValidValue(value: any): number {
		if (value === null || value === undefined) {
			throw new InsightError(`operation encountered null value`);
		}
		if (typeof value !== "number" || isNaN(value)) {
			throw new InsightError(`Expected numeric value, got ${typeof value}`);
		}
		return value;
	}

	private handleApply(applyCriteria: any[]): void {
		const PRECISION = 2;
		const applied = [];
		for (const [key, groupMembers] of this.groups) {
			const group = JSON.parse(key);
			if (groupMembers.length === 0) {
				continue;
			}
			for (const criteria of applyCriteria) {
				const applyKey: string = Object.keys(criteria)[0];
				const applyVal = criteria[applyKey];
				const applyFunc = Object.keys(applyVal)[0];
				const groupApplyKey = applyVal[applyFunc];
				if (applyFunc === "AVG") {
					const avg = this.calculateAvg(groupMembers, groupApplyKey);
					group[applyKey] = Number(avg.toFixed(PRECISION));
				}
				if (applyFunc === "MAX") {
					group[applyKey] = this.calculateMax(groupMembers, groupApplyKey);
				}
				if (applyFunc === "MIN") {
					group[applyKey] = this.calculateMin(groupMembers, groupApplyKey);
				}
				if (applyFunc === "SUM") {
					const sum = this.calculateSum(groupMembers, groupApplyKey);
					group[applyKey] = Number(sum.toFixed(PRECISION));
				}
				if (applyFunc === "COUNT") {
					group[applyKey] = this.calculateCount(groupMembers, groupApplyKey);
				}
			}

			applied.push(group);
		}
		this.result = applied;
	}

	private calculateAvg(group: InsightResult[], groupKey: number): number {
		let total = new Decimal(0);
		for (const member of group) {
			total = Decimal.add(total, new Decimal(this.checkValidValue(member[groupKey])));
		}
		return total.toNumber() / group.length;
	}

	private calculateMax(groupMembers: InsightResult[], groupApplyKey: any): number {
		let max = this.checkValidValue(groupMembers[0][groupApplyKey]);

		for (const members of groupMembers) {
			if (members[groupApplyKey] > max) {
				max = this.checkValidValue(members[groupApplyKey]);
			}
		}
		return max as number;
	}

	private calculateMin(groupMembers: InsightResult[], groupApplyKey: any): number {
		let min = this.checkValidValue(groupMembers[0][groupApplyKey]);
		for (const members of groupMembers) {
			if (members[groupApplyKey] < min) {
				min = this.checkValidValue(members[groupApplyKey]);
			}
		}
		return min as number;
	}

	private calculateSum(groupMembers: InsightResult[], groupApplyKey: any): number {
		let total = new Decimal(0);
		for (const member of groupMembers) {
			total = Decimal.add(total, new Decimal(this.checkValidValue(member[groupApplyKey])));
		}
		return total.toNumber();
	}

	private calculateCount(groupMembers: InsightResult[], groupApplyKey: any): number {
		return [...new Set(groupMembers.map((member) => member[groupApplyKey]))].length;
	}

	// Given an object and a list of keys, it filters out those keys from the object and return a new object with those keys
	private pick_keys(obj: object, keys: string[]): string {
		return JSON.stringify(Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k))));
	}

	private sortByKeys(dir: string, keys: string[]): void {
		this.result.sort((a: any, b: any): number => {
			for (const key of keys) {
				if (a[key] === b[key]) {
					continue;
				}
				if (a[key] < b[key]) {
					return dir === "UP" ? -1 : 1;
				}
				if (a[key] > b[key]) {
					return dir === "UP" ? 1 : -1;
				}
			}
			return 0;
		});
	}
}
