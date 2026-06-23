import { listPosts } from "@/src/content/posts";
import { buildRss } from "@/src/content/site";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildRss(listPosts({ dir: `${process.cwd()}/posts`, includeDrafts: false })), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
