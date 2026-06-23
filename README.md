# Engineering notes: a Next.js App Router blog

[![CI](https://github.com/ndanetaadmire-debug/nextjsp1/actions/workflows/ci.yml/badge.svg)](https://github.com/ndanetaadmire-debug/nextjsp1/actions/workflows/ci.yml)

A statically generated blog on **Next.js 16 (App Router)**, React 19 and TypeScript. Posts are Markdown files in `posts/`. Each one is checked against a schema at build time, rendered through a sanitizing pipeline and published as static HTML, along with tags, an RSS feed, a sitemap and structured data.

> **Version 2.** This started as my Learn Next.js course project: Pages Router, `getStaticProps`, plain JavaScript and a README with an unresolved merge conflict. Version 2 moves it to the App Router and treats content as untrusted input. The post [Moving this blog from the Pages Router to the App Router](posts/moving-to-the-app-router.md) walks through the changes. The v1 code is in the git history.

## Features

- **Fully static.** Every route is prerendered (`○`/`●` in `next build`). `dynamicParams = false` means an unknown slug is a 404, never a runtime file read.
- **Validated content.** Zod checks the front matter (title, real calendar dates, description length, kebab-case tags, draft flag). A bad post fails CI with the file name and the field, instead of disappearing from the list without an error.
- **Safe rendering.** `remark-parse → remark-rehype → rehype-sanitize → rehype-stringify`. Scripts, event handlers, iframes, inline styles and `javascript:` links are removed, and tests feed hostile Markdown through the real pipeline.
- **No path traversal.** Slugs are limited to `a-z0-9-` and only looked up from the actual file list.
- **SEO.** `generateMetadata` (titles, descriptions, canonical URLs, Open Graph), `sitemap.ts`, `robots.ts`, an RSS 2.0 route handler and `BlogPosting` JSON-LD escaped so it can't close its `<script>` tag.
- **Drafts.** Visible in development, excluded from production builds, the feed and the sitemap.
- **Accessible and lean.** Semantic HTML, skip link, dark mode via `prefers-color-scheme`, `next/image` for the avatar, and no client-side JavaScript beyond what Next.js ships.
- **Security headers.** `X-Frame-Options`, `nosniff`, `Referrer-Policy` and `Permissions-Policy`, with `x-powered-by` turned off.

## Structure

```
app/                     routes (Server Components)
  page.tsx               post list
  posts/[slug]/page.tsx  post page: generateStaticParams, generateMetadata, JSON-LD
  tags/, tags/[tag]/     tag index and tag pages
  feed.xml/route.ts      RSS (force-static)
  sitemap.ts, robots.ts
src/content/
  posts.ts               content layer: read, validate, sort, render
  site.ts                site config, RSS builder, JSON-LD, formatting
posts/                   Markdown posts
scripts/check-content.ts validates every post and reports all problems
test/                    Vitest: content layer, sanitizer, RSS and JSON-LD escaping
```

The content layer is plain TypeScript with no Next.js imports, so it's unit-tested directly against fixture posts, including a folder of deliberately broken ones.

## Writing a post

Create `posts/my-post.md`:

```markdown
---
title: "My post"
date: "2026-11-20"
description: "One or two sentences shown in the list, the feed and search results."
tags: [nextjs, testing]
draft: true
---
Markdown here.
```

Run `npm run check:content` to validate it, and remove `draft: true` to publish.

## Development

```bash
npm install
npm run dev            # http://localhost:3000
npm test               # 23 tests
npm run typecheck
npm run build          # static build
```

On Vercel the site URL comes from `VERCEL_PROJECT_PRODUCTION_URL` automatically; set `SITE_URL` to override it.

## License

MIT © Admire T. Ndaneta
