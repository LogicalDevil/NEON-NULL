# NEON//NULL v3.25: accounts and saves

The current release includes this project’s public Supabase URL and publishable key, so new players can create accounts without entering Cloud setup. The setup instructions below apply when configuring a different project. Private server keys are never included in the HTML.

## Configure the service

1. Create a project at https://supabase.com and enable email/password authentication.
2. Open its SQL Editor and run `supabase-setup.sql` from this folder. It creates an owner-protected saves table and an atomic save function. Row Level Security prevents one account from reading another account's saves.
3. Copy the project URL and **publishable key** from the project's API settings. A legacy `anon` key also works. Never copy a secret or `service_role` key into the game.
4. Open `neon-null.html`. Choose **Accounts & Saves → Cloud setup**, paste both values and save. Configuration reloads the game and signs out any prior account.
5. On the login screen, choose a unique username and enter an email/password and choose **Create Account**. Passwords must contain at least eight characters. If email confirmation is enabled, confirm your email before using **Sign In**. The game never stores your password.
6. Use **Continue Saved Account** after signing in. On another device, configure the same project and sign in with that account. On the sign-in screen, **Remember me on this device** optionally retains the Supabase session and email in this browser; leave it unchecked for a tab-only session. The password is never saved. Sign Out clears the remembered session and email.

For a published game, serve the HTML over HTTPS and set Supabase's Site URL to that address. For local testing, use a local HTTP server and configure its URL in Supabase, especially for email confirmation links. Example: from this directory, `python -m http.server 8000`, then open `http://localhost:8000/neon-null.html`. Local file play remains available, but browser storage behavior can differ by browser. Use a stable URL/file path and export backups before moving to a new path or browser.

## What saves

- Banked mission scrap, owned/equipped cosmetics and weapon skins, case counts, mission clear records, best endless wave, accessibility/audio settings, and the Creative Lab scrap preference.
- Active battles, current hull, temporary loadouts/ammo and unbanked run rewards do not resume after closing the game.
- Guest and each cloud account use separate local save namespaces. Creative gameplay remains isolated from mission rewards. Legacy builds retain their own existing storage behavior and are not synchronized by this integration.
- **Copy Guest Progress** explicitly replaces this account's local profile. It does not silently merge currency or collections.
- **Export Backup / Import Backup** works without cloud configuration. Export before replacing a save or clearing browser data. Importing restarts the game.

## Offline and conflicts

Changes save locally first; cloud writes are debounced and never run inside the animation loop. If a request fails, progress remains local and the status reports the failure. Retry **Sync Now** or reconnect. Before changing devices or closing the tab, check **Local + cloud saved**.

If another device saved a different revision while this device has unsynced changes, automatic upload stops. Open Accounts & Saves, export a backup if desired, then choose **Use Cloud Copy** or **Keep Local Copy**. No automatic additive merging is used, because that could duplicate scrap and rewards. While offline you may play the cached account for this tab. Sign-in itself requires the service.

This is a single-player, client-authored save system. Owners can edit their own saves; it does not provide competitive anti-cheat or a real-money economy.

## Skin reveals

Cases still use earned in-game scrap, published unchanged odds and duplicate refunds. The reveal now takes 550 ms, with **Instant reveal** and **Reveal Now** options. Reduced motion reveals instantly. There is one purchase per click, no auto-roll, no near-miss manipulation, and no real-money betting. Rewards are saved before the animation, so closing it never loses a reward.

## Validation limits

Browser tests cover local persistence and mocked account/cloud responses, including conflicts and offline failures. A real project's email delivery, RLS policies and live multi-device saves must be verified after you configure the service. The SQL has not been executed against a hosted database in this workspace.

Provider references: [Password authentication](https://supabase.com/docs/guides/auth/passwords), [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).


## Username upgrade for existing projects

If you already ran the original save setup, open `supabase-usernames.sql` in a text editor, copy its entire contents, paste them into a new Supabase SQL Editor query and click Run. Do not paste the filename. This adds profiles and case-insensitive uniqueness without changing accounts or saved progress. New projects can run the updated `supabase-setup.sql`, which includes both migrations.

Usernames use 3–20 ASCII letters, numbers or underscores and must begin with a letter. Sign in still uses email and password. Existing accounts can choose or change a name in Accounts & Saves → Username → Save Username. The database rejects duplicate names even if two clients request a name at the same time. Profiles expose only their owner’s row; public availability returns a boolean, not emails or account IDs. Username claims and changes require an internet connection. Offline play can show the last cached name. Names are stored separately from save backups and remain tied to the same account ID.

Browser username tests use a simulated provider. The profile migration and signup trigger need live verification after being run in your project. Provider guidance: https://supabase.com/docs/guides/auth/managing-user-data
