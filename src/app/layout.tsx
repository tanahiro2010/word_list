import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Geist, Geist_Mono } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import Head from "next/head";
import "./globals.css";

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
    "なんでも",
    "単語帳",
    "問題集",
    "フラッシュカード",
    "語彙学習",
    "暗記",
    "学習",
    "tanahiro2010",
    "田中博悠",
    "個人開発"
  ],
  authors: [{ name: "tanahiro2010", url: "https://nandemo.tanahiro2010.com" }],
  openGraph: {
    title: {
      default: "なんでも問題集",
      template: "%s | なんでも問題集"
    },
    description: "みんなで作る単語帳・問題集。無料・匿名で単語や問題を作成、共有できます。",
    url: "https://nandemo.tanahiro2010.com",
    siteName: "なんでも問題集",
    images: [
      {
        url: "https://nandemo.tanahiro2010.com/og-image.png",
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
    title: {
      default: "なんでも問題集",
      template: "%s | なんでも問題集"
    },
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
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://nandemo.tanahiro2010.com/#website",
                  "url": "https://nandemo.tanahiro2010.com",
                  "name": "なんでも問題集",
                  "description": "みんなで作る単語帳・問題集。無料・匿名で単語や問題を作成、共有できます。",
                  "inLanguage": "ja",
                },
                {
                  "@type": "WebPage",
                  "@id": "https://nandemo.tanahiro2010.com/#webpage",
                  "url": "https://nandemo.tanahiro2010.com",
                  "name": "なんでも問題集",
                  "isPartOf": { "@id": "https://nandemo.tanahiro2010.com/#website" },
                  "inLanguage": "ja",
                },
              ],
            }),
          }}
        />
      </Head>
      <body className="min-h-full bg-white text-black">
        {/* JSON-LD: WebSite + WebPage（基本） */}
        <AppHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>

        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
        )}
      </body>
    </html>
  );
}
