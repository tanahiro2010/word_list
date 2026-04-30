import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const keyword = params.q?.trim() ?? "";

  const decks = keyword
    ? await prisma.deck.findMany({
        where: {
          isPublished: true,
          title: {
            contains: keyword,
            mode: "insensitive",
          },
        },
        orderBy: { publishedAt: "desc" },
        include: {
          _count: {
            select: { questions: true },
          },
        },
      })
    : [];

  return (
    <section>
      <h1 className="mb-4 text-2xl">検索</h1>
      {!keyword ? (
        <p>ヘッダーの検索ボックスからタイトルを入力してください。</p>
      ) : decks.length === 0 ? (
        <p>「{keyword}」に一致する単語帳は見つかりませんでした。</p>
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
