import type { Metadata } from "next";
import Link from "next/link";
import { listTags } from "@/src/content/posts";

export const metadata: Metadata = { title: "Tags" };

export default function TagsPage() {
  const tags = listTags();
  return (
    <>
      <h1>Tags</h1>
      <ul className="tag-cloud">
        {tags.map(({ tag, count }) => (
          <li key={tag}>
            <Link href={`/tags/${tag}`}>
              {tag} <span className="meta">({count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
