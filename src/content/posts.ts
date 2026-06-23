import matter from "gray-matter";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { z } from "zod";

/** Slugs come from file names and end up in URLs, so keep them to a boring, safe alphabet. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
  .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().startsWith(d), "date must be a real calendar date");

/**
 * Front matter contract. v1 trusted whatever YAML was in the file, so a typo
 * in a date silently broke sorting; now a bad post fails the build with the
 * file name and the field.
 */
export const frontMatterSchema = z.object({
  title: z.string().trim().min(1).max(120),
  date: isoDate,
  description: z.string().trim().min(20).max(200),
  tags: z
    .array(z.string().regex(SLUG_PATTERN, "tags must be lowercase-kebab-case"))
    .max(6)
    .default([]),
  draft: z.boolean().default(false),
  updated: isoDate.optional(),
});
export type FrontMatter = z.infer<typeof frontMatterSchema>;

export interface PostSummary extends FrontMatter {
  readonly slug: string;
  readonly readingMinutes: number;
}

export interface Post extends PostSummary {
  readonly html: string;
}

export class ContentError extends Error {
  constructor(
    readonly file: string,
    message: string,
  ) {
    super(`${file}: ${message}`);
    this.name = "ContentError";
  }
}

export const WORDS_PER_MINUTE = 220;

export function readingMinutes(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ") // code blocks are skimmed, not read word by word
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

const markdownToSafeHtml = unified()
  .use(remarkParse)
  .use(remarkRehype)
  // Default GitHub-style allow-list: no <script>, no event handlers, no javascript: URLs.
  .use(rehypeSanitize)
  .use(rehypeStringify);

export async function renderMarkdown(markdown: string): Promise<string> {
  return String(await markdownToSafeHtml.process(markdown));
}

export interface ContentOptions {
  readonly dir: string;
  /** Drafts are visible in development and hidden from production builds. */
  readonly includeDrafts: boolean;
}

export function defaultOptions(): ContentOptions {
  return { dir: path.join(process.cwd(), "posts"), includeDrafts: process.env.NODE_ENV !== "production" };
}

function parseFile(dir: string, file: string): { summary: PostSummary; body: string } {
  const slug = file.replace(/\.md$/, "");
  if (!SLUG_PATTERN.test(slug)) throw new ContentError(file, "file name must be lowercase-kebab-case, e.g. my-post.md");
  const { data, content } = matter(readFileSync(path.join(dir, file), "utf8"));
  // YAML turns unquoted 2026-06-01 into a Date (UTC midnight); normalise back to the string that was written.
  const normalised = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v instanceof Date ? v.toISOString().slice(0, 10) : v]),
  );
  const parsed = frontMatterSchema.safeParse(normalised);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!;
    throw new ContentError(file, `${issue.path.join(".") || "front matter"}: ${issue.message}`);
  }
  return { summary: { ...parsed.data, slug, readingMinutes: readingMinutes(content) }, body: content };
}

function markdownFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();
}

/** Newest first; ties broken by slug so the order never depends on the file system. */
export function listPosts(opts: ContentOptions = defaultOptions()): PostSummary[] {
  return markdownFiles(opts.dir)
    .map((f) => parseFile(opts.dir, f).summary)
    .filter((p) => opts.includeDrafts || !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export async function getPost(slug: string, opts: ContentOptions = defaultOptions()): Promise<Post | null> {
  // Only known slugs are read, so "../../etc/passwd" never reaches the file system.
  if (!SLUG_PATTERN.test(slug) || !markdownFiles(opts.dir).includes(`${slug}.md`)) return null;
  const { summary, body } = parseFile(opts.dir, `${slug}.md`);
  if (summary.draft && !opts.includeDrafts) return null;
  return { ...summary, html: await renderMarkdown(body) };
}

export function listTags(opts: ContentOptions = defaultOptions()): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of listPosts(opts)) for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function postsWithTag(tag: string, opts: ContentOptions = defaultOptions()): PostSummary[] {
  return listPosts(opts).filter((p) => p.tags.includes(tag));
}

/** Validates every post at once and reports all problems, for CI. */
export function checkContent(opts: ContentOptions): string[] {
  const problems: string[] = [];
  for (const file of markdownFiles(opts.dir)) {
    try {
      parseFile(opts.dir, file);
    } catch (err) {
      problems.push(err instanceof Error ? err.message : String(err));
    }
  }
  return problems;
}
