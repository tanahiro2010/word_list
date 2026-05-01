import Link from "next/link";
import { CreateDeckModal } from "@/components/create-deck-modal";

export function AppHeader() {
  return (
    <header className="border-b border-black">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          なんでも問題集
        </Link>
        <form action="/search" className="ml-auto flex items-center gap-2">
          <input
            type="text"
            name="q"
            placeholder="単語帳タイトルを検索"
            className="w-60 border border-black px-2 py-2 text-sm"
          />
          <button type="submit" className="border border-black px-3 py-2 text-sm hidden md:block">
            検索
          </button>
        </form>
        <CreateDeckModal />
      </div>
    </header>
  );
}
