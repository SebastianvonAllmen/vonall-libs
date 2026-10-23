import { describe, expect, it, vi } from "vitest";
import { createMailer, type Transport } from "./mailer";

const mail = { to: "a@example.org", subject: "Hi", text: "Hello" };

describe("createMailer", () => {
	it("is off when any SMTP setting is missing", () => {
		expect(createMailer({ smtp: null }).enabled).toBe(false);
		expect(createMailer({ smtp: { host: "smtp.example.org", user: "", password: "x" } }).enabled).toBe(false);
		expect(createMailer({ smtp: { host: "smtp.example.org", user: "u", password: "x" } }).enabled).toBe(true);
	});

	it("refuses to send when off", async () => {
		const log = { debug: vi.fn(), error: vi.fn() };
		await expect(createMailer({ smtp: { host: "" }, log }).send(mail)).rejects.toThrow("The email could not be sent");
		expect(log.error).toHaveBeenCalledOnce();
	});

	it("sends through the transport with the sender, and logs the id", async () => {
		const sent: unknown[] = [];
		const transport: Transport = { sendMail: async (options) => (sent.push(options), { messageId: "42" }) };
		const log = { debug: vi.fn(), error: vi.fn() };
		const mailer = createMailer({ transport, from: "Blueprint <noreply@example.org>", log });
		expect(mailer.enabled).toBe(true);
		await mailer.send({ ...mail, replyTo: "b@example.org" });
		expect(sent).toEqual([{ ...mail, replyTo: "b@example.org", from: "Blueprint <noreply@example.org>" }]);
		expect(log.debug).toHaveBeenCalledWith("Email sent: 42");
	});

	it("defaults the sender to the SMTP login", async () => {
		const sent: { from: string }[] = [];
		const transport: Transport = { sendMail: async (options) => (sent.push(options), {}) };
		await createMailer({ transport, smtp: { host: "h", user: "login@example.org", password: "p" } }).send(mail);
		expect(sent[0].from).toBe("login@example.org");
	});

	it("wraps a transport failure so the caller can show it", async () => {
		const transport: Transport = { sendMail: async () => { throw new Error("ECONNREFUSED"); } };
		const log = { debug: vi.fn(), error: vi.fn() };
		await expect(createMailer({ transport, log }).send(mail)).rejects.toThrow("The email could not be sent");
		expect(log.error).toHaveBeenCalledWith("Error sending email", { subject: "Hi" }, expect.any(Error));
	});
});
