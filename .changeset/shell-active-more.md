---
"@vonall/shell": patch
---

The sidebar no longer highlights the item whose href is a prefix of the More page (`moreItem`): on that page nothing is highlighted, as on every page without an entry of its own. `AppSideBar` takes `moreItem`; `activeSidebarId()` is exported.
