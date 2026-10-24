import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import ts from "typescript-eslint";

// Remote functions SvelteKit allows a .remote.ts file to export, plus the login and permission wrappers of @vonall/auth
// (protectedQuery, adminSchemaCommand, …), which each return a query, command or form.
const REMOTE = "/^(query|command|form|prerender|protectedQuery|protectedSchemaQuery|protectedCommand|protectedSchemaCommand|protectedForm|adminQuery|adminSchemaQuery|adminCommand|adminSchemaCommand)$/";

const NATIVE_PRIVATE = {
	selector:
		"PropertyDefinition[accessibility='private'], MethodDefinition[accessibility='private'], TSParameterProperty[accessibility='private']",
	message: "Use a native #private field instead of the `private` keyword.",
};
// Database access goes through the repositories
const DB_ACCESS_PATHS = [
	{
		name: "drizzle-orm",
		allowTypeImports: true,
		message: "Query the database in a repository (src/lib/server/repositories) of the package.",
	},
];
// Server code runs outside a logged-in request too (sign-in hooks, the MCP endpoint), where remote functions' login
// checks fail; it calls repositories and services instead
const REMOTE_FUNCTION_IMPORTS = {
	group: ["#lib/remote/*.remote.js", "#lib/remote/*.remote", "**/*.remote.js", "**/*.remote"],
	allowTypeImports: true,
	message: "Server code calls repositories and services, not remote functions: their login check fails outside a logged-in request.",
};
const REMOTE_EXPORTS_ONLY =
	"A .remote.ts file may only export remote functions (query, command, form, prerender). Keep helpers unexported or move them to a module.";

export default ts.config(
	{
		ignores: ["**/.svelte-kit/", "**/dist/", "**/node_modules/", "tooling/package-template/"],
	},
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// Domain types are declared with `type`
			"@typescript-eslint/consistent-type-definitions": ["error", "type"],
			// Destructuring a prop just to keep it out of `...rest` is intended
			"@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
			"no-restricted-syntax": ["error", NATIVE_PRIVATE],
		},
	},
	{
		files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
		languageOptions: {
			parserOptions: {
				extraFileExtensions: [".svelte"],
				parser: ts.parser,
			},
		},
	},
	{
		// Database access goes through the repositories; the schema and a package's create…() (which hands the db to
		// better-auth's adapter) are the exceptions; types may be imported anywhere
		files: ["packages/*/src/**/*.ts", "packages/*/src/**/*.svelte"],
		ignores: [
			"packages/*/src/lib/server/repositories/**",
			"packages/*/src/lib/schema/**",
			"packages/*/src/lib/server/create.ts",
			"**/*.test.ts",
		],
		rules: {
			"@typescript-eslint/no-restricted-imports": ["error", { paths: DB_ACCESS_PATHS }],
		},
	},
	{
		// Overrides the block above for server code, so it repeats DB_ACCESS_PATHS
		files: ["packages/*/src/lib/server/**/*.ts"],
		ignores: ["packages/*/src/lib/server/repositories/**", "packages/*/src/lib/server/create.ts", "**/*.test.ts"],
		rules: {
			"@typescript-eslint/no-restricted-imports": [
				"error",
				{ paths: DB_ACCESS_PATHS, patterns: [REMOTE_FUNCTION_IMPORTS] },
			],
		},
	},
	{
		files: ["packages/*/src/lib/server/repositories/**/*.ts"],
		rules: {
			"@typescript-eslint/no-restricted-imports": ["error", { patterns: [REMOTE_FUNCTION_IMPORTS] }],
		},
	},
	{
		// Mail templates link to absolute external URLs. The base button only forwards its href prop
		files: ["packages/*/src/lib/templates/**/*.svelte", "packages/*/src/lib/components/ui/button/button.svelte"],
		rules: { "svelte/no-navigation-without-resolve": ["error", { ignoreLinks: true }] },
	},
	{
		// Imports across folders use #lib/… (AGENTS.md); a relative import stays inside its own folder. Not for the
		// generated shadcn components, nor tests reaching the shared helpers in tooling/
		files: ["packages/*/src/**/*.ts", "packages/*/src/**/*.svelte"],
		ignores: ["packages/*/src/lib/components/ui/**", "**/*.test.ts"],
		rules: {
			"no-restricted-imports": [
				"error",
				{ patterns: [{ regex: "^\\.\\./(?!.*\\.css$)", message: "Import across folders with #lib/… and the file extension, e.g. #lib/messages.js." }] },
			],
		},
	},
	{
		// The packages' components link to the Product's pages by path (strings through $app/paths' resolve); the
		// packages have no route ids to type them against
		files: ["packages/shell/src/lib/**/*.svelte", "packages/*/src/lib/ui/**/*.svelte"],
		rules: { "svelte/no-navigation-without-resolve": "off" },
	},
	{
		// SvelteKit's App namespace (Locals, Error, …) is extended by declaration merging, which needs interfaces
		files: ["packages/*/src/app.d.ts"],
		rules: { "@typescript-eslint/consistent-type-definitions": "off" },
	},
	{
		// SvelteKit only lets a .remote.ts file export remote functions; anything else fails at build
		files: ["**/*.remote.ts"],
		rules: {
			// Overrides the base no-restricted-syntax, so it repeats NATIVE_PRIVATE
			"no-restricted-syntax": [
				"error",
				NATIVE_PRIVATE,
				{ selector: "ExportNamedDeclaration > FunctionDeclaration", message: REMOTE_EXPORTS_ONLY },
				{
					selector: `ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > .init:not(CallExpression[callee.name=${REMOTE}]):not(CallExpression[callee.object.name=${REMOTE}])`,
					message: REMOTE_EXPORTS_ONLY,
				},
			],
		},
	},
);
