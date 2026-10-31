> Version 4.5: single-player Endless now banks its entire remaining run-scrap balance on defeat, without the old score/time cap. Online co-op retains the server reward curve below.

# NEON//NULL 4.0 — multiplayer and update guide

This update includes a real authoritative Node.js server and a network client. It has been tested over local HTTP with four protocol clients and two browser pages. It is not deployed to a public host. Supabase authenticates accounts and stores saves; the Node server runs combat. Supabase alone cannot host this match loop.

## Try local multiplayer

Requires Node.js 22 or newer. There are no npm dependencies to install. From the project folder, run in PowerShell:

```powershell
$env:DEV_GUESTS = 'true'
node multiplayer/server.cjs
```

Open `http://localhost:8787` in two tabs. In each tab choose Play Offline → Multiplayer, expand Server connection and give yourself a different local test name. Create a lobby in one tab and join its code in the other. Both players click Ready; the leader clicks Start Match. Development guests are explicitly unranked and never receive banked multiplayer currency. This mode binds to localhost only.

## Real accounts and players on different devices

1. Use your existing Supabase project and run the base save and username SQL if you have not already. Existing accounts and saves remain valid.
2. Copy `multiplayer/.env.example` to `multiplayer/.env`. Fill in your project URL and publishable key. Leave `DEV_GUESTS=false`.
3. From the project folder, start with `node --env-file=multiplayer/.env multiplayer/server.cjs`.
4. For Internet play, deploy the **whole project folder** to a Node web-service host. Start command: `node multiplayer/server.cjs`. Set the same environment variables privately on that host. The host must support persistent HTTP streaming, a single long-running Node process and HTTPS. Configure its health check to `/health`. The service serves the game itself at `/`.
5. Open the service's HTTPS URL on each device. Configure Accounts & Saves with the same Supabase project, sign in with a confirmed account, and choose a username. In Multiplayer the server URL defaults to that same website origin.
6. Create a room and share its six-character code. All party members must run version 4.0. The first release supports **cooperative Endless**, with all 46 existing equipment choices available equally in its lobby. Campaign missions remain single-player. No public matchmaking, PvP or chat is included.

Configure Supabase's Site URL/confirmation redirects for your hosted game URL. Moving from a local file to a website creates a different browser-storage origin: export a guest backup before moving, or sign in and sync your cloud account. The original file remains usable for single-player.

Host with **one instance**, not autoscaling multiple independent copies: active rooms live in that process. A process restart ends active matches with a connection message. A database alone does not restore a running simulation. Reverse proxies must disable response buffering for `/api/events` and allow persistent streams. Browser inputs use HTTP POST; snapshots stream at 15 Hz, simulation runs at 30 Hz, and graphics render independently.

## Banked co-op rewards (optional)

1. Open `supabase-multiplayer.sql` in this outputs folder, copy **all its contents**, paste them into a new Supabase SQL Editor query, and click Run. Do not paste the filename.
2. Put the project's legacy **service_role** key into the server's private `SUPABASE_SERVICE_ROLE_KEY` environment variable. It belongs only on your server; never put it in the HTML, a message, or the game's public-key field. This server currently expects the service-role JWT for server reward inserts.
3. Use a persistent writable disk for `multiplayer/reward-outbox.json`. The server saves earned rewards before attempting cloud delivery and retries delivery every 30 seconds. The database's `(run_id,user_id)` key prevents duplicate awards. Back up this file before changing hosts.
4. After a ranked match, choose **Bank Rewards & Return**, or use **Accounts & Saves → Claim Co-op Rewards**. If cloud delivery is still pending, retry shortly. The claim updates the cloud save atomically and asks you to resolve any existing save conflict first.

Without the private reward key, account-authenticated co-op still works but is unranked. Production authentication calls Supabase to verify the access token, loads the username from its owner-protected profile, and never trusts a client-supplied identity, damage value, score or scrap amount. Save files remain editable single-player data; this is not a competitive anti-cheat economy.

## Combat, connection and rewards rules

- 2–4 players; friendly fire off. Shared score and waves; pickups go to the first eligible nearby player. Healing pickups repair exactly one hull. A downed teammate can be revived by holding **V** nearby for two seconds, restoring four hull. All available teammates down means shared defeat. Bosses return every five waves and use five warning-based attack patterns.
- Controls: WASD/arrows, LMB, slots 1–4/wheel, Q dash, R reload. Space opens a personal menu and releases inputs; it does **not** pause the server. Settings work during online play, and online combat continues. The first network release is designed for keyboard and mouse; existing single-player touch/controller support remains available.
- Network interruptions show a 20-second reconnect window. Stale input expires in half a second. Disconnected players do not fire, take damage, or earn new match rewards. Empty rooms are cleaned up. Leadership transfers when the former leader leaves or expires. Mid-run newcomers wait for the next lobby; returning participants receive a complete snapshot.
- Ordinary Endless and co-op use the same reward curve: zero under 60 seconds; otherwise `min(120, floor(score/250), floor(seconds/30)*8)`. Rewards are paid after defeat, once per run. Returning to the menu early forfeits the ordinary Endless payout. Co-op rewards additionally require the player to be connected at the end and present for at least 60 seconds. Creative, Practice, development guests and archived builds do not generate these rewards.
- Enemies cap at 30, friendly projectiles at 200, enemy shots at 120, attack zones at 24, pickups at 16, local particles at 140. Audio uses the existing voice limits. Clients interpolate remote movement and apply a small bounded local movement lead; this is not full rollback prediction.

## Shop and interface update

- Hangar removed from the current game; its records and reset control moved into the Cosmetics Shop. Existing purchases and equipped IDs are preserved. Historical archived builds retain their historical menus.
- 50 additional suits and 50 additional gun skins: 70 of each, 140 total. New designs combine named themes, distinct palette/pattern data, animated geometric suit auras and weapon finishes. Colors remain restrained and effects respect reduced motion. The default suit stays free.
- Existing shop prices multiplied by 2.5, new items priced on that curve; cases cost 300. Duplicate refunds cap at 180, so a duplicate cannot directly profit over its case price. All 70 published case probabilities use integer basis points and add to exactly 100%. Purchases remain cosmetic-only.
- Change username from **Settings → Account username → Save Username**, or Accounts & Saves. This uses the same uniqueness checks as account creation and does not create a new account or reset saves. An Internet connection is required to change it.

## Verification limits

Loopback multiplayer and browser flows are tested locally. Hosted Supabase identity, SQL migrations, service-role reward delivery, actual Internet latency and a production reverse proxy require verification after configuring your own service. No public multiplayer URL has been created by this update.

Implementation references: [Node HTTP](https://nodejs.org/api/http.html), [Supabase verified user lookup](https://supabase.com/docs/reference/javascript/auth-getuser).
