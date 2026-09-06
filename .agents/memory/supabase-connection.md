---
name: Supabase connection path
description: Replit networking and migration guidance for the connected ChronoSquares Supabase project.
---

The Supabase REST connector can access the project even when the direct database hostname is not reachable from the workspace. For SQL migrations, use the project's regional Supabase pooler in session mode rather than assuming `db.<project>.supabase.co` will work.

**Why:** The direct database hostname resolved only to IPv6 in the workspace, while the regional pooler accepted the project's database credentials over IPv4.

**How to apply:** Keep the app on the normal Supabase HTTPS URL and publishable key. Use the connected Supabase REST integration for read/write API checks; use a secure database password plus the correct regional session pooler only for DDL migrations.