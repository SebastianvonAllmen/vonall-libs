import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { z } from "zod";
import { m } from "#lib/messages.js";
import type { FullSchema } from "#lib/schema/index.js";

/**
 * How people get an account (the Factory's GLOSSARY, "Signup mode"); a Product sets it in its `config.ts`.
 * - `invite`: anyone with an account can create an Einladung, and signup needs one
 * - `open`: anyone can sign up and confirms their email address first (needs mail)
 * - `admin`: only admins create Einladungen
 * The first account needs neither an Einladung nor a confirmation in any mode.
 */
export const SIGNUP_MODES = ["invite", "open", "admin"] as const;
export type SignupMode = (typeof SIGNUP_MODES)[number];

/** Whether someone may create an account now, and if not, why. */
export const SIGNUP_STATES = ["allowed", "needs_einladung", "no_mail"] as const;
export type SignupState = (typeof SIGNUP_STATES)[number];

export const MIN_PASSWORD_LENGTH = 8;

/** The user row with every option on; an option that is off leaves its columns unused. */
export type UserSelect = InferSelectModel<FullSchema["user"]>;
export type UserInsert = InferInsertModel<FullSchema["user"]>;

/** The user as the client sees it (no secrets live on the user row, so it is the full row). */
export type AppUserClient = UserSelect;

/** The logged-in user of the current request, as better-auth puts it into `locals`. */
export type SessionUser = NonNullable<App.Locals["user"]>;

/** What an Einladung link offers, shown before signing up. */
export type EinladungInfo = {
	id: string;
	inviterName: string;
	expiresAt: Date;
};

export type OffeneEinladung = {
	id: string;
	email: string | null;
	expiresAt: Date;
	createdAt: Date;
};

// The messages are read when a value is checked, not when the module loads, so the Product's configure… call comes first
export const emailSchema = z.email({ error: () => m().invalidEmail });
export const passwordSchema = z.string().min(MIN_PASSWORD_LENGTH, { error: () => m().passwordTooShort(MIN_PASSWORD_LENGTH) });
export const nameSchema = z
	.string()
	.trim()
	.min(1, { error: () => m().nameRequired })
	.max(80, { error: () => m().nameTooLong(80) });
