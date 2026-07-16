---
bump: patch
type: Fixed
---

Fixed the Reports page rendering only the Balance Sheet with no tabs or CSV buttons. Duplicate account names within a statement section produced duplicate {#each} keys, which threw a Svelte each_key_duplicate error and aborted the render. Rows are now keyed by the unique account id.
