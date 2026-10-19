# Chat app

The chat app brings people together with real-time messages, channels, direct
messages, reactions, profiles, and optional integrations such as Discord,
Spotify, GIF search, and push notifications. The browser interface lives in
`public/`; its TypeScript source is in `src/`. A small Node.js server serves
the app and supplies its public runtime configuration.

## Getting started from a clone

The chat needs a Supabase project configured for this app. A clone does not
come with the original project's credentials or a ready-to-use backend, so
you'll need to configure your own before the app can connect.

1. Install a current Node.js release and npm.
2. From the repository root, run:

   ```sh
   cd s
   npm ci
   cp chat/.env.example chat/.env
   ```

3. Edit `chat/.env` and add the configuration for your own Supabase project
   and provider apps. The server currently requires non-empty values for
   `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SPOTIFY_CLIENT_ID`,
   `DISCORD_CLIENT_ID`, `DISCORD_REDIRECT_URI`, and `VAPID_PUBLIC_KEY`.
   Although some integrations are optional to users, the server still expects
   each setting to be present. A working chat also needs a Supabase project
   with the required schema and backend functions.
4. Build and run the app:

   ```sh
   npm run check:chat-core
   npm run check:chat-server
   npm run start:chat
   ```

5. Open `http://localhost:3501/s/chat/`.

Keep `chat/.env` on your machine; don't commit it. The values above are
intentionally sent to the browser and must be public identifiers or
publishable keys. **Never** put service-role keys, OAuth client secrets,
Discord bot tokens, or private push-signing keys there. Store backend secrets
in the appropriate Supabase Edge Function secrets instead.

`npm run start:chat` builds the browser assets and server before starting it.
For a build without starting the server, run `npm run build:chat`. The server
reads browser assets from `public/`; TypeScript source and `.env` files are
not served.

## Configuration notes

- `HOST` and `PORT` control the local server address (defaults: `0.0.0.0` and
  `3501`).
- `CHAT_BASE_PATH` sets the URL prefix (default: `/s/chat`).
- `IS_UNDER_MATINENCE=true` shows a maintenance page instead of the chat.
- `DISCORD_REDIRECT_URI` must exactly match a redirect URL registered for
  your own Discord application. Update the local example value in `chat/.env`
  if your server uses a different address or path.
- Discord, Spotify, push notifications, and GIF resolution may also need
  their own provider settings and Supabase Edge Functions. Configure callback
  URLs and backend secrets in those services; they are not supplied by this
  repository.

## Features

- Real-time channels and direct messages
- Message history that loads older messages as you scroll
- Profiles, reactions, presence, and server/channel controls
- Optional Discord and Spotify connections
- GIF search with `/gif <search>` (requires the server's **Send GIFs**
  permission or a legacy Manager/Admin role)

Type `/` in the message box to see available command suggestions.

## Useful commands

Run these from `s/`:

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the versions recorded in the lockfile |
| `npm run check:chat-core` | Type-check selected browser modules |
| `npm run check:chat-server` | Type-check the Node.js server |
| `npm run build:chat` | Build the browser assets and server |
| `npm run start:chat` | Build and run the local server |

The TypeScript files in `src/` compile to browser JavaScript in `public/` and
to the server output in `dist/`. Browser scripts are loaded in a specific
order because they share globals; keep that order intact when changing
`public/index.html`.
