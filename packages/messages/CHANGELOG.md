# @vonall/messages

## 0.1.0

### Minor Changes

- [#16](https://github.com/SebastianvonAllmen/vonall-libs/pull/16) [`b2b45e6`](https://github.com/SebastianvonAllmen/vonall-libs/commit/b2b45e653396341b0023777d0d8de1ddee62f50d) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - One messages helper: `@vonall/messages` exports `defineMessages({ en, de })`, and every package's `configure…Messages({ locale })` takes the app's locale as is ("de-CH", "en-GB"), the language derived from it. In development, reading a package's strings before configuring them throws. The `Locale` type is gone. `@vonall/auth`: the near-duplicate keys `invalidEmailDot`, `passwordsDontMatchDot` and `passwordTooShortDot` are merged into `invalidEmail`, `passwordsMismatch` and `passwordTooShort`; `inviteIntro` takes the number of days.
