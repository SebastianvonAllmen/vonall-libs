import pg from "pg";
import { TEST_DATABASE_URL } from "./config";

/** Empties every table of the schema, so each test starts from an empty database. Call it in `beforeEach`. */
export async function resetDatabase() {
	const client = new pg.Client({ connectionString: TEST_DATABASE_URL });
	await client.connect();
	try {
		const { rows } = await client.query<{ tablename: string }>("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
		if (rows.length > 0) {
			const tables = rows.map((r) => `"public"."${r.tablename}"`).join(", ");
			await client.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
		}
	} finally {
		await client.end();
	}
}
