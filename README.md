# SvelteKit Route Generator

This package analyses the folder structure within `src/routes` and generates
a typed route map which you can use to generate URLs from route IDs with
type safety.

## Installation

### 1. Install the required packages

```shell
npm i -D pluggable-codegen sveltekit-routegen
yarn add -D pluggable-codegen sveltekit-routegen
pnpm add -D pluggable-codegen sveltekit-routegen
bun add -D pluggable-codegen sveltekit-routegen
```

### 2. Configure codegen

```javascript
// codegen.config.js
import { defineCodegen } from 'pluggable-codegen';
import { sveltekitRoutes } from 'sveltekit-routegen/codegen';

export default defineCodegen(
  // we'll explain this bit later
  sveltekitRoutes('src/lib/utils/routing.ts', {
    uuid: 'string',
    int: 'number',
  }),
);
```

### 3. Hook codegen into Vite

```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { codegen } from 'pluggable-codegen';
import { defineConfig } from 'vite';
import codegenConfig from './codegen.config';

export default defineConfig({
  plugins: [codegen(...codegenConfig), sveltekit()],
});
```

### 4. Don't forget to add the generated file to `.gitignore`!

### 5. Adjust your toolchain (optional)

The configuration described above ensures that the route generator runs
as part of the Vite pipeline both during development and during build, so
you don't need to do anything else for these usecases; but for example if
you're using `svelte-check` to check for type errors, it will fail if
you're running it e.g. in a CI pipeline before running `vite build`, because
the generated file wouldn't exist by then. In that case, you can use the
`pluggable-codegen` command to run the codegen. So for example, if your
`package.json` `scripts` contains something like:

```json lines
{
  // ...
  "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
}
```

You could change that to:

```json lines
{
  // ...
  "check": "svelte-kit sync && pluggable-codegen && svelte-check --tsconfig ./tsconfig.json"
}
```

## Usage

First, some vocabulary:

A **route ID** is the full relative directory path between `src/routes` and
a `+page.svelte` / `+server.ts` file. For example `/(public)/blog/[id]`.

A **route's parameters** are all the parameters defined in the route ID (so
in the previous example it would be `id`). SvelteKit understands `[required]`,
`[[optional]]`, and `[...rest]` parameters, as well as `[param=matchers]`,
and so does this package.

When using parameter matchers, you can specify _input types_ for parameters
using a particular matcher. This is "the bit we're explaining later"
mentioned in the configuration example: the second parameter of the
`sveltekitRoutes()` function used to configure the codegen is a map of
`matcher` (which is just the basename of a file in `src/params`) to `type`
(which is the TypeScript type that will be used for any parameters using
this matcher in the generated code). Any parameters which use a matcher that
isn't mapped to `string` will be converted to string by adding `.toString()`
to their usage.

All the functions exposed by this package allow you to pass in extra
parameters on top of the route parameters; the extra parameters are
serialized in the generated URL's query string.

### `path(route, params)`

Generates a URL for the specified route, returning a string.

### `link(route, params)`

Creates an instance of the `Link` class, which allows you to generate the
URL lazily, and also gives you access to the route ID, so that you can e.g.
pass a list of `Link` instances to a `<Menu>` component and have it
highlight the link which matches the current route.

```typescript
export class Link<Route extends RouteId> {
  readonly route: Route;
  readonly params: RouteParams<Route>;
  toString(): string;
}
```

### `goto(route, params, options)`

This function is a wrapper for the Svelte `goto()` function. The `options`
parameter is passed to `goto()` as-is.

### `isCurrentRoute(route)`

Returns `true` if `route` matches `page.route.id`. The twist making this
more useful than just using `===` is that the function supports matching
against route _prefixes_, as well as full route IDs. A route prefix is a
part of a route ID followed by `/*`. Given a route prefix like `/users/*`,
the following routes would match:

```
/users/add
/users/[id]/detail
/users
```

But these would **not** match:

```
/userschedule
/users-of-magic
```

### ... so where's `redirect(status, route, params)`?

It is not included for now, because it would require you to import
`@sveltejs/kit` on the frontend. You can paste this snippet somewhere in
your project:

```typescript
import { redirect as svelteRedirect } from '@sveltejs/kit';
import { path, type RouteFnParams, type RouteId } from '$lib/utils/routes';

export type RedirectStatus = 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | ({} & number);

export function redirect<Route extends RouteId>(
  status: RedirectStatus,
  ...params: RouteFnParams<Route>
): never;
export function redirect(status: RedirectStatus, route: RouteId, params: any = {}): never {
  svelteRedirect(status, path(route, params));
}
```
