# Let's Learn Algebra

Welcome! This repository contains the source for Let's Learn Algebra, a
browser-based site with learning pages, games, and interactive projects. Most
of the site is made from static files, so you can browse and work on it without
setting up a web framework or build system.

## Find your way around

- `s/` contains the files served as the website.
- `s/schoolwork/` contains standalone pages and projects.
- `s/chat/` contains the chat app, its TypeScript source, and its Node.js
  development/server setup.
- `supabase/` contains database migrations and backend functions used by the
  chat and other integrations.

## Preview the site

You can open a page in `s/` directly in a browser, or serve the folder over
HTTP for a more realistic preview. For example, from the repository root:

```sh
npx serve s
```

Then open the local URL printed by the server. The static site does not require
the chat app's Node.js server.

## Work on the chat app

The chat has its own setup, including a Supabase backend and local environment
configuration. Start with the [chat README](s/chat/README.md) before running
its server; a fresh clone does not include project credentials or a configured
backend.

Have fun exploring, learning, and building! ✨
