import type { Component } from "svelte";
import { render } from "svelte/server";

/** The HTML of a mail template (a Svelte component built on `EmailLayout`) with its props. Server only. */
export function renderMail<Props extends Record<string, unknown>>(template: Component<Props>, props: Props): string {
	return render(template, { props }).body;
}
