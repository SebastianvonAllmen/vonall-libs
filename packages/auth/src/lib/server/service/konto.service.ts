/** The user's account as a whole. */
import { UserRepo } from "#lib/server/repositories/UserRepo.js";

export const KontoService = {
	/**
	 * Deletes the account with everything that belongs to it: the foreign keys of every user-owned table cascade, so a
	 * Product's own tables reference `user.id` with `onDelete: "cascade"`.
	 */
	async loeschen(userId: string): Promise<void> {
		await UserRepo.deleteUser(userId);
	},
};
