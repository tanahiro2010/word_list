import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/app-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "なんでも問題集",
    template: "%s | なんでも問題集"
  },
  description: "みんなで作る単語帳・問題集。無料・匿名で単語や問題を作成、共有できます。",
  keywords: [
    "単語帳",
    "問題集",
    "フラッシュカード",
    "語彙学習",
    "暗記",
    "学習",
  ],
  authors: [{ name: "tanahiro2010", url: "https://word.tanahiro2010.com" }],
  openGraph: {
    title: "なんでも問題集",
    description: "みんなで作る単語帳・問題集。無料・匿名で単語や問題を作成、共有できます。",
    url: "https://word.tanahiro2010.com",
    siteName: "なんでも問題集",
    images: [
      {
        url: "https://word.tanahiro2010.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "なんでも問題集",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "なんでも問題集",
    description: "みんなで作る単語帳・問題集。無料・匿名で単語や問題を作成、共有できます。",
    site: "@tanahiro2010",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-black">
        {/* JSON-LD: WebSite + WebPage（基本） */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://word.tanahiro2010.com/#website",
                  "url": "https://word.tanahiro2010.com",
                  "name": "なんでも問題集",
                  "description": "みんなで作る単語帳・問題集。無料・匿名で単語や問題を作成、共有できます。",
                  "inLanguage": "ja",
                },
                {
                  "@type": "WebPage",
                  "@id": "https://word.tanahiro2010.com/#webpage",
                  "url": "https://word.tanahiro2010.com",
                  "name": "なんでも問題集",
                  "isPartOf": { "@id": "https://word.tanahiro2010.com/#website" },
                  "inLanguage": "ja",
                },
              ],
            }),
          }}
        />
        <AppHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
