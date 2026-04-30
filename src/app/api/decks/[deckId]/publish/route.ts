import { prisma } from "@/lib/prisma";
import { publishDeckSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ deckId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { deckId } = await context.params;
    const json = await request.json();
    const parsed = publishDeckSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "問題データが不正です。" }, { status: 400 });
    }

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { id: true },
    });

    if (!deck) {
      return Response.json({ error: "単語帳が見つかりません。" }, { status: 404 });
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
  } catch {
    return Response.json({ error: "公開に失敗しました。" }, { status: 500 });
  }
}
