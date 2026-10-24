# @vonall/messages

`defineMessages({ en, de })` for the Libraries' strings: `{ m, configure }`. A Product calls each package's
`configure…Messages({ locale: LOCALE, overrides })` once from the module its root layout imports; the package reads
`m()`. `locale` is the app's BCP-47 tag ("de-CH"); anything but German means English. Reading before configuring
throws in development and falls back to English elsewhere.
