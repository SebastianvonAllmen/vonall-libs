import { describe, expect, it } from "vitest";
import { parseUserFields } from "./userFields";

const fields = { surname: { type: "string" }, age: { type: "number" }, newsletter: { type: "boolean" }, gender: { type: ["f", "m"] } };

describe("parseUserFields", () => {
	it("coerces each declared key to its type, an empty value to null", () => {
		expect(parseUserFields({ surname: " Meier ", age: "17", newsletter: "on", gender: "f" }, fields)._unsafeUnwrap()).toEqual({ surname: "Meier", age: 17, newsletter: true, gender: "f" });
		expect(parseUserFields({ surname: "", newsletter: "false" }, fields)._unsafeUnwrap()).toEqual({ surname: null, newsletter: false });
		expect(parseUserFields({}, fields)._unsafeUnwrap()).toEqual({});
	});

	it("refuses an undeclared key and a number that isn't one, naming the key", () => {
		expect(parseUserFields({ role: "admin" }, fields)._unsafeUnwrapErr()).toBe("role");
		expect(parseUserFields({ age: "seventeen" }, fields)._unsafeUnwrapErr()).toBe("age");
	});
});
