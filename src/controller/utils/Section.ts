import { InsightResult } from "../IInsightFacade";

const DEFAULT_YEAR = 1900;

export default class Section {
	private readonly uuid: string;
	private readonly id: string;
	private readonly title: string;
	private readonly instructor: string;
	private readonly dept: string;
	private readonly year: number;
	private readonly avg: number;
	private readonly pass: number;
	private readonly fail: number;
	private readonly audit: number;

	//json string as input
	constructor(sectionData: RawJsonSectionData) {
		const { id, Course, Title, Professor, Subject, Year, Avg, Pass, Fail, Audit } = sectionData;
		this.uuid = id.toString();
		this.id = Course;
		this.title = Title;
		this.instructor = Professor;
		this.dept = Subject;
		this.year = sectionData.Section === "overall" ? DEFAULT_YEAR : parseInt(Year, 10);
		this.avg = Avg;
		this.pass = Pass;
		this.fail = Fail;
		this.audit = Audit;
	}

	public getSection(datasetID: string): InsightResult {
		return {
			[`${datasetID}_uuid`]: this.uuid,
			[`${datasetID}_id`]: this.id,
			[`${datasetID}_title`]: this.title,
			[`${datasetID}_instructor`]: this.instructor,
			[`${datasetID}_dept`]: this.dept,
			[`${datasetID}_year`]: this.year,
			[`${datasetID}_avg`]: this.avg,
			[`${datasetID}_pass`]: this.pass,
			[`${datasetID}_fail`]: this.fail,
			[`${datasetID}_audit`]: this.audit,
		};
	}

	public checkSection(): boolean {
		return (
			this.uuid !== undefined &&
			this.id !== undefined &&
			this.title !== undefined &&
			this.instructor !== undefined &&
			this.dept !== undefined &&
			this.year !== undefined &&
			this.avg !== undefined &&
			this.pass !== undefined &&
			this.fail !== undefined &&
			this.audit !== undefined
		);
	}
}

interface RawJsonSectionData {
	id: string;
	Course: string;
	Title: string;
	Professor: string;
	Subject: string;
	Year: string;
	Avg: number;
	Pass: number;
	Fail: number;
	Audit: number;
	Section?: string;
}
