import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuizClient } from "@/components/quiz-client";

export const dynamic = "force-dynamic";

type DeckPageProps = {
  params: Promise<{ deckId: string }>;
};

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
      <QuizClient questions={deck.questions} />
    </section>
  );
}
