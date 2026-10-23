import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { TEST_DATABASE_URL } from "./config";

/** A Drizzle handle on the test database for a package's db tests; `end()` it in `afterAll`. */
export function testDb() {
	const pool = new pg.Pool({ connectionString: TEST_DATABASE_URL, max: 2 });
	return { db: drizzle(pool), end: () => pool.end() };
}
