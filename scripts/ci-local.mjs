/**
 * Everything CI checks, run locally first (CI minutes are limited): `pnpm ci:local`
 *
 * check, lint, unit, db and build, in that order, each with its log in a temporary folder; stops at the first failure
 * and shows the end of its log. Exits non-zero when anything failed, so it can gate marking a pull request ready.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const STEPS = ["check", "lint", "test:unit", "test:db", "build"];

/** Runs `pnpm run <script>` with its output in a log file; true when it passed. */
function runStep(script, logDir) {
	const started = Date.now();
	const result = spawnSync("pnpm", ["run", script], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
	const log = join(logDir, `${script.replace(/[^a-z0-9]+/gi, "-")}.log`);
	writeFileSync(log, `${result.stdout ?? ""}${result.stderr ?? ""}`);
	const seconds = Math.round((Date.now() - started) / 1000);
	const ok = result.status === 0;
	console.log(`${ok ? "✓" : "✗"} ${script} (${seconds}s)`);
	if (!ok) console.log(readFileSync(log, "utf8").split("\n").slice(-40).join("\n") + `\n  full log: ${log}`);
	return ok;
}

const logDir = mkdtempSync(join(tmpdir(), "ci-local-"));
for (const step of STEPS) if (!runStep(step, logDir)) process.exit(1);
console.log("✓ everything CI checks passed locally");
