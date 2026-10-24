---
"@vonall/auth": patch
---

Without mail, an address of `adminEmails` may be the first account (confirmed and admin, as the first account is without a list), so local development with `ADMIN_EMAILS` and no SMTP works; after that a password signup of a listed address still needs mail.
