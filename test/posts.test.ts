import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  checkContent,
  getPost,
  listPosts,
  listTags,
  postsWithTag,
  readingMinutes,
  renderMarkdown,
  type ContentOptions,
} from "@/src/content/posts";

const dir = fileURLToPath(new URL("./fixtures/posts", import.meta.url));
const badDir = fileURLToPath(new URL("./fixtures/bad-posts", import.meta.url));
const prod: ContentOptions = { dir, includeDrafts: false };
const dev: ContentOptions = { dir, includeDrafts: true };

describe("listPosts", () => {
  it("sorts newest first and breaks date ties by slug", () => {
    expect(listPosts(prod).map((p) => p.slug)).toEqual(["newer", "same-day-a", "same-day-b", "older"]);
  });

  it("hides drafts in production and shows them in development", () => {
    expect(listPosts(prod).some((p) => p.draft)).toBe(false);
    expect(listPosts(dev).map((p) => p.slug)).toContain("work-in-progress");
  });

  it("normalises unquoted YAML dates back to YYYY-MM-DD", () => {
    expect(listPosts(prod).find((p) => p.slug === "older")?.date).toBe("2025-01-10");
  });

  it("defaults optional fields", () => {
    expect(listPosts(prod).find((p) => p.slug === "same-day-a")).toMatchObject({ tags: [], draft: false });
  });
});

describe("getPost", () => {
  it("renders a post to HTML", async () => {
    const post = await getPost("older", prod);
    expect(post?.html).toContain("<strong>world</strong>");
  });

  it("returns null for unknown slugs, traversal attempts and drafts in production", async () => {
    expect(await getPost("missing", prod)).toBeNull();
    expect(await getPost("../bad-posts/bad-date", prod)).toBeNull();
    expect(await getPost("..%2Fpackage", prod)).toBeNull();
    expect(await getPost("work-in-progress", prod)).toBeNull();
    expect(await getPost("work-in-progress", dev)).not.toBeNull();
  });
});

describe("tags", () => {
  it("counts tags across published posts only", () => {
    expect(listTags(prod)).toEqual([
      { tag: "alpha", count: 2 },
      { tag: "beta", count: 1 },
    ]);
    expect(postsWithTag("beta", prod).map((p) => p.slug)).toEqual(["newer"]);
  });
});

describe("content validation", () => {
  it("reports every invalid file with its name and the field at fault", () => {
    const problems = checkContent({ dir: badDir, includeDrafts: true });
    expect(problems).toHaveLength(3);
    expect(problems.find((p) => p.startsWith("Bad_Name.md"))).toMatch(/kebab-case/);
    expect(problems.find((p) => p.startsWith("bad-date.md"))).toMatch(/date: date must be a real calendar date/);
    expect(problems.find((p) => p.startsWith("no-description.md"))).toMatch(/^no-description\.md: description/);
  });

  it("fails loudly instead of skipping a bad post", () => {
    expect(() => listPosts({ dir: badDir, includeDrafts: true })).toThrow(/\.md: /);
  });

  it("accepts the real posts in this repo", () => {
    expect(checkContent({ dir: fileURLToPath(new URL("../posts", import.meta.url)), includeDrafts: true })).toEqual([]);
  });
});

describe("renderMarkdown sanitizes hostile input", () => {
  it.each([
    ["script tags", "<script>alert(1)</script>", "<script"],
    ["event handlers", '<img src="x" onerror="alert(1)">', "onerror"],
    ["javascript: links", "[click](javascript:alert(1))", "javascript:"],
    ["iframes", '<iframe src="https://evil.example"></iframe>', "<iframe"],
    ["inline styles", '<p style="position:fixed">x</p>', "style="],
  ])("strips %s", async (_name, markdown, forbidden) => {
    expect((await renderMarkdown(markdown)).toLowerCase()).not.toContain(forbidden);
  });

  it("keeps ordinary Markdown", async () => {
    const html = await renderMarkdown("# Title\n\nA [link](https://example.com) and `code`.\n\n```ts\nconst x = 1;\n```");
    expect(html).toContain('<a href="https://example.com">link</a>');
    expect(html).toContain("<code>code</code>");
    expect(html).toContain('<code class="language-ts">');
  });
});

describe("readingMinutes", () => {
  it("rounds to whole minutes, at least one, and skips code blocks", () => {
    expect(readingMinutes("word ".repeat(10))).toBe(1);
    expect(readingMinutes("word ".repeat(660))).toBe(3);
    expect(readingMinutes(`intro\n\n\`\`\`\n${"code ".repeat(5000)}\n\`\`\``)).toBe(1);
  });
});
