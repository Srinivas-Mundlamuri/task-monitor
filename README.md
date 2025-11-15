# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Nhost setup (GraphQL)

This project includes a minimal Nhost GraphQL helper at `src/lib/nhostClient.ts` and it is re-exported from `$lib`.

- Put your environment values in a local `.env` file (do not commit secrets). An example is provided in `.env.example`.
- Frontend (Vite) variables must be prefixed with `VITE_` to be available in the browser.

Example `.env` (local, not committed):

```powershell
VITE_NHOST_GRAPHQL_URL="https://your-subdomain.graphql.region.nhost.run/v1"
VITE_NHOST_AUTH_URL="https://your-subdomain.auth.region.nhost.run/v1"
```

Quick usage (Svelte/SvelteKit):

```ts
// import from $lib (re-exported in src/lib/index.ts)
import { graphql, setToken } from '$lib';

const QUERY = `query GetItems { items { id name } }`;

async function loadItems() {
	const res = await graphql<{ items: Array<{ id: string; name: string }> }>(QUERY);
	if (res.errors) {
		console.error(res.errors);
		return [];
	}
	return res.data?.items ?? [];
}

// after authenticating via your auth flow, store the JWT so graphql() will include it
setToken('<JWT from auth>');
```

Notes and recommendations:

- This repository includes a simple fetch-based helper. If you prefer the official SDK, install it and replace the helper:

```powershell
pnpm add @nhost/nhost-js
# or
npm install @nhost/nhost-js
```

- Keep admin secrets and the JWT signing secret server-side only. Do not commit them to git.

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
