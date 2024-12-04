import * as http from "node:http";

export interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

export class GeoLocation {
	private static URL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team143";

	public static async getLocation(address: string): Promise<GeoResponse> {
		return new Promise((resolve, reject) => {
			const req = http.get(`${this.URL}/${encodeURIComponent(address)}`, (res) => {
				let data = "";

				// Collect data chunks
				res.on("data", (chunk) => {
					data += chunk;
				});

				// Parse the response on end
				res.on("end", () => {
					try {
						const jsonData: GeoResponse = JSON.parse(data);
						resolve(jsonData);
					} catch (_) {
						reject({ error: "Invalid JSON response" });
					}
				});
			});

			// Handle request error
			req.on("error", (error) => {
				reject({ error: error.message });
			});
		});
	}
}
