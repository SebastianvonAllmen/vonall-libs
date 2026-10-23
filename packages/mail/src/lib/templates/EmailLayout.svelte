<script lang="ts">
	import type { Snippet } from "svelte";
	import { m } from "#lib/messages.js";

	/**
	 * The frame of every HTML mail: a title, the content, one button with its link repeated as text, and a footer with
	 * the app's name linking back into it. Rendered on the server with `renderMail`.
	 */
	let { title, link, buttonLabel, appName, appLink, children }: {
		title: string;
		link: string;
		buttonLabel: string;
		appName: string;
		appLink: string;
		children: Snippet;
	} = $props();

	// Mail clients ignore stylesheets, so the colours are inline: a neutral light palette that reads everywhere
	const COLORS = {
		primary: "#334155",
		primaryForeground: "#FFFFFF",
		background: "#F8FAFA",
		cardBackground: "#FFFFFF",
		text: "#1E293B",
		mutedText: "#64748B",
		border: "#E2E8F0",
	};
</script>

<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: {COLORS.text}; margin: 0; padding: 20px; background-color: {COLORS.background};">
	<div style="max-width: 600px; margin: 0 auto; background-color: {COLORS.cardBackground}; border: 1px solid {COLORS.border}; border-radius: 12px; padding: 40px;">
		<h2 style="margin-top: 0; color: {COLORS.text};">{title}</h2>

		{@render children()}

		<div style="text-align: center;">
			<a href={link} style="display: inline-block; background-color: {COLORS.primary}; color: {COLORS.primaryForeground}; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 25px 0;">
				{buttonLabel}
			</a>
		</div>

		<p style="font-size: 14px; word-break: break-all;">{m().orUseLink} <br>
			<a href={link} style="color: {COLORS.primary}; text-decoration: none; word-break: break-all;">{link}</a>
		</p>

		<div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid {COLORS.border}; color: {COLORS.mutedText}; font-size: 13px;">
			<p><strong>{appName}</strong></p>
			<p><a href={appLink} style="color: {COLORS.primary}; text-decoration: none;">{m().open(appName)}</a></p>
		</div>
	</div>
</div>
