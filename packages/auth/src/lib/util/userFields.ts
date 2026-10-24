import { err, ok, type Result } from "neverthrow";

/** What the profile form may say about a Product's own column on `user`: its better-auth type, for the coercion. */
export type UserFieldDef = { type: string | readonly string[] | string[] };

/**
 * The profile form's extra keys, checked against the Product's `userFields` and coerced to the field's type: a string
 * stays one (empty: null), a `number` is parsed, a `boolean` is "true"/"on"/"1". A key the Product didn't declare, or a
 * value that doesn't parse, is refused with the key's name.
 */
export function parseUserFields(input: Record<string, string>, fields: Record<string, UserFieldDef>): Result<Record<string, string | number | boolean | null>, string> {
	const out: Record<string, string | number | boolean | null> = {};
	for (const [key, raw] of Object.entries(input)) {
		const field = fields[key];
		if (!field) return err(key);
		const value = raw.trim();
		if (value === "") {
			out[key] = null;
			continue;
		}
		if (field.type === "number") {
			const n = Number(value);
			if (!Number.isFinite(n)) return err(key);
			out[key] = n;
		} else if (field.type === "boolean") {
			out[key] = ["true", "on", "1"].includes(value.toLowerCase());
		} else {
			out[key] = value;
		}
	}
	return ok(out);
}
