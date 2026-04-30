import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const decks = await prisma.deck.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    include: {
      _count: {
        select: { questions: true },
      },
    },
    take: 30,
  });

  return (
    <section>
      <h1 className="mb-4 text-2xl">みんなの単語帳</h1>
      {decks.length === 0 ? (
        <p>まだ公開された単語帳はありません。</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {decks.map((deck) => (
            <Link key={deck.id} href={`/decks/${deck.id}`} className="border border-black p-4">
              <h2 className="text-lg">{deck.title}</h2>
              <p className="mt-2 text-sm">問題数: {deck._count.questions}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
