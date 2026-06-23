import path from "node:path";
import { checkContent } from "../src/content/posts";

const problems = checkContent({ dir: path.join(process.cwd(), "posts"), includeDrafts: true });
if (problems.length > 0) {
  console.error(`Content check failed:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}
console.log("All posts are valid.");
