import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../../../../../../tooling/db/reset";
import { testDb } from "../../../../../../tooling/db/testDb";
import { createUser, testAuth } from "#lib/testing/index.js";
import { UserRepo } from "#lib/server/repositories/UserRepo.js";
import { EinladungService } from "./einladung.service";

const allowed = async (token: string | undefined) => (await EinladungService.signup(token)).state === "allowed";

const TAG = 24 * 60 * 60 * 1000;
const handle = testDb();

describe("EinladungService", () => {
	beforeAll(() => {
		testAuth(handle.db);
	});
	afterAll(() => handle.end());
	beforeEach(resetDatabase);

	it("lets the first account in without an Einladung, everyone after that only with one", async () => {
		expect(await allowed(undefined)).toBe(true);
		const admin = await createUser("admin@example.com");

		expect(await allowed(undefined)).toBe(false);
		expect(await allowed("guessed")).toBe(false);
		const { token } = await EinladungService.erstellen(admin);
		expect(await allowed(token)).toBe(true);
		expect((await EinladungService.signup(token)).einladung?.inviterName).toBe("Admin");
	});

	it("makes the first account the admin, and only the first", async () => {
		const first = await createUser("first@example.com");
		const second = await createUser("second@example.com");
		expect((await UserRepo.getUserById(first))?.role).toBe("admin");
		expect((await UserRepo.getUserById(second))?.role).toBe("user");
		expect(await UserRepo.countUsers()).toBe(2);
	});

	it("works once", async () => {
		const sebastian = await createUser("sebastian@example.com");
		const { token } = await EinladungService.erstellen(sebastian);
		const lena = await createUser("lena@example.com");
		const tim = await createUser("tim@example.com");

		expect((await EinladungService.annehmen(lena, token)).isOk()).toBe(true);

		expect((await EinladungService.annehmen(tim, token))._unsafeUnwrapErr().kind).toBe("angenommen");
		expect(await allowed(token)).toBe(false);
	});

	it("expires after 14 days", async () => {
		const sebastian = await createUser("sebastian@example.com");
		const heute = new Date("2026-10-17T10:00:00Z");
		const { token } = await EinladungService.erstellen(sebastian, {}, heute);

		expect((await EinladungService.pruefen(token, new Date(heute.getTime() + 13 * TAG))).isOk()).toBe(true);
		expect((await EinladungService.pruefen(token, new Date(heute.getTime() + 15 * TAG)))._unsafeUnwrapErr().kind).toBe("abgelaufen");
	});

	it("can be withdrawn by whoever created it, and then no longer works", async () => {
		const sebastian = await createUser("sebastian@example.com");
		const andere = await createUser("andere@example.com");
		const { id, token } = await EinladungService.erstellen(sebastian, { email: "lena@example.com" });
		expect(await EinladungService.offene(sebastian)).toMatchObject([{ id, email: "lena@example.com" }]);

		expect((await EinladungService.zurueckziehen(andere, id)).isErr()).toBe(true);
		(await EinladungService.zurueckziehen(sebastian, id))._unsafeUnwrap();

		expect(await EinladungService.offene(sebastian)).toEqual([]);
		expect((await EinladungService.pruefen(token))._unsafeUnwrapErr().kind).toBe("unbekannt");
	});

	it("deletes an account with its Einladungen (the foreign keys cascade)", async () => {
		const sebastian = await createUser("sebastian@example.com");
		await EinladungService.erstellen(sebastian);
		await UserRepo.deleteUser(sebastian);
		expect(await UserRepo.getUserById(sebastian)).toBeNull();
		expect(await EinladungService.alleOffenen()).toEqual([]);
	});

	describe("per signup mode", () => {
		it("invite and admin: an Einladung opens signup, nothing else does", async () => {
			const admin = await createUser("admin@example.com");
			const { token } = await EinladungService.erstellen(admin);
			for (const mode of ["invite", "admin"] as const) {
				expect((await EinladungService.signup(undefined, { mode, mail: true })).state).toBe("needs_einladung");
				expect((await EinladungService.signup(token, { mode, mail: true })).state).toBe("allowed");
			}
		});

		it("open: anyone may sign up while mail works, and an Einladung doesn't matter", async () => {
			await createUser("admin@example.com");
			expect((await EinladungService.signup(undefined, { mode: "open", mail: true })).state).toBe("allowed");
			expect((await EinladungService.signup("guessed", { mode: "open", mail: true })).state).toBe("allowed");
			expect((await EinladungService.signup(undefined, { mode: "open", mail: false })).state).toBe("no_mail");
		});

		it("says when it is the first account", async () => {
			expect((await EinladungService.signup(undefined)).firstAccount).toBe(true);
			await createUser("admin@example.com");
			expect((await EinladungService.signup(undefined)).firstAccount).toBe(false);
		});

		it("the first account needs nothing in any mode, not even mail", async () => {
			for (const mode of ["invite", "open", "admin"] as const) {
				expect((await EinladungService.signup(undefined, { mode, mail: false })).state).toBe("allowed");
			}
		});
	});
});
