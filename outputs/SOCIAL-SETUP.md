# NEON//NULL Friends and Private Chat — setup

## Apply the database migration

1. Keep the existing Supabase account, save, username, and multiplayer setup. This migration needs the existing `public.neon_profiles` table and authenticated accounts with saved usernames.
2. Open the supplied **supabase-social.sql** file in a text editor and copy **all of its contents**. In your Supabase project's SQL Editor, create a new query, paste those contents, and run the query. Do not type only the filename.
3. The migration creates new social tables and replaces the social RPC definition. It does not overwrite existing usernames, saves, balances, cosmetic ownership, or mission progression. Re-running the migration preserves social records.
4. Deploy the updated game `index.html` and full `multiplayer` folder together. Keep the existing Supabase project URL/publishable key. Never place a service-role key in browser code.
5. Open the hosted Render game, sign in with two confirmed accounts, and check username search → friend request → recipient acceptance → private message. Test an ordinary account as well as any developer account.

Social features require the migration and reachable Supabase service. Normal local gameplay remains usable if the service is unconfigured or offline. Private chat is text-only in this release.

## Identity, privacy, and authorization

Social identity uses each authenticated account's immutable Supabase user ID. Changing a username changes the displayed name without breaking relationships or chat history.

The RPC reveals public usernames, account identifiers needed for social actions, and relationship state. It never returns emails, authentication records, access tokens, private saves, or administrative fields. This release does not share cosmetic avatars from private save documents.

New accounts default to discoverable profiles, accepting friend requests, and **online/join sharing off**. The `online` setting is an opt-in permission used by Join Friend. It is not proof that an account is currently online; the game server checks an actual connected lobby member before joining.

All new social tables have Row Level Security enabled. `anon` and `authenticated` have no direct table or sequence privileges. Only `authenticated` can execute the `public.neon_social(action,payload)` RPC. That function checks `auth.uid()`, public-profile existence, participants, relationship status, and blocks for each relevant action. Its empty search path and explicitly qualified tables avoid public-schema function/table substitution. The internal rate helper is not callable by client roles.

No direct social-table policies are needed: clients use the narrow RPC rather than selecting unrestricted rows. Do not add broad public read/write policies to make the interface work.

## Friendship rules

- A request creates one normalized pair record with a designated sender. It does not create a friendship.
- The sender can cancel; the recipient can accept or decline. Repeated requests return the existing pending status. Crossed requests remain pending until the recipient explicitly accepts.
- Either accepted friend can remove the friendship. A new accepted request is required to restore sending rights.
- Blocking cancels pending invitations and deactivates the relationship. Either-direction blocks deny new messages, history reads, requests, invitations, and joining permissions.
- Unblocking does not automatically restore an old friendship.
- Accepted friendships are capped at500 per account. Pending outgoing and incoming requests are each capped at50. The block list is capped at500.

Pair-level transaction locks serialize acceptance, messages, removal, blocking, and invitation authorization for the same pair. Account locks serialize pending/friend-cap checks across different pairs. These rules are enforced in the database rather than by interface visibility.

## Private messages and unread state

Each conversation belongs to the normalized account pair. Messages use database-generated bigint IDs and timestamps; clients receive IDs as decimal strings to avoid JavaScript integer rounding.

New messages require accepted friendship and no block. The server trims surrounding ordinary whitespace and rejects empty messages or bodies over1,000 characters. A UUID request nonce is unique per sender. Retrying the same nonce/body/pair returns the existing message; reusing it for different content or a different conversation is rejected.

The messages endpoint returns the latest50 messages in ascending order. `before` loads earlier pages and `hasMore` indicates another page. Read positions advance monotonically and cannot mark messages beyond the latest existing message in that conversation.

After removing a friend, previous messages remain accessible read-only to the original participants. `list.history` exposes up to50 recent inactive conversations with messages. A block prevents either participant from opening that history while the block exists. No permanent deletion or retention policy is silently introduced; administrators should define one before operating at larger scale.

The client must render bodies as plain text. This database does not attempt to make untrusted HTML safe for insertion into the DOM.

## Search and bounded responses

Search requires3–20 username characters. Exact matches rank first, then prefix matches, then other literal substring matches. Results exclude the caller, undiscoverable accounts, and accounts blocked in either direction. Each page contains at most20 profiles. Use `offset` for subsequent pages.

