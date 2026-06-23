import { describe, expect, it } from "vitest";
import type { PostSummary } from "@/src/content/posts";
import { absoluteUrl, articleJsonLd, buildRss, escapeXml, formatDate, SITE } from "@/src/content/site";

const post: PostSummary = {
  slug: "ampersands",
  title: 'Tom & Jerry <script>alert("x")</script>',
  date: "2026-11-14",
  description: "Testing that feeds & structured data escape <everything> properly.",
  tags: ["security"],
  draft: false,
  readingMinutes: 2,
};

describe("escapeXml", () => {
  it("escapes the five XML special characters", () => {
    expect(escapeXml(`<a href="x">Tom & 'Jerry'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; &apos;Jerry&apos;&lt;/a&gt;");
  });
});

describe("buildRss", () => {
  const xml = buildRss([post]);

  it("escapes every interpolated value", () => {
    expect(xml).toContain("<title>Tom &amp; Jerry &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</title>");
    expect(xml).not.toContain("<script>");
  });

  it("uses absolute links, RFC 822 dates and categories", () => {
    expect(xml).toContain(`<link>${SITE.url}/posts/ampersands</link>`);
    expect(xml).toContain("<pubDate>Sat, 14 Nov 2026 00:00:00 GMT</pubDate>");
    expect(xml).toContain("<category>security</category>");
  });

  it("caps the feed at 20 items", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ ...post, slug: `p-${i}` }));
    expect(buildRss(many).match(/<item>/g)).toHaveLength(20);
  });
});

describe("articleJsonLd", () => {
  it("can't be used to close the script tag early", () => {
    const json = articleJsonLd(post);
    expect(json).not.toContain("</script>");
    expect(JSON.parse(json)).toMatchObject({ "@type": "BlogPosting", headline: post.title, datePublished: "2026-11-14" });
  });
});

describe("helpers", () => {
  it("builds absolute URLs and formats dates in en-ZA", () => {
    expect(absoluteUrl("posts/a")).toBe(`${SITE.url}/posts/a`);
    expect(formatDate("2026-06-01")).toBe("1 June 2026");
  });
});
