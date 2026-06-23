import type { MetadataRoute } from "next";
import { listPosts, listTags } from "@/src/content/posts";
import { absoluteUrl } from "@/src/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const opts = { dir: `${process.cwd()}/posts`, includeDrafts: false };
  const posts = listPosts(opts);
  return [
    { url: absoluteUrl("/"), lastModified: posts[0]?.date },
    ...posts.map((p) => ({ url: absoluteUrl(`/posts/${p.slug}`), lastModified: p.updated ?? p.date })),
    ...listTags(opts).map(({ tag }) => ({ url: absoluteUrl(`/tags/${tag}`) })),
  ];
}
