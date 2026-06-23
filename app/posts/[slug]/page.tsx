import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, listPosts } from "@/src/content/posts";
import { absoluteUrl, articleJsonLd, formatDate } from "@/src/content/site";

// Every post is known at build time; anything else is a 404, never a runtime file read.
export const dynamicParams = false;

export function generateStaticParams() {
  return listPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/posts/[slug]">): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: absoluteUrl(`/posts/${post.slug}`) },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.date, tags: post.tags },
  };
}

export default async function PostPage({ params }: PageProps<"/posts/[slug]">) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return (
    <article className="post">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleJsonLd(post) }} />
      <h1>{post.title}</h1>
      <p className="meta">
        <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min read
        {post.tags.length > 0 ? " · " : null}
        {post.tags.map((t, i) => (
          <span key={t}>
            {i > 0 ? ", " : null}
            <Link href={`/tags/${t}`}>{t}</Link>
          </span>
        ))}
      </p>
      {/* Safe: produced by the sanitizing Markdown pipeline in src/content/posts.ts. */}
      <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
      <p>
        <Link href="/">← All posts</Link>
      </p>
    </article>
  );
}
