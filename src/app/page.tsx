import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [newDecks, rankingDecks, recommendDecks] = await prisma.$transaction([
    prisma.deck.findMany({ // 新着単語帳
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      include: {
        _count: {
          select: { questions: true },
        },
      },
      take: 4,
    }),
    prisma.deck.findMany({  // ランキング単語帳
      where: { isPublished: true },
      orderBy: { solvedCount: "desc" },
      include: {
        _count: {
          select: { questions: true }
        }
      },
      take: 8
    }),
    prisma.deck.findMany({  // おすすめ単語帳
      where: { isPublished: true },
      orderBy: { solvedCount: "asc" },
      include: {
        _count: {
          select: { questions: true }
        }
      },
      take: 4
    })
  ]);

  return (
    <main className="space-y-5">
      <section id="recommend">
        <h1 className="mb-4 text-2xl">おすすめ単語帳</h1>

        {recommendDecks.length === 0 ? (
          <p>まだ公開された単語帳はありません。</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recommendDecks.map((deck) => (
              <Link key={deck.id} href={`/decks/${deck.id}`} className="border border-black p-4">
                <h2 className="text-lg">{deck.title}</h2>
                <p className="mt-2 text-sm">問題数: {deck._count.questions}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section id="new">
        <h1 className="mb-4 text-2xl">新着単語帳</h1>
        {newDecks.length === 0 ? (
          <p>まだ公開された単語帳はありません。</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {newDecks.map((deck) => (
              <Link key={deck.id} href={`/decks/${deck.id}`} className="border border-black p-4">
                <h2 className="text-lg">{deck.title}</h2>
                <p className="mt-2 text-sm">問題数: {deck._count.questions}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section id="ranking">
        <h1 className="mb-4 text-2xl">解かれた数ランキング</h1>
        {rankingDecks.length === 0 ? (
          <p>まだ公開された単語帳はありません。</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rankingDecks.map((deck) => (
              <Link key={deck.id} href={`/decks/${deck.id}`} className="border border-black p-4">
                <h2 className="text-lg">{deck.title}</h2>
                <p className="mt-2 text-sm">問題数: {deck._count.questions}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section id="new">
        <h1 className="mb-4 text-2xl">新着単語帳</h1>
        {newDecks.length === 0 ? (
          <p>まだ公開された単語帳はありません。</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {newDecks.map((deck) => (
              <Link key={deck.id} href={`/decks/${deck.id}`} className="border border-black p-4">
                <h2 className="text-lg">{deck.title}</h2>
                <p className="mt-2 text-sm">問題数: {deck._count.questions}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="grid gap-1">
          <Link href={`/decks`} className="border border-black p-4 w-full">
            すべての単語帳を見る
          </Link>
        </div>

      </section>
    </main>

  );
}
