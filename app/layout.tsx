import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SITE } from "@/src/content/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s · ${SITE.shortTitle}` },
  description: SITE.description,
  authors: [{ name: SITE.author }],
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
  openGraph: { type: "website", siteName: SITE.title, locale: "en_ZA" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#content">
          Skip to content
        </a>
        <header className="site-header">
          <Link href="/" className="brand">
            {SITE.shortTitle}
          </Link>
          <nav aria-label="Main">
            <Link href="/tags">Tags</Link>
            <a href="/feed.xml">RSS</a>
          </nav>
        </header>
        <main id="content">{children}</main>
        <footer className="site-footer">
          © {new Date().getFullYear()} {SITE.author}
        </footer>
      </body>
    </html>
  );
}
