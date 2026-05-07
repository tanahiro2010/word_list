import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://nandemo.tanahiro2010.com";

export async function GET() {
  try {
    // 公開されているすべての問題集を取得
    const decks = await prisma.deck.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    // Markdown形式で生成
    const decksList = decks
      .map((deck) => {
        const publishedDate = deck.publishedAt
          ? new Date(deck.publishedAt).toLocaleDateString("ja-JP")
          : "未定";
        const deckUrl = `${SITE_URL}/decks/${deck.id}`;
        return `- [${deck.title}](${deckUrl}) - 問題数: ${deck._count.questions}問, 公開日: ${publishedDate}`;
      })
      .join("\n");

    const markdown = `# みんなで作る単語帳

このサイトは、誰でも単語帳を作成・公開・シェアできるWebアプリケーションです。  
複数の選択肢から答えを選ぶクイズ形式で、効率的に学習できます。

## サイト情報

- **サイト名**: みんなで作る単語帳
- **URL**: ${SITE_URL}
- **説明**: ログイン不要で、誰でも単語帳を作成・公開・閲覧し、クイズ形式で学習できるWebアプリケーション
- **特徴**:
  - ログイン・認証不要
  - 誰でも無料で単語帳を作成可能
  - 自分が作った単語帳を公開・シェア可能
  - シンプルな選択式クイズ形式
  - 公開された単語帳で他のユーザーも学習可能

## 公開中の問題集一覧

${decks.length === 0 ? "現在公開されている問題集はありません。" : decksList}

## 主な機能

### 単語帳の作成と公開
- シンプルなインターフェースで問題と選択肢を入力
- 作成した単語帳を公開してシェア可能

### クイズ形式での学習
- 問題文と複数の選択肢が表示される
- 正解を選択して学習を進める

### 単語帳の検索
- タイトルで公開されている単語帳を検索
- ランキング、新着など複数の表示方法`;

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error generating llms.txt:", error);
    return NextResponse.json(
      { error: "Failed to generate llms.txt" },
      { status: 500 }
    );
  }
}