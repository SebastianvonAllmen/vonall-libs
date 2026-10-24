/**
 * A new package with the contract every Library keeps (AGENTS.md): `pnpm new <name>` copies tooling/package-template/
 * to packages/<name>, with __NAME__ and __PASCAL__ replaced. Then `pnpm install`.
 */
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const name = process.argv[2];
if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
	console.error("usage: pnpm new <name>   (lowercase, e.g. mail)");
	process.exit(1);
}
const target = join("packages", name);
if (existsSync(target)) {
	console.error(`${target} exists`);
	process.exit(1);
}
const pascal = name.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());

cpSync("tooling/package-template", target, { recursive: true });
const walk = (dir) =>
	readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry);
		return statSync(path).isDirectory() ? walk(path) : [path];
	});
for (const file of walk(target)) {
	const text = readFileSync(file, "utf8");
	writeFileSync(file, text.replaceAll("__NAME__", name).replaceAll("__PASCAL__", pascal));
}
console.log(`${target} created: pnpm install, then write src/lib/index.ts and a changeset`);
