import { InsightResult } from "../IInsightFacade";

export abstract class AbstractParser {
	protected id: string;
	protected content: string;

	protected constructor(id: string, content: string) {
		this.id = id;
		this.content = content;
	}

	public abstract parse(): Promise<InsightResult[]>;
	public async isValid(): Promise<boolean> {
		// Checks valid ID
		return (
			!(this.id.includes("_") || this.id.length === 0 || this.id.replace(/\s/g, "").length === 0) &&
			this.isValidBase64()
		);
	}

	private isValidBase64(): boolean {
		return Buffer.from(this.content, "base64").toString("base64") === this.content;
	}
}
