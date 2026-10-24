<script lang="ts">
	// A template as a Product writes one, for EmailLayout's test
	import EmailLayout from "./EmailLayout.svelte";

	let { link }: { link: string } = $props();
</script>

<EmailLayout title="Test" {link} buttonLabel="Go" appName="Blueprint" appLink="https://example.org">
	<p>Hallo</p>
</EmailLayout>
