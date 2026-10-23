<script lang="ts">
	import { EmailLayout } from "@vonall/mail";
	import { m } from "#lib/messages.js";

	let { recipientName, link, appName, appLink }: {
		recipientName: string;
		link: string;
		appName: string;
		appLink: string;
	} = $props();
</script>

<EmailLayout title={m().hello(recipientName)} {link} buttonLabel={m().resetButton} {appName} {appLink}>
	<p>{m().resetBody(appName)}</p>
	<p>{m().resetNotYou}</p>
</EmailLayout>
