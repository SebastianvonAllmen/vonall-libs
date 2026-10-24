/**
 * Drops and recreates the throwaway test database (`*_test`), then pushes the running package's Drizzle schema into it
 * (`drizzle-kit push` on its drizzle.config.ts: a package ships no migrations, the Products generate theirs).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import pg from "pg";

/** "vonall_test on localhost:5434", for the line a run prints before it drops anything. */
export function describeDatabase(databaseUrl) {
	const url = new URL(databaseUrl);
	return `${url.pathname.slice(1)} on ${url.hostname}:${url.port || "5432"}`;
}

/** Recreates the database. Refuses a name without the `_test` suffix. */
export async function recreateDatabase(databaseUrl) {
	const url = new URL(databaseUrl);
	const name = url.pathname.slice(1);
	if (!name.endsWith("_test")) throw new Error(`Refusing to recreate "${name}": its name must end in _test`);
	const admin = new pg.Client({ connectionString: Object.assign(new URL(url), { pathname: "/postgres" }).toString() });
	await admin.connect();
	try {
		await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
		await admin.query(`CREATE DATABASE "${name}"`);
	} finally {
		await admin.end();
	}
}

/** Pushes the package's schema (drizzle.config.ts in the current directory) into the database; a no-op without one. */
export function pushSchema(databaseUrl) {
	if (!existsSync("drizzle.config.ts")) return;
	const result = spawnSync("pnpm", ["exec", "drizzle-kit", "push", "--force"], {
		env: { ...process.env, TEST_DATABASE_URL: databaseUrl },
		encoding: "utf8",
	});
	if (result.status !== 0) throw new Error(`drizzle-kit push failed:\n${result.stdout}${result.stderr}`);
}
