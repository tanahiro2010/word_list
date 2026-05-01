import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/crypto";

export async function POST(req: Request) {
    const data = await req.json();
    const { token, nonce } = data;
    if (!token || !nonce) {
        return NextResponse.json({ error: "Token and nonce are required" }, { status: 400 });
    }

    const challenge = await prisma.challenge.findUnique({
        where: { value: token }
    });
    if (!challenge) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    if (challenge.expiresAt < new Date()) {
        return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
    }

    const expectedHash = await sha256(`${token}.${nonce}`);
    if (!expectedHash.startsWith(challenge.prefix)) {
        return NextResponse.json({ error: "Invalid nonce" }, { status: 400 });
    }

    try {
        await prisma.$transaction([
            prisma.deck.update({
                where: { id: challenge.deckId },
                data: { solvedCount: { increment: 1 } }
            }),
            prisma.challenge.delete({ where: { value: token } })
        ])
    } catch (error) {
        console.error("Error updating solved count:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}