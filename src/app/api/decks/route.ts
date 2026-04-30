import { createDeckSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = createDeckSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json({ error: "タイトルを1〜100文字で入力してください。" }, { status: 400 });
    }

    const deck = await prisma.deck.create({
      data: {
        title: parsed.data.title,
      },
      select: { id: true },
    });

    return Response.json({ deckId: deck.id });
  } catch {
    return Response.json({ error: "単語帳作成に失敗しました。" }, { status: 500 });
  }
}
