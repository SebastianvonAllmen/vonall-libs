// The pages and the settings of accounts, for a Product's routes; `setAuthUi({ … })` in its root layout first
export { default as AdminView } from "#lib/ui/AdminView.svelte";
export { authUi, setAuthUi, type AuthClientLike, type AuthUi } from "#lib/ui/context.js";
export { default as EinladungErstellen } from "#lib/ui/EinladungErstellen.svelte";
export { default as EinladungPage } from "#lib/ui/EinladungPage.svelte";
export { default as LoginForm } from "#lib/ui/LoginForm.svelte";
export { default as RegisterForm } from "#lib/ui/RegisterForm.svelte";
export { default as ResetPasswordForm } from "#lib/ui/ResetPasswordForm.svelte";
export { default as SettingsPage } from "#lib/ui/SettingsPage.svelte";
export { default as SocialButton } from "#lib/ui/SocialButton.svelte";
export { deletionTab, settingsTabs, visibleTabs, type SettingsTabDef } from "#lib/ui/tabs.js";
