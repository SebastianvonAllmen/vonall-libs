// SvelteKit's ambient types for the package's own check: the session `@vonall/auth`'s handle puts into `locals`.
import type { AuthSession, AuthUser } from "@vonall/auth/server";

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
