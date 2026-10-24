// SvelteKit's ambient types for the package's own check: the session a Product's hooks put into `locals` (its own
// app.d.ts declares the same from its `auth` instance).
import type { AuthSession, AuthUser } from "#lib/server/create.js";

declare global {
	namespace App {
		interface Locals {
			user: AuthUser | null;
			session: AuthSession | null;
		}
		interface Error {
			id: string;
			timestamp: string;
		}
	}
}

export {};
