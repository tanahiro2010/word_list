import { createDeckSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import {
  ABUSE_PROTECTION,
  checkRateLimit,
  containsBlockedContent,
  responseTooManyRequests,
} from "@/lib/abuse-protection";

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > ABUSE_PROTECTION.requestSizeLimit.createDeckBytes) {
      return Response.json({ error: "リクエストサイズが大きすぎます。" }, { status: 413 });
    }

    const burstLimit = checkRateLimit({
      request,
      ...ABUSE_PROTECTION.rateLimit.createDeck.burst,
    });
    if (!burstLimit.ok) {
      return responseTooManyRequests(burstLimit.retryAfterSec);
    }

    const sustainedLimit = checkRateLimit({
      request,
      ...ABUSE_PROTECTION.rateLimit.createDeck.sustained,
    });
    if (!sustainedLimit.ok) {
      return responseTooManyRequests(sustainedLimit.retryAfterSec);
    }

    const json = await request.json();
    const parsed = createDeckSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json({ error: "タイトルを1〜100文字で入力してください。" }, { status: 400 });
    }
    if (containsBlockedContent(parsed.data.title)) {
      return Response.json({ error: "タイトルに使用できない文字列が含まれています。" }, { status: 400 });
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
