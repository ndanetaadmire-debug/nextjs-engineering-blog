import Link from "next/link";
import type { PostSummary } from "@/src/content/posts";
import { formatDate } from "@/src/content/site";

export function PostList({ posts }: { posts: readonly PostSummary[] }) {
  if (posts.length === 0) return <p>No posts yet.</p>;
  return (
    <ul className="post-list">
      {posts.map((p) => (
        <li key={p.slug}>
          <h2>
            <Link href={`/posts/${p.slug}`}>{p.title}</Link>
            {p.draft ? <span className="badge">draft</span> : null}
          </h2>
          <p className="meta">
            <time dateTime={p.date}>{formatDate(p.date)}</time> · {p.readingMinutes} min read
          </p>
          <p>{p.description}</p>
        </li>
      ))}
    </ul>
  );
}
