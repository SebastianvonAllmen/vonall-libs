import { TEST_DATABASE_URL } from "./config";
import { describeDatabase, pushSchema, recreateDatabase } from "./recreate.mjs";

/** Recreates the test database and pushes the package's schema, once per `pnpm test:db` run of that package. */
export default async function setup() {
	console.log(`db tests: recreating ${describeDatabase(TEST_DATABASE_URL)}`);
	await recreateDatabase(TEST_DATABASE_URL);
	pushSchema(TEST_DATABASE_URL);
}
