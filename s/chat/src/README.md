# Chat source guide

The chat's browser and server TypeScript sources are organized by feature.
For setup, configuration, and build commands, see the [chat README](../README.md).

## Browser app

| File | What it covers |
| --- | --- |
| `auth.ts` | Sign-in, profiles, and identity |
| `chat.ts` | Channels, messages, members, and chat interactions |
| `realtime.ts` | Realtime subscriptions, direct messages, and reactions |
| `server.ts` | Server navigation, settings, roles, and account UI |
| `commands.ts` | Voice, theme, GIF, and channel-permission features |
| `discord.ts` | Discord linking, import, and synchronization |
| `spotify.ts` | Spotify linking, playback, and presence |
| `spotify-callback.ts` | Spotify OAuth callback page |
| `admin_debug.ts` | Admin diagnostics and tutorials |
| `ad.ts` | Ad integration |
| `constants.ts` | Shared UI helpers and context menus |
| `ui-dialogs.ts` | Shared dialog and confirmation helpers |
| `sw.ts` | Service worker and offline behavior |
| `chat-redirect.ts` | Chat redirect entry point |
| `discord-config.ts` | Discord configuration types and defaults |
| `chat-config.d.ts` | Runtime configuration types |
| `browser-globals.d.ts` | Shared browser globals and client types |

Browser scripts compile to classic JavaScript and share globals. Their load
order in `../public/index.html` is intentional; preserve it when editing the
script list.

## Node.js server

[`server.ts`](server.ts) serves the chat shell, static browser assets, and a
generated configuration script. It is compiled to `../dist/server.js`. Its
environment variables and local run instructions are documented in the
[chat README](../README.md).
