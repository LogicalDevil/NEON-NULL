# NEON//NULL v6.4 — profiles, account switching, gifts and activity

## Update your game

Extract `neon-null-v6.4-bundle.zip`. Replace the repository's root `index.html` and update the `multiplayer` folder with the bundle's versions. Commit them and let Render redeploy. The start command stays `node multiplayer/server.cjs`. Keep one server instance for active co-op rooms.

## Supabase migration

In your Supabase project, open SQL Editor and create a new query. Open `outputs/supabase-profiles-gifts.sql` in a text editor, copy **all of its contents**, paste those contents into the query, and run it. Do not type the filename as the query.

Run the existing setup, username and `supabase-social.sql` migrations first if they have not already been installed. The new migration is safe to rerun, preserves existing saves and friends, enables RLS, and restricts access through authenticated functions. Normal players cannot issue gifts or inspect the gift tables directly.

## Developer gifts: Render environment

Your existing `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `DEV_GUESTS=false` remain in place. For gifting, configure:

- `DEVELOPER_USER_IDS`: comma-separated Supabase Auth user UUIDs of authorized developers. Use immutable account IDs, not usernames or emails.
- `SUPABASE_SERVICE_ROLE_KEY`: the project's **private service-role key**, stored only in Render's server environment. This gives the server permission to issue gifts. Never paste this private key into the game's Cloud Setup, HTML, GitHub, chat, screenshots or public files.

The server already supports this optional private credential for reward delivery. Gifts also require it. If you leave it unset, profiles, friends, presence and normal saves still work; gift sending shows a configuration message. The public browser configuration continues to use only the publishable key.

Redeploy Render after changing server files or environment variables. The integration is prepared locally; no live project migration or deployment was performed by this update.

## Use the features

- **Switch account:** Accounts & Saves → Switch Account → Sign in to another account. It signs out, reloads to a fresh login, and keeps each user's local progress under their account ID. Remember Me can keep up to eight email shortcuts. It never stores passwords; switching is not a password bypass. Forget saved email shortcuts removes those labels.
- **My profile:** Main Menu → My Profile & Gifts → Edit Profile. Upload PNG/JPEG/WebP under 2 MB or choose one of eight presets. Uploads are cropped to 128 × 128 PNG. Write a description up to 280 characters and choose whether to show cloud-saved banked scrap. Save Profile publishes it.
- **Badges:** Pilot, Trained Pilot, Operator Collector (10 owned operators), Arsenal Curator (10 weapon skins), Endless Survivor (wave 10), and Gift Benefactor (sent a developer gift) reflect saved milestones. These are display badges, not developer authorization.
- **View another profile:** Social → Friends or Search → Profile. Discoverability and blocks apply. Emails, login details and private save contents are not included in profile responses.
- **Send a gift:** Open Developer Studio and verify access on the Render server. Then open a recipient's profile through Social. The Developer Gift section lets you choose Weapon Skin Case or Cosmetics Crate, quantity 1–100, and an optional message. Sending is reauthorized by the server. Limit: 1,000 cases per developer per 24 hours; blocked recipients cannot receive gifts.
- **Receive a gift:** My Profile & Gifts → Gift Inbox → Claim Gift. Claimed cases appear in a server-backed wallet. Open gifted cases from the main menu after syncing cloud saves. They use the normal case odds and add normal collection ownership, with no scrap charge. An already-owned reward consumes the gifted case and gives no scrap refund. Retries reuse receipt IDs so network retries do not spend another case.
- **Friend activity:** Social → Settings → enable “Share Online / In Game status and lobby availability with friends.” It is off by default. Accepted, unblocked friends see Online, In Game (with mode), or Offline. Opted-out activity displays Status Private. Offline means no fresh heartbeat, not a guarantee the person has closed every browser tab.

Activity sends a small heartbeat every 25 seconds and friends refresh status about every 15 seconds while Social is open. Status expires after 90 seconds without a heartbeat. Hidden tabs stop advertising active play. Lobby sharing still requires a live, joinable co-op room. Profile migration failures show a setup hint and do not stop local gameplay.

## Checks performed locally

Real PostgreSQL via PGlite exercised the new migration twice, own-profile editing, avatar checks, scrap privacy, accepted-friend presence, expiration, blocks, restricted gift issuance, repeat claims/openings, save-revision conflicts, wallet deductions and inventory grants.

The real game and Node server were tested in Chromium against a local authentication fixture and those PostgreSQL migrations: profile edits and image upload, developer gift/ordinary-account denial, recipient claim and opening, collection updates, desktop/mobile layouts, Online → In Game status, and switching accounts while preserving the prior local save. Existing account-refresh, developer-auth and Social input-isolation checks also ran. This does not certify live Supabase configuration, email delivery, public Internet connectivity or multi-process database contention.
