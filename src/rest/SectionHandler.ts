import { InsightDatasetKind, InsightError, NotFoundError } from "../controller/IInsightFacade";
import { Request, Response } from "express";
import Log from "@ubccpsc310/folder-test/build/Log";
import InsightFacade from "../controller/InsightFacade";
import { StatusCodes } from "http-status-codes";

export class SectionHandler {
	private facade: InsightFacade;

	constructor() {
		this.facade = new InsightFacade();
	}

	public async addDataset(req: Request, res: Response): Promise<void> {
		try {
			Log.info(`SectionHandler::addDataset(..) - params: ${JSON.stringify(req.params)}`);
			const { id, kind } = req.params;
			const response = await this.facade.addDataset(id, req.body.toString("base64"), kind as InsightDatasetKind);
			res.status(StatusCodes.OK).json({ result: response });
		} catch (err) {
			res.status(StatusCodes.BAD_REQUEST).json({ error: (err as Error).message });
		}
	}

	public async removeDataset(req: Request, res: Response): Promise<void> {
		try {
			Log.info(`SectionHandler::removeDataset(..) - params: ${JSON.stringify(req.params)}`);
			const { id } = req.params;
			const response = await this.facade.removeDataset(id);
			res.status(StatusCodes.OK).json({ result: response });
		} catch (err) {
			if (err instanceof NotFoundError) {
				res.status(StatusCodes.NOT_FOUND);
			}
			if (err instanceof InsightError) {
				res.status(StatusCodes.BAD_REQUEST);
			}
			res.json({ error: (err as Error).message });
		}
	}

	public async listDatasets(req: Request, res: Response): Promise<void> {
		Log.info(`SectionHandler::listDatasets(..) - params: ${JSON.stringify(req.params)}`);
		const response = await this.facade.listDatasets();
		res.status(StatusCodes.OK).json({ result: response });
	}

	public async queryDataset(req: Request, res: Response): Promise<void> {
		try {
			Log.info(`SectionHandler::queryDataset(..) - params: ${JSON.stringify(req.params)}`);
			const response = await this.facade.performQuery(req.body);
			res.status(StatusCodes.OK).json({ result: response });
		} catch (err) {
			res.status(StatusCodes.BAD_REQUEST).json({ error: (err as Error).message });
		}
	}
}