The migration creates a lower-case prefix-search index and relationship/message indexes. General substring matching still uses a filtered scan without a trigram extension. For a much larger player population, profile the actual search workload and add a managed `pg_trgm` index before claiming scalable substring search. This migration deliberately has no extension dependency.

Friend lists page at50 records using `list` with `offset`; `friendsHasMore` indicates another page. Requests are bounded by the pending-request caps. Invitations return up to20 currently valid pending entries, newest first; older valid entries become visible as newer entries are handled. Historical conversations return the50 most recent inactive pairs.

## Invitations and the multiplayer server

`invite` stores an accepted-friend invitation with a six-character room code, wire-version string, and a five-minute expiry. Replacing a pending invitation from the same sender to the same recipient cancels the previous one. Only the recipient may accept/decline it. Removal/blocking cancels pending invitations. Both accepted and pending invitations become unusable after expiry.

The database cannot inspect rooms held inside the running Node server. Room codes in database records are therefore **untrusted hints** until the multiplayer server verifies them. The server endpoints must check that the sender currently owns the offered room, the version is compatible, the room has space and is joinable, and the accounts are still accepted friends without a block. `relationship` and `invitation` provide narrow authenticated checks for that server flow. Accepting an invitation must never bypass the server's existing room rules or automatically move a user without their choice.

## Reporting and operation

Report reasons are `spam`, `harassment`, `inappropriate`, and `other`. Message reports must refer to a message sent by the reported account within the reporter's own conversation. Reports are private: client roles cannot browse them. An authorized Supabase administrator can review `public.neon_social_reports` in the dashboard and look up the referenced message through privileged database tools. No public moderation inbox or automatic content classifier is included.

One-minute authenticated rate buckets limit search60/min, messages60/min, friendship changes20/min, block/unblock60/min, invitation actions20/min, settings/reports20/min, and reads180/min. Excess requests receive a readable wait message. Failed authorization/payload transactions do not persist rate-counter changes.

Expired invitations remain as historical rows but never appear in actionable lists. Rate counters keep a bounded row per account/bucket. Message and report storage need an administrator-defined retention plan; schedule maintenance only after choosing that policy.

## RPC reference

Call Supabase `/rest/v1/rpc/neon_social` with the existing publishable key and the signed-in user's bearer token. Request body is `{ "action": "...", "payload": { ... } }`. Never choose the acting account from the payload.

| Action | Payload | Result |
| --- | --- | --- |
| `list` | optional `offset` | `friends`, `friendsHasMore`, `incoming`, `outgoing`, `blocked`, `history`, `invites`, `settings` |
| `search` | `query`, optional `offset` | `profiles: [{id,username,status}]`, `hasMore` |
| `friend` | `target`, `operation` | `ok`, relationship `status` |
| `messages` | `target`, optional `before` | `messages`, `hasMore`, `canSend` |
| `send` | `target`, `body`, UUID `nonce` | `message` |
| `read` | `target`, optional `through` | `ok` |
| `settings` | optional boolean `discoverable`, `requests`, `online` | `settings` |
| `report` | `target`, `reason`, optional `message_id` | `ok` |
| `invite` | `target`, uppercase `code`, `version` | `ok`, `id`, `expires_at` |
| `respond_invite` | `id`, boolean `accept` | accepted invitation details or declined status |
| `relationship` | `target` | `accepted`, `blocked`, `joinable` |
| `invitation` | `id` | invitation details for authorized participants still friends |

Friend operations are `request`, `accept`, `decline`, `cancel`, `remove`, `block`, and `unblock`. Profile status values are `none`, `incoming`, `outgoing`, `friends`, or `blocked`; historical rows use `archived`. Messages contain `id`, `sender_id`, `body`, `created_at`, and `nonce`.

## Validation limits

The migration is designed to run on Supabase PostgreSQL. Local automated tests execute it in PGlite with an `auth.users` / `auth.uid()` fixture and client roles, including repeated migration application, friendship transitions, participant authorization, blocks, nonce retries, privacy, pagination, reports, and invitations. PGlite is a local PostgreSQL runtime, not a production Supabase project. Live Auth, production RLS deployment, internet latency, and simultaneous distributed sessions still require verification after deployment. Consult the delivered test results for the checks actually run.
