import type { PostSummary } from "./posts";

export const SITE = {
  title: "Admire Ndaneta · Engineering notes",
  shortTitle: "Engineering notes",
  description: "Notes on building web applications with Next.js, TypeScript and Postgres.",
  author: "Admire T. Ndaneta",
  // SITE_URL wins; on Vercel the production domain is provided automatically.
  url: (
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
  ).replace(/\/+$/, ""),
  locale: "en-ZA",
} as const;

export function absoluteUrl(pathname: string): string {
  return `${SITE.url}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(SITE.locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

const XML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]!);
}

/** RSS 2.0. Every interpolated value is escaped, so a title with "&" or "<" can't break the feed. */
export function buildRss(posts: readonly PostSummary[], now: Date = new Date()): string {
  const items = posts
    .slice(0, 20)
    .map((p) => {
      const link = absoluteUrl(`/posts/${p.slug}`);
      return [
        "    <item>",
        `      <title>${escapeXml(p.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(p.description)}</description>`,
        ...p.tags.map((t) => `      <category>${escapeXml(t)}</category>`),
        "    </item>",
      ].join("\n");
    })
    .join("\n");
  const lastBuild = posts[0] ? new Date(`${posts[0].date}T00:00:00Z`) : now;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.title)}</title>
    <link>${escapeXml(SITE.url)}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>${SITE.locale}</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

/** schema.org BlogPosting, serialised so it is safe inside a <script> tag. */
export function articleJsonLd(post: PostSummary): string {
  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { "@type": "Person", name: SITE.author },
    url: absoluteUrl(`/posts/${post.slug}`),
    keywords: post.tags.join(", "),
  });
  // "</script>" inside a string would end the tag early; escape "<" so it can't.
  return json.replace(/</g, "\\u003c");
}
