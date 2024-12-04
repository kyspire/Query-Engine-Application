import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";
import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import Log from "@ubccpsc310/folder-test/build/Log";
//import Log from "@ubccpsc310/folder-test/build/Log";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let invalidKeyData: string;
	let noSectionZip: string;
	let unformattedJSON: string;
	let noFolder: string;
	let stillValid: string;
	let noValidSection: string;
	let campus: string;
	let noIndexFile: string;
	let wrongIndexFile: string;
	let noTableInIndex: string;
	let multipleInvalidTables: string;
	let validTableMultipleTables: string;
	let noBuildingTables: string;
	let noBuildingFileInIndex: string;
	let validFileNotInIndex: string;
	let noValidRoom: string;
	let missingField: string;
	let validEmptyFields: string;
	let geolocationError: string;
	let campusValid: string;
	let oneFileValidInvalid: string;
	let validRoomsWithInvalid: string;
	let stillValidRoomsWithInvalid: string;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		invalidKeyData = await getContentFromArchives("invalidQueryKey.zip");
		noSectionZip = await getContentFromArchives("noSection.zip");
		unformattedJSON = await getContentFromArchives("unformatted.zip");
		noFolder = await getContentFromArchives("noFolder.zip");
		stillValid = await getContentFromArchives("stillValid.zip");
		noValidSection = await getContentFromArchives("invalidDataNoProf.zip");
		campus = await getContentFromArchives("campus.zip");
		noIndexFile = await getContentFromArchives("noIndexFile.zip");
		wrongIndexFile = await getContentFromArchives("roomsInvalidIndex.zip");
		noTableInIndex = await getContentFromArchives("indexNoTable1.zip");
		multipleInvalidTables = await getContentFromArchives("multipleInvalidTables.zip");
		validTableMultipleTables = await getContentFromArchives("validTableWithTwoInvalidTables.zip");
		noBuildingTables = await getContentFromArchives("noValidBuildings.zip");
		noBuildingFileInIndex = await getContentFromArchives("buildingNotInTable.zip");
		validFileNotInIndex = await getContentFromArchives("noAERL.zip");
		noValidRoom = await getContentFromArchives("noValidRoom.zip");
		missingField = await getContentFromArchives("missingFieldNoValidRooms.zip");
		validEmptyFields = await getContentFromArchives("emptyFieldsStillValid.zip");
		geolocationError = await getContentFromArchives("invalidAddress.zip");
		campusValid = await getContentFromArchives("campusValid.zip");
		oneFileValidInvalid = await getContentFromArchives("1FileWithValidAndInvalidSections.zip");
		validRoomsWithInvalid = await getContentFromArchives("validRoomsFound.zip");
		stillValidRoomsWithInvalid = await getContentFromArchives("stillValidRoomsFound.zip");
		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	describe("AddDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should reject with  an empty dataset id", function () {
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should resolve with datasets of different kinds", async function () {
			try {
				await facade.addDataset("sections", stillValid, InsightDatasetKind.Sections);
				const result = await facade.addDataset("rooms", campusValid, InsightDatasetKind.Rooms);
				expect(result).to.have.members(["sections", "rooms"]);
			} catch (e) {
				Log.trace(e);
				expect.fail("Shouln't have failed");
			}
		});

		it("should reject with only whitespaces", function () {
			const result = facade.addDataset("   ", sections, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an underscore", function () {
			const result = facade.addDataset("_", sections, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with multiple underscores", function () {
			const result = facade.addDataset("a_b_", sections, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should resolve adding multiple datasets", async function () {
			await facade.addDataset("ubc", stillValid, InsightDatasetKind.Sections);
			const result = await facade.addDataset("abc", stillValid, InsightDatasetKind.Sections);

			return expect(result).to.have.deep.members(["ubc", "abc"]);
		});

		it("should reject multiple datasets with the same id", async function () {
			try {
				const result = await facade.addDataset("abc", stillValid, InsightDatasetKind.Sections);

				expect(result).to.have.members(["abc"]);
			} catch (_) {
				expect.fail("Shouldn't have thrown an error");
			}
			try {
				await facade.addDataset("abc", stillValid, InsightDatasetKind.Sections);
				expect.fail("Should have thrown above.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject non base-64 encoded strings", function () {
			const result = facade.addDataset(
				"abc",
				sections.replaceAll("=", "-").replaceAll("a", "."),
				InsightDatasetKind.Sections
			);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with no valid sections", function () {
			const result = facade.addDataset("ubc", noValidSection, InsightDatasetKind.Sections);
			return expect(result).to.eventually.to.be.rejectedWith(InsightError);
		});

		it("doesn't contain a valid query key", function () {
			const result = facade.addDataset("abc", invalidKeyData, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset with no section", function () {
			const result = facade.addDataset("abc", noSectionZip, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		//missing a field -> no sections occurred
		it("should reject unformatted dataset", function () {
			const result = facade.addDataset("abc", unformattedJSON, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset with no courses folder", function () {
			const result = facade.addDataset("abc", noFolder, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should NOT reject dataset with valid data", function () {
			const result = facade.addDataset("abc", stillValid, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["abc"]);
		});

		it("should resolve with valid data", function () {
			const result = facade.addDataset("ubc", stillValid, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["ubc"]);
		});

		it("should reject with an empty dataset id", async function () {
			try {
				await facade.addDataset("", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown above."); // fail if no error
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with whitespace id", async function () {
			try {
				await facade.addDataset("     ", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown above."); // fail if no error
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should fulfill with special characters", async function () {
			try {
				const result = await facade.addDataset("!@#$%&", stillValid, InsightDatasetKind.Sections);
				expect(result).to.have.deep.members(["!@#$%&"]);
			} catch (_) {
				expect.fail("Should not have thrown above."); // fail if no error
			}
		});

		it("should reject with a includes _ dataset id", async function () {
			try {
				await facade.addDataset("test1_", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown above."); //fail if no error
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should resolve with unique id", async function () {
			try {
				const result = await facade.addDataset("ubc", stillValid, InsightDatasetKind.Sections);
				expect(result).to.have.deep.members(["ubc"]);
			} catch (_) {
				expect.fail("Should not have thrown above.");
			}
		});

		it("should reject 2nd id because it alr exists", async function () {
			try {
				const result = await facade.addDataset("ubc", stillValid, InsightDatasetKind.Sections);
				expect(result).to.have.deep.members(["ubc"]);
			} catch (_) {
				expect.fail("Should not have thrown above.");
			}

			try {
				await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				expect.fail("Id already exists");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject different facade same disk", async function () {
			const facade1 = new InsightFacade();
			try {
				const result = await facade.addDataset("ubc", stillValid, InsightDatasetKind.Sections);
				expect(result).to.have.deep.members(["ubc"]);
			} catch (_) {
				expect.fail("Should not have thrown above.");
			}

			try {
				await facade1.addDataset("ubc", stillValid, InsightDatasetKind.Sections);
				expect.fail("Id already exists");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject invalid id", async function () {
			const facade1 = new InsightFacade();
			try {
				const result = await facade.addDataset("ubc", stillValid, InsightDatasetKind.Sections);
				expect(result).to.have.deep.members(["ubc"]);
			} catch (_) {
				expect.fail("Should not have thrown above.");
			}

			try {
				await facade1.addDataset("ubc_", stillValid, InsightDatasetKind.Sections);
				expect.fail("Id invalid");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject invalid dataset", async function () {
			try {
				await facade.addDataset("ubc", "iminvalid", InsightDatasetKind.Sections);
				expect.fail("Should have thrown err.");
			} catch (err) {
				//works as intended
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject invalid dataset empty", async function () {
			const sect = await getContentFromArchives("emptyCourses.zip");
			try {
				await facade.addDataset("ubc", sect, InsightDatasetKind.Sections);
				expect.fail("Should have thrown err.");
			} catch (err) {
				//works as intended
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject invalid dataset bad json formatting", async function () {
			const sect = await getContentFromArchives("invalidJson.zip");
			try {
				await facade.addDataset("ubc", sect, InsightDatasetKind.Sections);
				expect.fail("Should have thrown err.");
			} catch (err) {
				//works as intended
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should resolve 3 valid courses with valid sections", async function () {
			const sect = await getContentFromArchives("valid3Courses.zip");
			try {
				const result = await facade.addDataset("ubc", sect, InsightDatasetKind.Sections);
				expect(result).to.have.deep.members(["ubc"]);
			} catch (_) {
				expect.fail("Should have thrown err.");
			}
		});

		it("should reject invalid dataset base64 no valid section no prof", async function () {
			const sect = await getContentFromArchives("invalidDataNoProf.zip");
			try {
				await facade.addDataset("ubc", sect, InsightDatasetKind.Sections);
				expect.fail("Should have thrown err.");
			} catch (err) {
				//works as intended
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset not in courses invalid section no fail", async function () {
			const sect = await getContentFromArchives("invalidNotInCourses.zip");
			try {
				await facade.addDataset("ubc", sect, InsightDatasetKind.Sections);
				expect.fail("Should have thrown err.");
			} catch (err) {
				//works as intended
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset not in courses valid section", async function () {
			const sect = await getContentFromArchives("invalidNotInCoursesValidSection.zip");
			try {
				await facade.addDataset("ubc", sect, InsightDatasetKind.Sections);
				expect.fail("Should have thrown err.");
			} catch (err) {
				//works as intended
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset in courses no sections", async function () {
			const sect = await getContentFromArchives("invalidNoSections.zip");
			try {
				await facade.addDataset("ubc", sect, InsightDatasetKind.Sections);
				expect.fail("Should have thrown err.");
			} catch (err) {
				//works as intended
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should resolve dataset valid sections", async function () {
			const sect = await getContentFromArchives("ValidCourses.zip");
			try {
				const result = await facade.addDataset("ubc", sect, InsightDatasetKind.Sections);
				expect(result).to.have.deep.members(["ubc"]);
			} catch (_) {
				expect.fail("Should not have thrown err.");
			}
		});

		it("should resolve dataset valid 1 section", async function () {
			const sect = await getContentFromArchives("valid1Sections.zip");
			try {
				const result = await facade.addDataset("ubc", sect, InsightDatasetKind.Sections);
				expect(result).to.have.deep.members(["ubc"]);
			} catch (_) {
				expect.fail("Should not have thrown err.");
			}
		});

		it("should resolve dataset valid section empty string as prof", async function () {
			const sect = await getContentFromArchives("validProfWithEmptyString.zip");
			try {
				const result = await facade.addDataset("ubc", sect, InsightDatasetKind.Sections);
				expect(result).to.have.deep.members(["ubc"]);
			} catch (_) {
				expect.fail("Should not have thrown err.");
			}
		});

		it("should resolve dataset 2 sections 1 valid 1 not", async function () {
			const sect = await getContentFromArchives("valid2Sections1Valid.zip");
			try {
				const result = await facade.addDataset("ubc", sect, InsightDatasetKind.Sections);
				expect(result).to.have.deep.members(["ubc"]);
			} catch (_) {
				expect.fail("Should not have thrown err.");
			}
		});

		it("should resolve dataset with rooms", async function () {
			try {
				const result = await facade.addDataset("ubcRooms", campusValid, InsightDatasetKind.Rooms);
				return expect(result).to.have.deep.members(["ubcRooms"]);
			} catch (_) {
				expect.fail("Error occured when it shouldn't have.");
			}
		});

		it("should reject dataset invalid id with rooms", async function () {
			try {
				await facade.addDataset("ubc_Rooms", campus, InsightDatasetKind.Rooms);
			} catch (err) {
				return expect(err).to.be.instanceOf(InsightError);
			}
			expect.fail("Should've thrown error");
		});

		it("should reject dataset invalid zip with rooms", async function () {
			try {
				await facade.addDataset("ubcRooms", "testing", InsightDatasetKind.Rooms);
				expect.fail("Error should have been thrown");
			} catch (err) {
				return expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset no index file with rooms", async function () {
			try {
				await facade.addDataset("ubcRooms", noIndexFile, InsightDatasetKind.Rooms);
				expect.fail("Should've thrown error");
			} catch (err) {
				return expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset wrong index file with rooms", async function () {
			try {
				await facade.addDataset("ubcRooms", wrongIndexFile, InsightDatasetKind.Rooms);
				expect.fail("Should not have thrown error");
			} catch (err) {
				return expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset index file no table with rooms", async function () {
			try {
				await facade.addDataset("ubcRooms", noTableInIndex, InsightDatasetKind.Rooms);
				expect.fail("Should not have thrown error");
			} catch (err) {
				return expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset index file no valid tables with rooms", async function () {
			try {
				await facade.addDataset("ubcRooms", multipleInvalidTables, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown error");
			} catch (err) {
				return expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should resolve dataset index file valid table found with multiple invalid tables with rooms", async function () {
			try {
				const result = await facade.addDataset("ubcRooms", validTableMultipleTables, InsightDatasetKind.Rooms);
				return expect(result).to.have.deep.members(["ubcRooms"]);
			} catch (_) {
				expect.fail("No error should have occured.");
			}
		});

		it("should reject dataset no building files found with rooms", async function () {
			try {
				await facade.addDataset("ubcRooms", noBuildingTables, InsightDatasetKind.Rooms);
				expect.fail("Error not thrown when it should have.");
			} catch (err) {
				return expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset invalid building file but not referenced by index with rooms", async function () {
			try {
				await facade.addDataset("ubcRooms", noBuildingFileInIndex, InsightDatasetKind.Rooms);
				expect.fail("Error not thrown when it should have.");
			} catch (err) {
				return expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset valid building file but not referenced by index with rooms", async function () {
			try {
				await facade.addDataset("ubcRooms", validFileNotInIndex, InsightDatasetKind.Rooms);
				expect.fail("Error not thrown when it should have.");
			} catch (err) {
				return expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset valid building file but no valid room with rooms", async function () {
			try {
				await facade.addDataset("ubcRooms", noValidRoom, InsightDatasetKind.Rooms);
				expect.fail("Error not thrown when it should have.");
			} catch (err) {
				return expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset valid building file but no valid room missing field with rooms", async function () {
			try {
				await facade.addDataset("ubcRooms", missingField, InsightDatasetKind.Rooms);
				expect.fail("Error not thrown when it should have.");
			} catch (err) {
				return expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should resolve dataset index file valid empty fields with rooms", async function () {
			try {
				const result = await facade.addDataset("ubcRooms", validEmptyFields, InsightDatasetKind.Rooms);

				return expect(result).to.have.deep.members(["ubcRooms"]);
			} catch (_) {
				expect.fail("Error thrown when it should not have.");
			}
		});

		it("should reject dataset valid but bad address -> geolocation error with rooms", async function () {
			try {
				await facade.addDataset("ubcRooms", geolocationError, InsightDatasetKind.Rooms);
				expect.fail("Error not thrown when it should have.");
			} catch (err) {
				return expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should resolve with a valid section found with invalid sections", async function () {
			try {
				const result = await facade.addDataset("ubcRooms", oneFileValidInvalid, InsightDatasetKind.Sections);
				return expect(result).to.have.deep.members(["ubcRooms"]);
			} catch (_) {
				expect.fail("Error not thrown when it should have.");
			}
		});

		it("should resolve with a valid section found with multiple invalid sections", async function () {
			try {
				const result = await facade.addDataset("ubcRooms", validRoomsWithInvalid, InsightDatasetKind.Rooms);
				return expect(result).to.have.deep.members(["ubcRooms"]);
			} catch (_) {
				expect.fail("Error not thrown when it should have.");
			}
		});
		it("should resolve with a valid section found still", async function () {
			try {
				const result = await facade.addDataset("ubcRooms", stillValidRoomsWithInvalid, InsightDatasetKind.Rooms);
				return expect(result).to.have.deep.members(["ubcRooms"]);
			} catch (_) {
				expect.fail("Error not thrown when it should have.");
			}
		});
	});

	describe("RemoveDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should reject when no file is found", async function () {
			try {
				await facade.removeDataset("ubc");
				expect.fail("Should've thrown an error");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should reject when file is removed twice", async function () {
			try {
				const added = await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				expect(added).to.have.members(["ubc"]);

				const result = await facade.removeDataset("ubc");
				expect(result).to.equal("ubc");
			} catch (err) {
				expect.fail(`Shouldn't have thrown an error ${err}`);
			}

			try {
				await facade.removeDataset("ubc");
				expect.fail("Should've thrown an error");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("Remove: should reject with  an empty dataset id", function () {
			const result = facade.removeDataset("");

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("Remove: should reject with only whitespaces", function () {
			const result = facade.removeDataset("   ");

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("Remove: should reject with an underscore", function () {
			const result = facade.removeDataset("_");

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("Remove: should reject with multiple underscores", function () {
			const result = facade.removeDataset("a_b_");

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	});

	describe("ListDatasets", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should return an empty array if no datasets are added", async function () {
			try {
				const result = await facade.listDatasets();
				expect(result).to.deep.equal([]);
			} catch (_) {
				expect.fail("Shouldn't have thrown an error");
			}
		});

		it("should return an array with proper fields dataset is added", async function () {
			try {
				const added = await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);

				expect(added).to.have.members(["ubc"]);
				const result = await facade.listDatasets();

				expect(result).to.deep.equal([
					{
						id: "ubc",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					},
				]);
			} catch (_) {
				expect.fail("Shouldn't have thrown an error");
			}
		});
	});

	describe("PerformQuery", function () {
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		async function checkQuery(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);

			expect(input).to.be.a("object");

			let result: InsightResult[] = [];
			try {
				result = await facade.performQuery(input);
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
				if (expected === "InsightError") {
					expect(err).to.be.instanceOf(InsightError);
					return;
				} else if (expected === "ResultTooLargeError") {
					expect(err).to.be.instanceOf(ResultTooLargeError);
					return;
				} else {
					expect.fail("Error type not allowed.");
				}
			}
			if (errorExpected) {
				expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
			}
			expect(result).to.have.deep.members(expected);
		}

		before(async function () {
			facade = new InsightFacade();

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
				facade.addDataset("rooms", campus, InsightDatasetKind.Rooms),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery);
		it("[valid/contains.json] SELECT instructor WHERE instructor = *z*", checkQuery);
		it("[valid/starts.json] SELECT instructor WHERE instructor = *z", checkQuery);
		it("[valid/ends.json] SELECT instructor WHERE instructor = z*", checkQuery);
		it("[valid/no_filter_with_option_column_key_no_order.json]", checkQuery);
		it("[valid/no_filter_with_option_column_key_order_mkey.json]", checkQuery);
		it("[valid/no_filter_with_option_column_key_order_skey.json]", checkQuery);
		it("[valid/filter_with_logic.json]", checkQuery);
		it("[valid/filter_with_gt_mcomparison.json]", checkQuery);
		it("[valid/filter_with_lt_mcomparison.json]", checkQuery);
		it("[valid/filter_with_eq_mcomparison.json]", checkQuery);
		it("[valid/empty_scomparison_string.json]", checkQuery);
		it("[valid/filter_with_negation.json]", checkQuery);
		it("[valid/valid_mega_query.json]", checkQuery);
		it("[valid/valid_group_and_apply.json]", checkQuery);
		it("[valid/valid_group_and_apply_with_multiple_keys.json]", checkQuery);
		it("[valid/group_and_apply_with_count.json]", checkQuery);
		it("[valid/group_and_apply_with_order.json]", checkQuery);
		it("[valid/group_and_apply_with_order_up.json]", checkQuery);
		it("[valid/roomsQuery.json]", checkQuery);
		it("[valid/megaRoomsQuery.json]", checkQuery);
		it("[valid/empty_apply.json]", checkQuery);
		it("[valid/emptyGroup.json]", checkQuery);
		it("[valid/query_with_extra_keys.json]", checkQuery);
		it("[valid/extraApplyKeyValid.json]", checkQuery);

		it("[invalid/mega_query.json]", checkQuery);
		it("[invalid/query_with_no_body.json]", checkQuery);
		it("[invalid/body_with_no_filter.json]", checkQuery);
		it("[invalid/body_with_filter_no_options.json]", checkQuery);
		it("[invalid/body_with_no_filter_no_options.json]", checkQuery);
		it("[invalid/filter_with_empty_negation.json]", checkQuery);
		it("[invalid/filter_with_multiple_negations.json]", checkQuery);
		it("[invalid/filter_with_invalid_mcomparison.json]", checkQuery);
		it("[invalid/filter_with_invalid_mcomparison_with_no_key.json]", checkQuery);
		it("[invalid/filter_with_invalid_mcomparison_with_invalid_key.json]", checkQuery);
		it("[invalid/filter_with_invalid_mcomparison_with_invalid_value.json]", checkQuery);
		it("[invalid/no_filter_with_no_comma.json]", checkQuery);
		it("[invalid/no_filter_with_no_options.json]", checkQuery);
		it("[invalid/no_filter_with_option_no_column.json]", checkQuery);
		it("[invalid/no_filter_with_option_and_column_no_key.json]", checkQuery);
		it("[invalid/no_filter_with_option_and_column_and_invalid_key.json]", checkQuery);
		it("[invalid/no_filter_with_option_column_key_order_no_key.json]", checkQuery);
		it("[invalid/no_filter_with_option_column_key_order_multiple_keys.json]", checkQuery);
		it("[invalid/filter_with_invalid_logic.json]", checkQuery);
		it("[invalid/filter_with_valid_logic_wrong_syntax1.json]", checkQuery);
		it("[invalid/filter_with_valid_logic_wrong_syntax2.json]", checkQuery);
		it("[invalid/filter_with_valid_logic_no_filter.json]", checkQuery);
		it("[invalid/invalid.json] Query missing WHERE", checkQuery);
		it("[invalid/query_with_no_where_but_filter.json] Query missing WHERE", checkQuery);
		it("[invalid/invalid_ref.json] Query references not added dataset", checkQuery);
		it("[invalid/morethan5000.json] SELECT id WHERE {}", checkQuery);
		it("[invalid/multipleref.json] Query referencing multiple datasets", checkQuery);
		it("[invalid/invalid_wildcard.json] Query containing input*string", checkQuery);
		it("[invalid/invalid_wildcard2.json] Query containing ***", checkQuery);
		it("[invalid/empty_scomparison.json]", checkQuery);
		it("[invalid/invalid_skey.json]", checkQuery);
		it("[invalid/invalid_skey2.json]", checkQuery);
		it("[invalid/invalid_excess_keys.json]", checkQuery);
		it("[invalid/invalid_order_empty_string.json]", checkQuery);
		it("[invalid/invalid_order_string_not_in_cols.json]", checkQuery);
		it("[invalid/invalidApplyKey.json] No Apply Key", checkQuery);
		it("[invalid/invalidGroupKey.json] No Group Key", checkQuery);
		it("[invalid/invalidTransformationsKey.json] No Transformations Key", checkQuery);
		it("[invalid/noKeyInGroup.json] No Key in Group", checkQuery);
		it("[invalid/invalidKeyInGroup.json] Invalid Key in Group", checkQuery);
		it("[invalid/KeyInColumnsNotInGroup.json] Key in Cols Not Found in Group", checkQuery);
		it("[invalid/extraKeyInTransformations.json] Extra Key In Transformations", checkQuery);
		it("[invalid/KeysInColumnNotInApply.json] Key in Col not found in apply", checkQuery);
		it("[invalid/duplicateKeyInApply.json] Dupe Key in Apply", checkQuery);
		it("[invalid/invalidApplyKeyWithUnderscore.json] _ in Apply Key", checkQuery);
		it("[invalid/invalidApplyToken.json]  Invalid Apply Token", checkQuery);
		it("[invalid/invalidKeyInsideApplyToken.json]  Invalid skey or mkey in ApplyToken", checkQuery);
		it("[invalid/wrongKeyTypeAVG.json]  AVG not a number", checkQuery);
		it("[invalid/wrongKeyTypeMAX.json]  MAX not a number", checkQuery);
		it("[invalid/wrongKeyTypeMIN.json]  MIN not a number", checkQuery);
		it("[invalid/wrongKeyTypeSUM.json]  SUM not a number", checkQuery);
		it("[invalid/sortOrderKeyMissing.json]  Invalid Order Key", checkQuery);
		it("[invalid/sortOrderInvalidAnyKey.json]  Any key is invalid", checkQuery);
		it("[invalid/sortOrderMissingDirKey.json]  Missing Dir Key", checkQuery);
		it("[invalid/sortOrderKeyDirInvalid.json]  Di instead of Dir Key", checkQuery);
		it("[invalid/sortDirKeyValueInvalid.json]  U instead of UP", checkQuery);
		it("[invalid/sortOrderMissingKeys.json]  no keys field", checkQuery);
		it("[invalid/sortOrderKeysInvalid.json]  key instead of keys", checkQuery);
		it("[invalid/sortKeysEmptyArrayInvalid.json]  keys has empty array err", checkQuery);
		it("[invalid/sortNotAllKeysInCols.json]  dept isn't in cols", checkQuery);
		it("[invalid/sortExtraKeyInKeysNotInCols.json]  all keys in cols present w/ extra dept", checkQuery);
		it("[invalid/columnsApplyKeyButNoTransformationsError.json]  apply key in cols no transform", checkQuery);
		it("[invalid/transformationsMissingGroup.json]  missing group", checkQuery);
		it("[invalid/transformationsMissingApply.json]  missing apply", checkQuery);
		it("[invalid/transformationsGroupEmptyArray.json]  empty group array err", checkQuery);
		it("[invalid/transformationsKeyInColsNotFoundWithApply.json]  hello apply key not found in APPLY", checkQuery);
		it("[invalid/transformationsApplyRule0Keys.json]  0 in Apply Rule, need 1", checkQuery);
		it("[invalid/transformationsApplyRule2Keys.json]  2 in Apply Rule, need 1", checkQuery);
		it("[invalid/transformationsApplyBody0Keys.json]  0 in Apply Body, need 1", checkQuery);
		it("[invalid/transformationsApplyBody2Keys.json]  2 in Apply Body, need 1", checkQuery);
		it("[invalid/transformationsApplyRuleListErrorOn2nd.json]  Testing err catch recursion", checkQuery);
		it("[invalid/roomsInvalidISKey.json]  Wrong S Key in IS Rooms", checkQuery);
		it("[invalid/roomsInvalidGTKey.json]  Wrong M Key in GT Rooms", checkQuery);
		it("[invalid/roomsInvalidLTKey.json]  Wrong M Key in LT Rooms", checkQuery);
		it("[invalid/roomsInvalidEQKey.json]  Wrong M Key in EQ Rooms", checkQuery);
		it("[invalid/roomsInvalidCOLSKey.json]  Wrong S Key in COLS Rooms", checkQuery);
		it("[invalid/roomsInvalidMaxKey.json]  Wrong M Key in Max Rooms", checkQuery);
		it("[invalid/roomsInvalidMinKey.json]  Wrong M Key in Min Rooms", checkQuery);
		it("[invalid/roomsInvalidAvgKey.json]  Wrong M Key in Avg Rooms", checkQuery);
		it("[invalid/roomsInvalidSumKey.json]  Wrong M Key in Sum Rooms", checkQuery);
		it("[invalid/roomsInvalidCountKey.json]  Wrong M Key in Sum Rooms", checkQuery);
		it("[invalid/roomsInvalidAll.json]  Sections Replaced with Rooms", checkQuery);
		it("[invalid/sectionsInvalidAll.json]  Sections Replaced with Rooms", checkQuery);
		it("[invalid/columnKeyNotFoundInGroupOrApply.json]  Col Key Not found in G or A", checkQuery);
	});
});
