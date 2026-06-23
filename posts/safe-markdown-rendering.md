---
title: "Rendering Markdown without trusting it"
date: "2026-11-14"
description: "How this blog turns Markdown into HTML through a sanitizing pipeline, and why the post page can use dangerouslySetInnerHTML safely."
tags: [security, typescript, nextjs]
---
Blog posts are Markdown files in the repository, so it's tempting to treat them as trusted. But Markdown allows raw HTML. A copied snippet, a pasted embed or a future guest post could add a `<script>` tag or an `onerror` handler, and the page would run it.

## The pipeline

This blog converts Markdown in four steps with [unified](https://unifiedjs.com):

1. `remark-parse`: Markdown to a syntax tree
2. `remark-rehype`: Markdown tree to HTML tree
3. `rehype-sanitize`: removes anything not on a GitHub-style allow-list, including script tags, event handlers and `javascript:` links
4. `rehype-stringify`: HTML tree to a string

Sanitizing the *tree*, not the final string, matters. Regex-based cleaning of HTML strings is easy to get around. A tree has no ambiguity about what counts as an attribute.

## Proving it

The tests feed hostile Markdown through the real pipeline and check the output:

```ts
const html = await renderMarkdown('<img src=x onerror="alert(1)"> [x](javascript:alert(1))');
expect(html).not.toContain("onerror");
expect(html).not.toContain("javascript:");
```

With that guarantee in place, `dangerouslySetInnerHTML` on the post page is a deliberate decision rather than a risk. The same goes for the structured-data `<script>` tag: its JSON escapes `<`, so a title containing `</script>` can't close the tag early.

## Other inputs

- **Slugs** come from file names, are limited to `a-z0-9-`, and are only looked up from the list of files that actually exist. A request for `../../etc/passwd` never reaches the file system.
- **RSS** escapes every interpolated value, so a title with `&` or `<` can't break the feed.
