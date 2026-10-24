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

<EmailLayout title={m().hello(recipientName)} {link} buttonLabel={m().verifyButton} {appName} {appLink}>
	<p>{m().verifyBody(appName)}</p>
	<p>{m().verifyNotYou}</p>
</EmailLayout>
