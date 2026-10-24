import { Bot } from "@lucide/svelte";
import type { SettingsTabDef } from "@vonall/auth/ui";
import { m } from "#lib/messages.js";

export { default as AgentsTab } from "#lib/ui/AgentsTab.svelte";
export { default as ConsentPage } from "#lib/ui/ConsentPage.svelte";

/** The Agents tab for `SettingsPage`'s `extraTabs`, in the configured language; `AgentsTab` is its content. */
export function agentsTab(): SettingsTabDef {
	return { id: "agents", label: m().tabAgents, hint: m().tabAgentsHint, icon: Bot };
}
