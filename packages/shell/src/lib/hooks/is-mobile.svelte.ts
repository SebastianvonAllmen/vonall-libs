import { onMount } from "svelte";

const DEFAULT_MOBILE_BREAKPOINT = 768;

export class IsMobile {
	#current = $state(false);

	constructor(breakpoint: number = DEFAULT_MOBILE_BREAKPOINT) {
		// onMount runs on the client after the component is mounted,
		// preventing hydration mismatch during initial client render.
		onMount(() => {
			const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
			this.#current = mql.matches;

			const listener = (e: MediaQueryListEvent) => {
				this.#current = e.matches;
			};

			mql.addEventListener("change", listener);
			return () => {
				mql.removeEventListener("change", listener);
			};
		});
	}

	get current() {
		return this.#current;
	}
}
