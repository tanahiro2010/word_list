import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DeckEditor } from "@/components/deck-editor";

export const dynamic = "force-dynamic";

type DeckEditPageProps = {
  params: Promise<{ deckId: string }>;
};

export default async function DeckEditPage({ params }: DeckEditPageProps) {
  const { deckId } = await params;
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { id: true, title: true, isPublished: true },
  });

  if (!deck) {
    notFound();
  }

  return (
    <section>
      <h1 className="mb-2 text-2xl">問題作成</h1>
      <p className="mb-4 text-sm">単語帳: {deck.title}</p>
      {deck.isPublished ? <p className="mb-4 text-sm">この単語帳は公開済みです。</p> : null}
      <DeckEditor deckId={deck.id} />
    </section>
  );
}
