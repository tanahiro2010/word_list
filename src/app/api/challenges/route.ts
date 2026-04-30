import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";


export async function POST(req: NextRequest) {
    const data = await req.json();
    const deckId = data.deckId;
    if (!deckId) {
        return NextResponse.json({ error: "Deck ID is required" }, { status: 400 });
    }
    try {
        const deck = await prisma.deck.findUnique({
            where: { id: deckId }
        });
        if (!deck) {
            return NextResponse.json({ error: "Deck not found" }, { status: 404 });
        }

        // Generate a random hex prefix (0-9a-f) to match sha256 hex output
        const prefix = Array.from({ length: 5 }).map(() => Math.floor(Math.random() * 16).toString(16)).join("");
        const challenge = await prisma.challenge.create({
            data: {
                deckId: deck.id,
                prefix: prefix,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000) // Challenge expires in 15 minutes
            }
        });

        return NextResponse.json({ token: challenge.value, prefix: challenge.prefix });
    } catch (error) {
        console.error("Error creating challenge:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}