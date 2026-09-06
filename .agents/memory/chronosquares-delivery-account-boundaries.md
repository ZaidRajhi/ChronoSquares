---
name: ChronoSquares delivery account boundaries
description: Delivery workspaces are real Supabase memberships; first setup and invitations must remain transactional and role-bound.
---

Delivery data must never fall back to sample state or client-controlled role switching. A first provider workspace is created atomically, and people join through email-bound, expiring invitations that assign a database membership role.

**Why:** The delivery platform moved from a visual demo to a multi-tenant client-delivery product; fake fallback data could expose the wrong workspace and make permissions appear stronger than they are.

**How to apply:** Keep workspace loading fail-closed, derive role from delivery membership, use server-side/RPC checks for organization setup and invitations, and make admin previews read-only projections rather than impersonation.