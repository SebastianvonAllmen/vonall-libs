import { describe, expect, it } from "vitest";
import { configureMailMessages } from "#lib/messages.js";
import { renderMail } from "#lib/render.js";
import Example from "./Example.test.svelte";

describe("EmailLayout", () => {
	it("renders the title, the content, the button, the bare link and the footer in the configured language", () => {
		configureMailMessages({ locale: "de" });
		const html = renderMail(Example, { link: "https://example.org/x?y=1&z=2" });
		expect(html).toContain("<h2");
		expect(html).toContain("Hallo");
		expect(html).toContain("Oder öffne diesen Link:");
		expect(html).toContain("Blueprint öffnen");
		expect(html.match(/https:\/\/example.org\/x\?y=1&amp;z=2/g)).toHaveLength(3);
		configureMailMessages({ locale: "en" });
	});
});
