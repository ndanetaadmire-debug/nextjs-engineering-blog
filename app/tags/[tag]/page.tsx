import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listTags, postsWithTag } from "@/src/content/posts";
import { PostList } from "../../post-list";

export const dynamicParams = false;

export function generateStaticParams() {
  return listTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps<"/tags/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  return { title: `Posts tagged ${tag}` };
}

export default async function TagPage({ params }: PageProps<"/tags/[tag]">) {
  const { tag } = await params;
  const posts = postsWithTag(tag);
  if (posts.length === 0) notFound();
  return (
    <>
      <h1>Posts tagged “{tag}”</h1>
      <PostList posts={posts} />
    </>
  );
}
