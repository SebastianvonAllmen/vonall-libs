import { config } from "dotenv";

// The repository's .env, whichever package the tests run in
config({ path: new URL("../../.env", import.meta.url), quiet: true });

/**
 * The test database; dropped and recreated on every `pnpm test:db` run, so never point it at real data. `.env` may move
 * it (`TEST_DATABASE_URL`, e.g. when the Compose Postgres runs on another port); CI sets it in the environment.
 */
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || "postgres://postgres:postgres@localhost:5434/vonall_test";
