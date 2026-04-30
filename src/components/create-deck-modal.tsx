"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CreateDeckModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      const data = (await response.json()) as { deckId?: string; error?: string };
      if (!response.ok || !data.deckId) {
        throw new Error(data.error ?? "作成に失敗しました。");
      }

      setOpen(false);
      setTitle("");
      router.push(`/decks/${data.deckId}/edit`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="border border-black px-3 py-2 text-sm"
        onClick={() => setOpen(true)}
      >
        単語帳を作成
      </button>
      {open ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-white/90 p-4">
          <div className="w-full max-w-md border border-black bg-white p-4">
            <h2 className="mb-3 text-lg">単語帳を作成</h2>
            <form className="space-y-3" onSubmit={onSubmit}>
              <label className="block text-sm">
                タイトル
                <input
                  className="mt-1 w-full border border-black px-2 py-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                />
              </label>
              {error ? <p className="text-sm text-black">{error}</p> : null}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="border border-black px-3 py-2 text-sm disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "作成中..." : "作成して問題編集へ"}
                </button>
                <button
                  type="button"
                  className="border border-black px-3 py-2 text-sm"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  閉じる
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
