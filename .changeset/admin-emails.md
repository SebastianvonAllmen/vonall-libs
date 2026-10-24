---
"@vonall/auth": minor
---

`createAuth({ adminEmails })`: the addresses of a Product's `ADMIN_EMAILS` are the admins. They sign up without an Einladung and get the role once the address is confirmed (Google/GitHub at once, a password signup through the mailed link, an existing account at its next login); with a list, the first account is no longer the admin. `signupLoad` adds `adminList` to the page data and the signup form stays visible for them. `adminList()` and `isListed()` are exported.

Fix: the Profile tab's name and email fields could not be edited (the effect that fills them re-ran on every keystroke).
