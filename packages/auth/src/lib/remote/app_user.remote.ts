import { error, redirect } from "@sveltejs/kit";
import { getRequestEvent } from "$app/server";
import { z } from "zod";
import { m } from "#lib/messages.js";
import { adminQuery, adminSchemaCommand, protectedCommand, protectedForm, protectedQuery, protectedSchemaCommand } from "#lib/server/helpers.js";
import { authContext } from "#lib/server/context.js";
import { userRepo } from "#lib/server/repositories/UserRepo.js";
import { emailSchema, nameSchema, passwordSchema } from "#lib/types.js";
import { isSessionNotFresh, reauthPath } from "#lib/util/fresh.js";
import { parseUserFields } from "#lib/util/userFields.js";

/** The Admin option: every account. */
export const getAllUsers = adminQuery(async () => {
	return await userRepo(authContext()).getAllUsers();
});

/**
 * Name and email, and the Product's own columns on `user` (`createAuth({ userFields })`): any further key must be one of
 * them, a string the field's type is read from (a 400 otherwise); better-auth's `updateUser` writes them.
 */
export const updateUserProfile = protectedForm(z.object({ name: nameSchema, email: emailSchema }).catchall(z.string()), async (data, _issue, user) => {
	const { auth, userFields } = authContext();
	const event = getRequestEvent();
	const { name, email, ...rest } = data;
	const extras = parseUserFields(rest, userFields);
	if (extras.isErr()) throw error(400, { message: m().unknownField(extras.error), id: "user_fields", timestamp: new Date().toISOString() });
	if (email !== user.email) {
		await auth.api.changeEmail({ body: { newEmail: email }, headers: event.request.headers });
	}
	await auth.api.updateUser({ body: { ...extras.value, name }, headers: event.request.headers });
	return { success: true };
});

const passwordPair = { newPassword: passwordSchema, confirmPassword: z.string() };
const passwordsMatch = { error: () => m().passwordsMismatch, path: ["confirmPassword"] };

export const changePassword = protectedForm(
	z.object({ currentPassword: passwordSchema, ...passwordPair }).refine((d) => d.newPassword === d.confirmPassword, passwordsMatch),
	async (data) => {
		const event = getRequestEvent();
		await authContext().auth.api.changePassword({
			body: { currentPassword: data.currentPassword, newPassword: data.newPassword, revokeOtherSessions: true },
			headers: event.request.headers,
		});
		return { success: true };
	},
);

export const setPassword = protectedForm(z.object(passwordPair).refine((d) => d.newPassword === d.confirmPassword, passwordsMatch), async (data) => {
	const event = getRequestEvent();
	await authContext().auth.api.setPassword({ body: { newPassword: data.newPassword }, headers: event.request.headers });
	return { success: true };
});

export const getSessions = protectedQuery(async () => {
	const event = getRequestEvent();
	try {
		return await authContext().auth.api.listSessions({ headers: event.request.headers });
	} catch (e) {
		// Only a login from the last day may list the sessions; the sessions are in the settings
		if (isSessionNotFresh(e)) redirect(303, reauthPath("/home/settings?tab=sessions"));
		throw e;
	}
});

export const revokeSessionById = protectedSchemaCommand(z.object({ sessionId: z.string() }), async (data) => {
	const event = getRequestEvent();
	const currentSessionToken = event.locals.session?.token;
	await authContext().auth.api.revokeSession({ body: { token: data.sessionId }, headers: event.request.headers });
	const isCurrentSession = data.sessionId === currentSessionToken;
	if (!isCurrentSession) await getSessions().refresh();
	return { success: true, isCurrentSession };
});

export const revokeOthers = protectedCommand(async () => {
	const event = getRequestEvent();
	await authContext().auth.api.revokeOtherSessions({ headers: event.request.headers });
	await getSessions().refresh();
	return { success: true };
});

export const getLinkedAccounts = protectedQuery(async (user) => {
	return await userRepo(authContext()).getUserAccounts(user.id);
});

/** The Admin option: one of the roles of `createAuth({ roles })` (default admin and user). */
export const setUserRole = adminSchemaCommand(z.object({ userId: z.string(), role: z.string() }), async ({ userId, role }, admin) => {
	const ctx = authContext();
	if (userId === admin.id) {
		throw error(400, { message: m().ownRole, id: "own_role", timestamp: new Date().toISOString() });
	}
	if (!ctx.roles.includes(role)) {
		throw error(400, { message: m().unknownRole(role), id: "unknown_role", timestamp: new Date().toISOString() });
	}
	await userRepo(ctx).setRole(userId, role);
	await getAllUsers().refresh();
	return { success: true };
});

/** The Admin option: the admin deletes another account with all its data. */
export const deleteUser = adminSchemaCommand(z.object({ userId: z.string() }), async ({ userId }, admin) => {
	if (userId === admin.id) {
		throw error(400, { message: m().ownAccount, id: "own_account", timestamp: new Date().toISOString() });
	}
	await userRepo(authContext()).kontoLoeschen(userId);
	await getAllUsers().refresh();
	return { success: true };
});

/** Deletes the user's own account with all its data. */
export const deleteOwnAccount = protectedCommand(async (user) => {
	await userRepo(authContext()).kontoLoeschen(user.id);
	return { success: true };
});
