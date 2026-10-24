<script lang="ts">
	import { EmailLayout } from "@vonall/mail";
	import { m } from "#lib/messages.js";

	let { inviterName, link, validUntil, appName, appLink }: {
		inviterName: string;
		link: string;
		validUntil: string;
		appName: string;
		appLink: string;
	} = $props();
</script>

<EmailLayout title={m().einladungTitle(appName)} {link} buttonLabel={m().einladungButton} {appName} {appLink}>
	<p>{m().einladungHello}</p>
	<p>{m().einladungBody(inviterName, appName)}</p>
	<p>{m().einladungValid(validUntil)}</p>
</EmailLayout>
