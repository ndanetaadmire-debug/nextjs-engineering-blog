import Image from "next/image";
import { listPosts } from "@/src/content/posts";
import { SITE } from "@/src/content/site";
import { PostList } from "./post-list";

export default function Home() {
  const posts = listPosts();
  return (
    <>
      <section className="intro">
        <Image src="/profile.jpeg" alt="Admire Ndaneta" width={96} height={96} priority className="avatar" />
        <div>
          <h1>{SITE.author}</h1>
          <p>{SITE.description}</p>
        </div>
      </section>
      <PostList posts={posts} />
    </>
  );
}
