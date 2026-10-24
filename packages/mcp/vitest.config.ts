import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		projects: [
			{
				// Pure functions: no database
				extends: true,
				test: {
					name: "unit",
					include: ["src/**/*.test.ts"],
					exclude: ["src/**/*.db.test.ts"],
					environment: "node",
				},
			},
			{
				// Services and repositories against a real Postgres (tooling/db/)
				extends: true,
				test: {
					name: "db",
					include: ["src/**/*.db.test.ts"],
					environment: "node",
					globalSetup: ["../../tooling/db/globalSetup.ts"],
					fileParallelism: false,
				},
			},
		],
	},
});
