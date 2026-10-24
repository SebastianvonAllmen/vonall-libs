/**
 * The login and permission wrappers for a Product's remote functions: `protected…` needs a logged-in user, `admin…`
 * an admin (the Admin option). Each returns a query, command or form, so a `.remote.ts` file may export it.
 */
import { error } from "@sveltejs/kit";
import { command, form, getRequestEvent, query, type RemoteFormInput, type RemoteFormInvalidField } from "$app/server";
import type { z } from "zod";
import { m } from "#lib/messages.js";
import type { SessionUser } from "#lib/types.js";

type User = SessionUser;

function throwUnauthorized(): never {
	throw error(401, { message: m().unauthorized, id: "unauthorized", timestamp: new Date().toISOString() });
}

function throwForbidden(): never {
	throw error(403, { message: m().forbidden, id: "forbidden", timestamp: new Date().toISOString() });
}

/** The logged-in user of the current request, else a 401. */
export function requireUser(): User {
	const user = getRequestEvent()?.locals.user;
	if (!user) throwUnauthorized();
	return user;
}

/** The logged-in admin of the current request, else a 401 or 403. */
export function requireAdmin(): User {
	const user = requireUser();
	if (user.role !== "admin") throwForbidden();
	return user;
}

/**
 * SvelteKit types validated input as the schema's Standard Schema output; for a Zod schema that is
 * its `z.output`, which TypeScript can't prove for a generic schema.
 */
function parsed<Schema extends z.ZodType>(data: unknown): z.output<Schema> {
	return data as z.output<Schema>;
}

export function protectedQuery<Result>(callback: (user: User) => Result | Promise<Result>) {
	return query(async () => callback(requireUser()));
}

export function protectedSchemaQuery<Schema extends z.ZodType, Result>(schema: Schema, callback: (data: z.output<Schema>, user: User) => Result | Promise<Result>) {
	return query(schema, async (data) => callback(parsed<Schema>(data), requireUser()));
}

export function protectedCommand<Result>(callback: (user: User) => Result | Promise<Result>) {
	return command(async () => callback(requireUser()));
}

export function protectedSchemaCommand<Schema extends z.ZodType, Result>(schema: Schema, callback: (data: z.output<Schema>, user: User) => Result | Promise<Result>) {
	return command(schema, async (data) => callback(parsed<Schema>(data), requireUser()));
}

export function protectedForm<Schema extends z.ZodType<RemoteFormInput, RemoteFormInput>, Result>(
	schema: Schema,
	callback: (data: z.output<Schema>, issue: RemoteFormInvalidField<z.input<Schema>>, user: User) => Result | Promise<Result>,
) {
	// form() checks the schema's booleans with a conditional type that a generic Schema can't resolve
	return form(schema as never, async (data, issue) => callback(parsed<Schema>(data), issue as RemoteFormInvalidField<z.input<Schema>>, requireUser()));
}

export function adminQuery<Result>(callback: (user: User) => Result | Promise<Result>) {
	return query(async () => callback(requireAdmin()));
}

export function adminSchemaQuery<Schema extends z.ZodType, Result>(schema: Schema, callback: (data: z.output<Schema>, user: User) => Result | Promise<Result>) {
	return query(schema, async (data) => callback(parsed<Schema>(data), requireAdmin()));
}

export function adminCommand<Result>(callback: (user: User) => Result | Promise<Result>) {
	return command(async () => callback(requireAdmin()));
}

export function adminSchemaCommand<Schema extends z.ZodType, Result>(schema: Schema, callback: (data: z.output<Schema>, user: User) => Result | Promise<Result>) {
	return command(schema, async (data) => callback(parsed<Schema>(data), requireAdmin()));
}
