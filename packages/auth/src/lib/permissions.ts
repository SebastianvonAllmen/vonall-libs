import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

export const ac = createAccessControl(defaultStatements);

/**
 * The app admin manages accounts but can't act as or take over a friend's account: no impersonation, no setting a
 * password or an email, no creating accounts (signup only through an Einladung).
 */
export const adminRole = ac.newRole({
	user: ["list", "get", "set-role", "ban", "delete"],
	session: ["list", "revoke"],
});

export const userRole = ac.newRole({
	user: [],
	session: [],
});

/** The roles as better-auth's admin plugin and client take them. */
export const roles = { admin: adminRole, user: userRole };
