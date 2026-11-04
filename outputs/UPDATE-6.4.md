# v6.4 — Pilot Network — 4 November 2026

- Added account switching with separate account-ID local saves and optional remembered email shortcuts.
- Added pilot profiles with uploaded/preset pictures, descriptions, saved-scrap privacy and milestone badges.
- Added server-authorized developer gifts for weapon cases and cosmetics crates, recipient inboxes and case wallets.
- Added idempotent claims/openings, cloud revision checks and collection ownership updates; gifted duplicates do not generate scrap.
- Added accepted-friend Online / In Game / Offline activity, mode labels, opt-in sharing, block filtering and expiring heartbeats.
- Added responsive profile/gift panels with keyboard focus handling and gameplay-input isolation.

Requires `supabase-profiles-gifts.sql` after the existing social migration. Developer gifts additionally require the private server-only service-role environment key and developer UUID allowlist. See `PROFILES-GIFTS-SETUP.md` for exact local bundle deployment instructions and verification limits.

## Sign-in recovery hotfix — 4 November 2026

Expired or revoked refresh tokens now stop retrying and offer a fresh sign-in while retaining account-scoped local saves. Transient network errors retain the session. Refresh requests share a browser lock when supported and reuse newer stored tokens from other tabs. The profile screen includes a Sign In / Switch Account recovery action.
