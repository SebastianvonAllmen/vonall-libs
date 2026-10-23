import { defineConfig } from "drizzle-kit";

// Only for the db tests: tooling/db pushes every table (every option on) into the recreated test database
export default defineConfig({
	out: "./node_modules/.cache/drizzle-test",
	schema: "./src/test-schema.ts",
	dialect: "postgresql",
	dbCredentials: { url: process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5437/vonall_test" },
});
