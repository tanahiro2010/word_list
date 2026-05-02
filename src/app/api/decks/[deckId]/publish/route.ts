import { prisma } from "@/lib/prisma";
import { publishDeckSchema } from "@/lib/validators";
import {
  ABUSE_PROTECTION,
  checkRateLimit,
  containsBlockedContent,
  responseTooManyRequests,
} from "@/lib/abuse-protection";

type RouteContext = {
  params: Promise<{ deckId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > ABUSE_PROTECTION.requestSizeLimit.publishDeckBytes) {
      return Response.json({ error: "リクエストサイズが大きすぎます。" }, { status: 413 });
    }

    const burstLimit = checkRateLimit({
      request,
      ...ABUSE_PROTECTION.rateLimit.publishDeck.burst,
    });
    if (!burstLimit.ok) {
      return responseTooManyRequests(burstLimit.retryAfterSec);
    }

    const sustainedLimit = checkRateLimit({
      request,
      ...ABUSE_PROTECTION.rateLimit.publishDeck.sustained,
    });
    if (!sustainedLimit.ok) {
      return responseTooManyRequests(sustainedLimit.retryAfterSec);
    }

    const { deckId } = await context.params;
    const json = await request.json();
    console.log("Received publish request for deckId:", deckId, "with body:", json);
    const parsed = publishDeckSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error("Invalid request body: " + JSON.stringify(parsed.error.format()));
    }

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { id: true },
    });

    if (!deck) {
      return Response.json({ error: "単語帳が見つかりません。" }, { status: 404 });
    }

    for (const question of parsed.data.questions) {
      if (containsBlockedContent(question.prompt)) {
        return Response.json({ error: "問題文に使用できない文字列が含まれています。" }, { status: 400 });
      }
      for (const choice of question.choices) {
        if (containsBlockedContent(choice.text)) {
          return Response.json({ error: "選択肢に使用できない文字列が含まれています。" }, { status: 400 });
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.choice.deleteMany({
        where: {
          question: {
            deckId,
          },
        },
      });

      await tx.question.deleteMany({
        where: { deckId },
      });

      for (const [questionIndex, question] of parsed.data.questions.entries()) {
        const createdQuestion = await tx.question.create({
          data: {
            deckId,
            prompt: question.prompt,
            orderIndex: questionIndex,
          },
          select: { id: true },
        });

        await tx.choice.createMany({
          data: question.choices.map((choice, choiceIndex) => ({
            questionId: createdQuestion.id,
            text: choice.text,
            isCorrect: choice.isCorrect,
            orderIndex: choiceIndex,
          })),
        });
      }

      await tx.deck.update({
        where: { id: deckId },
        data: {
          isPublished: true,
          publishedAt: new Date(),
        },
      });
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to publish deck:", error);
    return Response.json({ error: "問題データが不正です。" }, { status: 400 });
  }
}
