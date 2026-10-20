# Chat app

The chat app is a TypeScript browser client backed by a Node.js server and
Supabase. The server serves the browser app, provides its runtime configuration,
and proxies browser API and Realtime requests to Supabase. Serving `public/`
as a static site alone is not sufficient.

## Requirements

- Node.js 20.6 or newer and npm
- A Supabase project with the chat's database schema, authentication, policies,
  Realtime tables, and storage configured
- Supabase CLI for applying migrations and deploying Edge Functions
- Provider accounts only for the integrations you want to enable (Discord,
  Spotify, GIF search, and web push)

## Install and run locally

Run these commands from `s/`:

```sh
npm ci
cp chat/.env.example chat/.env
```

Edit `chat/.env` and provide values for all six required settings:

| Setting | Value |
| --- | --- |
| `SUPABASE_URL` | Project URL from the Supabase project settings |
| `SUPABASE_PUBLISHABLE_KEY` | The project's publishable (or legacy anon) key |
| `SPOTIFY_CLIENT_ID` | Spotify application client ID |
| `DISCORD_CLIENT_ID` | Discord application client ID |
| `DISCORD_REDIRECT_URI` | Exact chat URL registered in the Discord application, e.g. `http://localhost:3501/s/chat/` |
| `VAPID_PUBLIC_KEY` | Public key from the VAPID key pair used by the push function |

The server currently rejects startup if any of these six values is empty, even
if you do not plan to use that integration. Use real values for integrations
you enable. Keep `chat/.env` local and do not commit it.

Check types, build, then start the app:

```sh
npm run check:chat-core
npm run check:chat-server
npm run build:chat
npm run start:chat
```

`start:chat` builds both the browser assets and server before starting Node.
Open <http://localhost:3501/s/chat/>. Use `Ctrl+C` to stop the server. To
start without rebuilding, after a successful build run:

```sh
node --env-file=chat/.env chat/dist/server.js
```

## Supabase setup

The chat requires a backend; creating a new Supabase project and starting the
Node server is not enough. The repository does not include a complete first-time
schema bootstrap.
[`DB.md`](DB.md) is a schema reference and explicitly is not a migration to
run. Use a Supabase project that already has the chat's core tables, or create
and review the complete schema, constraints, policies, and storage setup for
your project before continuing.

The browser uses Supabase Auth, Postgres, Realtime, and the `avatars` storage
bucket. The `20261020184600_enable_chat_realtime.sql` migration configures voice
participant DELETE events; `20261020185900_enable_realtime_for_all_public_tables.sql`
adds every existing table in the `public` schema to `supabase_realtime`. Apply
migrations to the hosted project for this change to take effect. Configure the
project's sign-in providers, create the bucket and its policies, and enable
appropriate Row-Level Security policies on every exposed table and bucket.
Realtime still requires appropriate `SELECT` policies; do not disable RLS to
make the client work.

To apply the migration included in this repository, run from the repository
root. `npx` can run the Supabase CLI without adding it to this project's
dependencies:

