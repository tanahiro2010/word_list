import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuizClient } from "@/components/quiz-client";
import { title } from "process";


export const dynamic = "force-dynamic";

type DeckPageProps = {
  params: Promise<{ deckId: string }>;
};

export async function generateMetadata({ params }: DeckPageProps): Promise<Metadata> {
  const { deckId } = await params;
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, isPublished: true },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          choices: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  });
  if (!deck) return {
    title: "404 問題が見つかりません",
    description: "問題がみつかりません"
  }
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://word.tanahiro2010.com";

  return {
    title: deck.title,
    description: `なんでも問題集に投稿された問題集「${deck.title}」を今すぐプレイしましょう！`,
    openGraph: {
      title: deck.title,
      description: `なんでも問題集に投稿された問題集「${deck.title}」を今すぐプレイしましょう！`,
      url: `${baseUrl}/decks/${deck.id}`,
      images: [{ url: `${baseUrl}/og/${deck.id}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: deck.title,
      description: `なんでも問題集に投稿された問題集「${deck.title}」を今すぐプレイしましょう！`,
      images: [`${baseUrl}/og/${deck.id}`],
    },
  };
} 

export default async function DeckPage({ params }: DeckPageProps) {
  const { deckId } = await params;
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, isPublished: true },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          choices: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  });

  if (!deck) {
    notFound();
  }

  return (
    <section>
      <h1 className="mb-4 text-2xl">{deck.title}</h1>
      <QuizClient questions={deck.questions} deckId={deckId} title={deck.title} />
    </section>
  );
}
