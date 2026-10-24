import { error, redirect } from "@sveltejs/kit";
import { getRequestEvent } from "$app/server";
import { z } from "zod";
import { m } from "#lib/messages.js";
import { adminQuery, adminSchemaCommand, protectedCommand, protectedForm, protectedQuery, protectedSchemaCommand } from "#lib/server/helpers.js";
import { authInstance } from "#lib/server/registry.js";
import { UserRepo } from "#lib/server/repositories/UserRepo.js";
import { emailSchema, nameSchema, passwordSchema } from "#lib/types.js";
import { isSessionNotFresh, reauthPath } from "#lib/util/fresh.js";

/** The Admin option: every account. */
export const getAllUsers = adminQuery(async () => {
	return await UserRepo.getAllUsers();
});

export const updateUserProfile = protectedForm(z.object({ name: nameSchema, email: emailSchema }), async (data, _issue, user) => {
	const auth = authInstance();
	const event = getRequestEvent();
	if (data.email !== user.email) {
		await auth.api.changeEmail({ body: { newEmail: data.email }, headers: event.request.headers });
	}
	await auth.api.updateUser({ body: { name: data.name }, headers: event.request.headers });
	return { success: true };
});

const passwordPair = { newPassword: passwordSchema, confirmPassword: z.string() };
const passwordsMatch = { error: () => m().passwordsMismatch, path: ["confirmPassword"] };

export const changePassword = protectedForm(
	z.object({ currentPassword: passwordSchema, ...passwordPair }).refine((d) => d.newPassword === d.confirmPassword, passwordsMatch),
	async (data) => {
		const event = getRequestEvent();
		await authInstance().api.changePassword({
			body: { currentPassword: data.currentPassword, newPassword: data.newPassword, revokeOtherSessions: true },
			headers: event.request.headers,
		});
		return { success: true };
	},
);

export const setPassword = protectedForm(z.object(passwordPair).refine((d) => d.newPassword === d.confirmPassword, passwordsMatch), async (data) => {
	const event = getRequestEvent();
	await authInstance().api.setPassword({ body: { newPassword: data.newPassword }, headers: event.request.headers });
	return { success: true };
});

export const getSessions = protectedQuery(async () => {
	const event = getRequestEvent();
	try {
		return await authInstance().api.listSessions({ headers: event.request.headers });
	} catch (e) {
		// Only a login from the last day may list the sessions; the sessions are in the settings
		if (isSessionNotFresh(e)) redirect(303, reauthPath("/home/settings?tab=sessions"));
		throw e;
	}
});

export const revokeSessionById = protectedSchemaCommand(z.object({ sessionId: z.string() }), async (data) => {
	const event = getRequestEvent();
	const currentSessionToken = event.locals.session?.token;
	await authInstance().api.revokeSession({ body: { token: data.sessionId }, headers: event.request.headers });
	const isCurrentSession = data.sessionId === currentSessionToken;
	if (!isCurrentSession) await getSessions().refresh();
	return { success: true, isCurrentSession };
});

export const revokeOthers = protectedCommand(async () => {
	const event = getRequestEvent();
	await authInstance().api.revokeOtherSessions({ headers: event.request.headers });
	await getSessions().refresh();
	return { success: true };
});

export const getLinkedAccounts = protectedQuery(async (user) => {
	return await UserRepo.getUserAccounts(user.id);
});

/** The Admin option. */
export const setUserRole = adminSchemaCommand(z.object({ userId: z.string(), role: z.enum(["admin", "user"]) }), async ({ userId, role }, admin) => {
	if (userId === admin.id) {
		throw error(400, { message: m().ownRole, id: "own_role", timestamp: new Date().toISOString() });
	}
	await UserRepo.setRole(userId, role);
	await getAllUsers().refresh();
	return { success: true };
});

/** The Admin option: the admin deletes another account with all its data. */
export const deleteUser = adminSchemaCommand(z.object({ userId: z.string() }), async ({ userId }, admin) => {
	if (userId === admin.id) {
		throw error(400, { message: m().ownAccount, id: "own_account", timestamp: new Date().toISOString() });
	}
	await UserRepo.kontoLoeschen(userId);
	await getAllUsers().refresh();
	return { success: true };
});

/** Deletes the user's own account with all its data. */
export const deleteOwnAccount = protectedCommand(async (user) => {
	await UserRepo.kontoLoeschen(user.id);
	return { success: true };
});
