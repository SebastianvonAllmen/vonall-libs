// What both the browser and the server may import; the server side is `@vonall/auth/server`, the browser's client
// `@vonall/auth/client`, the remote functions `@vonall/auth/remote`, the tables `@vonall/auth/schema`.
export { configureAuthMessages, m, type AuthMessages } from "#lib/messages.js";
export { ac, adminRole, roles, userRole } from "#lib/permissions.js";
export {
	emailSchema,
	MIN_PASSWORD_LENGTH,
	nameSchema,
	passwordSchema,
	SIGNUP_MODES,
	SIGNUP_STATES,
	type AppUserClient,
	type EinladungInfo,
	type OffeneEinladung,
	type SessionUser,
	type SignupMode,
	type SignupState,
	type UserInsert,
	type UserSelect,
} from "#lib/types.js";
export { isSessionNotFresh, isStale, reauthPath, SESSION_NOT_FRESH } from "#lib/util/fresh.js";
export { messageOf } from "#lib/util/messageOf.js";
export { displayInitials, displayName, nameFromEmail } from "#lib/util/names.js";
export { sameSitePath } from "#lib/util/sameSite.js";
export { adminList, isAdmin, isListed, mayInvite, signupState } from "#lib/util/signup.js";
