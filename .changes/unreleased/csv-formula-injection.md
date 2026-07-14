---
bump: patch
type: Security
---

Neutralise spreadsheet formulas in CSV exports. A cell opening with =, +, - or @ is executed by Excel and Google Sheets, and DEMO_MODE hands these exports to strangers.