```sh
npx supabase --version
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

`db push` applies tracked migrations, including
`supabase/migrations/20260822_discord_integration.sql` and the Realtime
migrations; the Discord migration expects core chat tables to exist already.
Review and confirm the linked project before pushing.

## Browser console diagnostics

After the chat scripts load, diagnostics are available as global functions in
the browser developer console and the built-in SysAdmin console. Run `llaHelp()`
to list them by feature, or `llaHealthCheck()` for an overview. Examples:
`llaAuthCheck()`, `llaServerCheck()`, `llaRealtimeVoiceProbe()`,
`llaMessageFetch()`, `llaPresenceCheck()`, `llaDmCheck()`, and
`llaVoiceStats()`.

Most helpers only inspect application state or read database rows. The explicit
voice tests `testAudioPlayback()` and `simulatePerson()` play a short low-volume
tone; `testAudioRouting()` and `testVoiceChat()` may request microphone access.
`llaVoiceStopMonitors()` stops the optional live microphone-level monitor.

### Edge Functions and integrations

Deploy functions from the repository root after linking the project. Deploy
the functions for features in use; these are the available chat functions:

```sh
npx supabase functions deploy censor-message
npx supabase functions deploy log-ip
npx supabase functions deploy resolve-gif
npx supabase functions deploy send-push
npx supabase functions deploy spotify-exchange
npx supabase functions deploy discord-oauth
npx supabase functions deploy discord-import
npx supabase functions deploy discord-message-sync
npx supabase functions deploy slash-commands
```

`get-link-preview` and `rapid-action` are also present in
`supabase/functions/` for optional use. Configure the needed Edge Function
secrets in the Supabase dashboard or with `npx supabase secrets set`. Supabase
provides its project URL and service-role key to Edge Functions; do not put the
service-role key in the chat server's `.env` or browser code.

| Feature | Required provider setup / Edge Function secrets |
| --- | --- |
| Core chat | Deploy `censor-message` and `log-ip`; provide appropriate Supabase policies |
| Discord linking | Deploy `discord-oauth`; set `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and `DISCORD_REDIRECT_URI` as function secrets. Register the exact redirect URI with Discord and in `chat/.env`. |
| Discord server import and sync | Deploy `discord-import` and `discord-message-sync`; set `DISCORD_BOT_TOKEN` and invite/configure that bot as needed. |
| Spotify linking | Deploy `spotify-exchange`; register `http://localhost:3501/s/chat/spotify-callback.html` (or the equivalent production URL) with Spotify. The client ID is supplied by `chat/.env`; this flow uses PKCE. |
| GIF search | Deploy `resolve-gif`; set the `KLIPY_API_KEY` function secret. |
| Push notifications | Deploy `send-push`; set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (and optionally `VAPID_EMAIL`) as function secrets. The public key must match the key in `chat/.env`. |

Keep provider client secrets, bot tokens, VAPID private keys, and Supabase
service-role keys in Supabase secrets or another trusted server-side secret
store. Never expose them in `chat/.env`, which supplies values to the browser
for some public settings, or commit them to the repository.

## Configuration

`chat/.env.example` documents the server's settings:

- `HOST` — listen address; defaults to `0.0.0.0`.
- `PORT` — listen port; defaults to `3501`.
- `CHAT_BASE_PATH` — public URL prefix; defaults to `/s/chat`.
- `IS_UNDER_MATINENCE=true` — serve a maintenance page instead of the app.
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` — the server uses these when
  proxying browser requests to Supabase.
- `SPOTIFY_CLIENT_ID`, `DISCORD_CLIENT_ID`, `DISCORD_REDIRECT_URI`, and
  `VAPID_PUBLIC_KEY` — public runtime configuration supplied to the browser.

The Supabase URL and key are kept server-side and added by the proxy; the
browser receives a placeholder key. This proxy does not replace RLS. For
production, run the Node server behind HTTPS (or configure an equivalent
server-side Supabase proxy), update provider callback URLs, and set production
environment values securely.

## Commands

Run npm commands from `s/`:

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the exact dependencies from `s/package-lock.json` |
| `npm run check:chat-core` | Strict type-check selected browser modules |
| `npm run check:chat-server` | Type-check the Node server |
| `npm run build:chat` | Compile browser TypeScript to `chat/public/` and server TypeScript to `chat/dist/` |
| `npm run start:chat` | Build and run the local chat server |
| `node --env-file=chat/.env chat/dist/server.js` | Run the already-built server without rebuilding |
| `npm exec eslint -- chat --ext .js --cache` | Lint chat JavaScript files |

There is no chat test suite yet. The package's `npm test` script is a
placeholder that exits with an error; it is not a test command.

The browser TypeScript files compile to classic scripts that share globals.
Their order in `public/index.html` is intentional; preserve it when editing
the script list. The server only serves browser assets from `public/`; it does
not serve TypeScript source, `.env` files, or the `dist/` directory.

## Features

- Real-time channels, direct messages, history, reactions, and presence
- Profiles and server/channel administration
- Optional Discord and Spotify connections
- GIF search with `/gif <search>` (requires the **Send GIFs** permission or a
  legacy Manager/Admin role)
- Optional push notifications

Type `/` in the message box to see available chat command suggestions.
