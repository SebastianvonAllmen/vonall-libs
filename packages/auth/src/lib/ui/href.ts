import { resolve } from "$app/paths";

/** A link to one of the Product's paths, with SvelteKit's base path (this package has no route ids to type `resolve` against). */
export function href(path: string): string {
	return (resolve as unknown as (pathname: string) => string)(path);
}
