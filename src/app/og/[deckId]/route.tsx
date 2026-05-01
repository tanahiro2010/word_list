import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

async function arrayBufferToBase64(buffer: ArrayBuffer) {
    if (typeof Buffer !== "undefined") return Buffer.from(buffer).toString("base64");
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return globalThis.btoa(binary);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ deckId: string }> }) {
    try {
        const { deckId } = await params;
        const deck = await prisma.deck.findFirst({ where: { id: deckId, isPublished: true } });
        const title = deck?.title ?? "なんでも問題集";

        const fontResp = await fetch(new URL("/craftmincho.otf", req.url));
        const fontData = await fontResp.arrayBuffer();

        const bgResp = await fetch(new URL("/og-image-bg.png", req.url));
        const bgData = await bgResp.arrayBuffer();
        const bgBase64 = await arrayBufferToBase64(bgData);

        return new ImageResponse(
            (
                <div
                    style={{
                        display: "flex",
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        backgroundImage: `url('data:image/png;base64,${bgBase64}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        textAlign: "center",
                    }}
                >
                    <div style={{
                        fontFamily: 'CraftMincho, Noto Sans JP, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
                        fontSize: 64,
                        color: "#0f172a",
                        fontWeight: 700,
                        padding: "0 60px",
                        lineHeight: 1.1,
                        maxWidth: 1000,
                    }}>{title}</div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
                fonts: [
                    {
                        name: "CraftMincho",
                        data: fontData,
                        style: "normal",
                        weight: 400,
                    },
                ],
            },
        );
    } catch (err) {
        return new Response("", { status: 500 });
    }
}
