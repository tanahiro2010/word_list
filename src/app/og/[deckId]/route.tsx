import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "edge";

export async function GET(request: Request, { params }: { params: Promise<{ deckId: string }> }) {
    console.log(request);
    try {
        const { deckId } = await params;
        const deck = await prisma.deck.findFirst({ where: { id: deckId, isPublished: true } });

        const title = deck?.title ?? "なんでも問題集";

        return new ImageResponse(
            (
                <div
                    style={{
                        display: "flex",
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(135deg,#fff 0%, #e6ffed 100%)",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        fontFamily: 'Noto Sans JP, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
                    }}
                >
                    <div style={{ fontSize: 36, color: "#0f172a", fontWeight: 700, padding: "0 40px", textAlign: "center" }}>{title}</div>
                    <div style={{ marginTop: 20, fontSize: 20, color: "#045e54" }}>なんでも問題集 — みんなで作る単語帳</div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (err) {
        return new Response("", { status: 500 });
    }
}
