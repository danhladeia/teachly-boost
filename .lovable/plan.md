

## Build Error Analysis

The build has 3 steps: `build:client` → `build:server` → `build:prerender`. The client build completes successfully (assets are listed), but the **SSR build** (`build:server`) or **prerender step** is failing.

The most likely cause: `react-router-dom` v7.13.1 moved `StaticRouter` out of `react-router-dom/server`. The type declaration in `vite-env.d.ts` masks the TypeScript error, but the actual module resolution fails at build time.

## Plan

### 1. Fix SSR entry point (`src/entry-server.tsx`)
Replace `StaticRouter` import from `react-router-dom/server` with `react-router` (v7's correct location). If `react-router` isn't a direct dependency, it's already bundled with `react-router-dom` v7.

**Alternative (simpler):** If SSR/prerendering isn't critical, remove the SSR build steps entirely:
- Remove `build:server` and `build:prerender` from `package.json` build script
- Simplify `build` to just `vite build`
- Remove `prerender.js` and `src/entry-server.tsx`
- Clean up the `StaticRouter` type declaration from `src/vite-env.d.ts`

### 2. Update `package.json` build script
Change from:
```
"build": "npm run build:client && npm run build:server && npm run build:prerender"
```
To:
```
"build": "vite build"
```

The SEO benefits from prerendering the landing page are minimal compared to the JSON-LD and meta tags already in `index.html`. The SSR setup adds complexity and fragility.

### Files to modify
- `package.json` — simplify build script
- `src/vite-env.d.ts` — remove `StaticRouter` declaration
- Delete `src/entry-server.tsx` and `prerender.js` (or keep but unused)

