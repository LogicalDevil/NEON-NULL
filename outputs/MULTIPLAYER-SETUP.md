# NEON//NULL 5.2 — multiplayer setup

Deploy the extracted release bundle contents. The Node server prefers root index.html, the same entry GitHub Pages uses, and falls back to outputs/neon-null.html.

## Local testing

Node 22+ is required; there are no npm dependencies. In PowerShell from the project root:

```powershell
$env:DEV_GUESTS = 'true'
node multiplayer/server.cjs
```

Open http://localhost:8787 in 2–4 browser windows. Choose Play Offline → Multiplayer. Under Server connection, select different local test names. One player creates a lobby and shares its code. Choose loadouts, mark Ready and the leader starts. Development guests bind to localhost and never earn rewards.

## Internet hosting

Use a Node web service with Node 22+, Build Command `true`, Start Command `node multiplayer/server.cjs`, Health Check `/health`. Keep one instance: rooms live in process memory, and a restart ends active matches. Proxies must support persistent HTTP streaming without buffering /api/events.

Retain the existing server environment variables for the Supabase project URL and publishable key, with DEV_GUESTS=false. The HTML includes this project's public client defaults, so friends do not need to paste keys. For another project, change the client defaults in work/account-save.js and rebuild. The public-config endpoint returns only a validated public configuration, never a private key.

Open the host's HTTPS game URL on each device. Set Supabase Authentication → URL Configuration → Site URL to that address and allow confirmation redirects. Players need confirmed email accounts and usernames. Protocol 5.2 clients and server must be updated together.

For a GitHub Pages client connecting to Render, set ALLOWED_ORIGINS=https://logicaldevil.github.io (no path), and enter the Render HTTPS URL under Multiplayer → Server connection. Opening the game directly on Render is simpler. Moving domains changes browser storage; sync cloud accounts or export guest backups first.

## Optional ranked rewards

Authenticated co-op works without a private reward key, but remains unranked. Banked rewards require the previously supplied reward SQL and private server configuration. Keep all private keys out of HTML and GitHub. Persist and back up multiplayer/reward-outbox.json before redeploying. Unique run/user IDs and the existing atomic claim function prevent duplicate awards. Claim through Bank Rewards & Return or Accounts & Saves after delivery; resolve cloud conflicts first.

Co-op awards zero before 60 seconds, otherwise min(120, floor(score/250), floor(seconds/30)*8), once per run to eligible players connected at the end with 60 seconds presence. Single-player Endless retains its separate unspent-scrap payout. Creative, Practice, legacy and development guests do not award co-op currency.

## Controls and recovery

WASD/arrows move; pointer aims; LMB uses selected equipment; 1–4/wheel select slots; Q dashes; R reloads; V revives nearby teammates over two seconds. Space opens a personal menu and releases input; online combat continues. All active teammates down ends the run. Co-op is designed for keyboard and mouse; existing single-player touch/controller support remains available.

The 30 Hz server validates combat and identity; clients render independently. Stale input expires after half a second. Streams have five-second heartbeats and a 20-second reconnect window. Empty rooms, stale connections and client animation loops are cleaned up. Entity, effect and audio budgets stay bounded.

See UPDATE-5.2.md and PERFORMANCE-5.2.md for current changes, measurements and verification limits. Earlier reports are historical. Live Supabase delivery, Internet latency and your hosting configuration need checks after deployment.
