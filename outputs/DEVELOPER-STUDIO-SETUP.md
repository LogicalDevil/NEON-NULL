# Developer Studio — owner setup

NEON//NULL v6.2 · 3 November 2026

## Enable your account

1. Sign up or sign in normally and choose a regular username. Confirm your email. Keep your existing Supabase project configuration.
2. Open that project's Supabase dashboard. Go to **Authentication → Users**, select your account using its email, and copy its **User UID / User ID**. This is a UUID, not your username, project reference, password, or API key.
3. In Render, open your NEON-NULL web service and its **Environment** settings. Add a variable named **DEVELOPER_USER_IDS**. Its value is your copied user UUID. For several developers, separate UUIDs with commas.
4. Upload v6.2's root **index.html** and the entire **multiplayer** folder to the connected repository. Save the environment change and redeploy. The new server requires developer-access.cjs, developer-content.cjs, and case-catalog.json in addition to existing server files.
5. Open the Render game URL and sign in. In **Accounts & Saves**, enter **NEON_DEV** in the username field and click **Save Username**. This opens the developer panel without renaming your account. Alternatively use **Developer Access** on the login/account screen.
6. Click **Verify Developer Access** if necessary. Once verified, **Developer Studio** also appears on the main menu.

No new Supabase SQL or service-role key is required for this feature. Keep DEV_GUESTS=false for production. Guest mode does not grant developer permission.

The game cannot authorize your actual account until you configure the server allowlist. The setup is intentionally empty by default; no working developer secret is included in the HTML or bundle.

## Username shortcut

NEON_DEV is a public panel shortcut. It is not a password or bearer credential. Signing in under that name, editing a save, or sending an isDeveloper flag cannot grant access. The server verifies the Supabase access token and compares its immutable user ID with its private allowlist.

This release uses account roles through the server allowlist. It does not implement invitation codes, invitation expiration screens, or a shared secret typed into a username field.

## Free case testing

- Select Weapon Case or Operator Case and a batch size of 1,10,50,100.
- Normal rolls use the game's exported case pools and per-item odds. Operator cases retain the same rarity weights as weapon cases.
- Forced rarity/exact-item results are labeled FORCED and excluded from observed odds.
- Test collection and duplicate status are memory-only. Last500 results are retained and last100 are shown. No normal ownership, scrap, refunds, mastery, battle-pass XP, or purchase counters are changed.
- Developer-exclusive items are preview choices, not outcomes in the normal rarity pool. They carry Developer rarity and do not change public case odds.

## Inspection and temporary outfits

Use Operator Gallery / Weapon Gallery, then **Unlock All for Preview** to inspect all ordinary content. The twelve exclusive operators and twelve exclusive weapon designs are immediately available to authorized developers.

Compare Selected locks the current design as a reference; choose another item to compare. Playback speed, lighting, environments, animation states, and target feedback affect the isolated preview canvas. The preview uses shared artwork; target feedback is a visual inspection tool, not a mission simulation. The diagnostics panel reports preview drawing time and cache counts.

**Authorize Temporary Co-op Outfit** allows an exclusive operator or compatible ranged weapon skin for this account's current online session. Four melee exclusives are inspection-only in this release; they are not saved or equipped in live gameplay.

- **Back to Game · Keep Session** hides the Studio and restores controls while maintaining account verification. A DEVELOPER SESSION badge provides Studio and End controls. You can join co-op with your temporary outfit.
- **Exit Developer Studio**, **End**, or **Reset Test Session** clears the temporary outfit. Your normal equipped cosmetics remain unchanged.
- Access is rechecked every30seconds. Temporary server outfits expire within65seconds without renewal. The server removes revoked roles/expired outfit leases during cleanup; restarting the server also drops temporary outfits.
- Revoking access requires removing the UUID from DEVELOPER_USER_IDS and redeploying. Existing server processes do not receive edited Render environment values until a deploy/restart.

## Hosting and troubleshooting

Open the Studio from the same Render origin as the game server. Local file URLs and GitHub Pages are separate origins and may be rejected by the server's existing CORS rules. Normal local gameplay remains available.

- **Access Required:** sign in with a confirmed account and a saved regular username.
- **Access Revoked or not granted:** check the exact Auth user UUID and redeploy the allowlist.
- **Developer service unavailable:** replace the full multiplayer folder and confirm deployment completed.
- **Timed out:** retry when the server is reachable. Normal saves are retained.

Never add an auth token, password, service-role key, or developer secret to GitHub. User UUIDs are identifiers; the private server configuration determines which accounts are authorized.

## Verification limits

Tests use a local identity-provider fixture with real HTTP game-server requests and Chrome. They verify token rejection, role spoof rejection, username-independent identity, permission revocation, lease expiration, compatible equipment, no cloud writes, and no ordinary inventory changes. Browser tests inspect24 designs, batch100, forced results, reset, temporary sessions, responsive layout, and normal local-save equality. No live Supabase account, production Render deployment, or multi-device role administration was tested.
