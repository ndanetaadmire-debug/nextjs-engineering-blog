---
title: "Moving this blog from the Pages Router to the App Router"
date: "2026-11-14"
description: "What changed when this blog moved from getStaticProps to Server Components, generateStaticParams and file-based metadata."
tags: [nextjs, typescript, architecture]
---
The first version of this blog followed the Learn Next.js course: the Pages Router, `getStaticProps`, `getStaticPaths` and a `lib/posts.js` helper. Version 2 runs on the App Router. These are the main changes.

## Data loading is just a function call

In the Pages Router, a page exported `getStaticProps`, and the framework passed its return value in as props. With Server Components the page *is* the server code:

```tsx
export default async function PostPage({ params }: PageProps<"/posts/[slug]">) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  // ...
}
```

`params` is a promise in current Next.js, which is why it's awaited.

## Static paths, and nothing else

`getStaticPaths` with `fallback: false` became `generateStaticParams` plus `export const dynamicParams = false`. Every post is known at build time, so any other slug is a 404. No request ever causes a file to be read from disk at runtime.

## Metadata moved out of components

Titles used to be set with `next/head` inside each page. Now `generateMetadata` returns titles, descriptions, canonical URLs and Open Graph data. `sitemap.ts` and `robots.ts` generate those files, and a route handler serves the RSS feed at `/feed.xml`.

## The content layer got stricter

The old helper trusted whatever front matter a file had. A missing date broke sorting without any error. Now every post is checked against a schema, and a bad file fails the build with its name and the field that's wrong. That's covered in [the next post](/posts/safe-markdown-rendering).
