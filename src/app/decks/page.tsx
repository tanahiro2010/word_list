import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const DECKS_PER_PAGE = 10;

type DeckListPageProps = {
    searchParams: Promise<{ page?: string }>;
}

export default async function DeckListPage({ searchParams }: DeckListPageProps) {
    const params = await searchParams;
    const rawPage = Number(params.page);
    const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 0;
    const hasPreviousPage = currentPage > 0;
    const deckRows = await prisma.deck.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        include: {
            _count: {
                select: { questions: true }
            }
        },
        take: DECKS_PER_PAGE + 1,
        skip: currentPage * DECKS_PER_PAGE
    });
    const hasNextPage = deckRows.length > DECKS_PER_PAGE;
    const decks = hasNextPage ? deckRows.slice(0, DECKS_PER_PAGE) : deckRows;

    return (
        <main className="space-y-5">
            <section id="new" className="mb-10">
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

            <section className={"w-full mt-10 grid" + hasPreviousPage && hasNextPage ? "gap-2 sm:grid-cols-2" : "gap-1"}>
                {hasPreviousPage && (
                    <Link href={`/decks?page=${currentPage - 1}`} className="border border-black p-4 w-full">
                        前のページへ
                    </Link>
                )}

                {hasNextPage && (
                    <Link href={`/decks?page=${currentPage + 1}`} className="border border-black p-4 text-right w-full">
                        次のページへ
                    </Link>
                )}
            </section>

        </main>

    );
}
