import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const PAGE_DECK_COUNT = 10;

type DecksPageProps = {
    searchParams: Promise<{ page?: string; }>;
}

export default async function Decks({ searchParams }: DecksPageProps) {
    const { page } = await searchParams;
    const parsedPage = Number(page);
    const pageNum = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 0;
    const isFirst = pageNum > 0;
    const decks = await prisma.deck.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        include: {
            _count: {
                select: { questions: true }
            }
        },
        take: PAGE_DECK_COUNT,
        skip: pageNum * PAGE_DECK_COUNT
    });
    const isFinal = decks.length === 0;

    return (
        <main className="space-y-5">
            <section id="new">
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

            <div className={`mt-10 grid gap-${isFirst || !isFinal ? "2" : "1"} sm:grid-cols-${isFirst || !isFinal ? "2" : "1"}`}>
                {isFirst && (
                    <Link href={`/decks?page=${pageNum - 1}`} className="border border-black p-4">
                        前のページへ
                    </Link>
                )}

                {!isFinal && (
                    <Link href={`/decks?page=${pageNum + 1}`} className="border border-black p-4 text-right">
                        次のページへ
                    </Link>
                )}
            </div>

        </main>

    );
}
