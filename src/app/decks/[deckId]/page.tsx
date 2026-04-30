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

  return {
    title: deck.title,
    description: `なんでも問題集に投稿された問題集「${title}」を今すぐプレイしましょう！`
  }
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
