"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EditorChoice = {
  text: string;
  isCorrect: boolean;
};

type EditorQuestion = {
  prompt: string;
  choices: EditorChoice[];
};

const createQuestion = (): EditorQuestion => ({
  prompt: "",
  choices: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ],
});

export function DeckEditor({ deckId }: { deckId: string }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<EditorQuestion[]>([createQuestion()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updatePrompt = (questionIndex: number, prompt: string) => {
    setQuestions((prev) =>
      prev.map((item, index) => (index === questionIndex ? { ...item, prompt } : item)),
    );
  };

  const updateChoiceText = (questionIndex: number, choiceIndex: number, text: string) => {
    setQuestions((prev) =>
      prev.map((item, qIndex) =>
        qIndex === questionIndex
          ? {
              ...item,
              choices: item.choices.map((choice, cIndex) =>
                cIndex === choiceIndex ? { ...choice, text } : choice,
              ),
            }
          : item,
      ),
    );
  };

  const setCorrectChoice = (questionIndex: number, choiceIndex: number) => {
    setQuestions((prev) =>
      prev.map((item, qIndex) =>
        qIndex === questionIndex
          ? {
              ...item,
              choices: item.choices.map((choice, cIndex) => ({
                ...choice,
                isCorrect: cIndex === choiceIndex,
              })),
            }
          : item,
      ),
    );
  };

  const addChoice = (questionIndex: number) => {
    setQuestions((prev) =>
      prev.map((item, index) =>
        index === questionIndex && item.choices.length < 6
          ? { ...item, choices: [...item.choices, { text: "", isCorrect: false }] }
          : item,
      ),
    );
  };

  const removeChoice = (questionIndex: number, choiceIndex: number) => {
    setQuestions((prev) =>
      prev.map((item, qIndex) => {
        if (qIndex !== questionIndex) return item;
        // keep minimum 2 choices
        if (item.choices.length <= 2) return item;
        return { ...item, choices: item.choices.filter((_, idx) => idx !== choiceIndex) };
      }),
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createQuestion()]);
  };

  const removeQuestion = (questionIndex: number) => {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== questionIndex)));
  };

  const publish = async () => {
    setError("");
    setSaving(true);
    try {
      const response = await fetch(`/api/decks/${deckId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "公開に失敗しました。");
      }
      router.push(`/decks/${deckId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      {questions.map((question, questionIndex) => (
        <div key={questionIndex} className="border border-black p-4">
          <h2 className="mb-3">問題 {questionIndex + 1}</h2>
          <label className="block text-sm">
            問題文
            <input
              className="mt-1 w-full border border-black px-2 py-2"
              value={question.prompt}
              onChange={(event) => updatePrompt(questionIndex, event.target.value)}
            />
          </label>
          <div className="mt-3 space-y-2">
            {question.choices.map((choice, choiceIndex) => (
              <div key={choiceIndex} className="border border-black p-2 flex flex-col gap-2">
                <div>
                  <label className="block text-sm">
                    選択肢 {choiceIndex + 1}
                    <input
                      className="mt-1 w-full border border-black px-2 py-2"
                      value={choice.text}
                      onChange={(event) => updateChoiceText(questionIndex, choiceIndex, event.target.value)}
                    />
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`correct-${questionIndex}`}
                      checked={choice.isCorrect}
                      onChange={() => setCorrectChoice(questionIndex, choiceIndex)}
                    />
                    正解にする
                  </label>
                  <button
                    type="button"
                    className="ml-auto border border-red-600 px-2 py-1 text-sm text-red-600 disabled:opacity-50"
                    onClick={() => removeChoice(questionIndex, choiceIndex)}
                    disabled={question.choices.length <= 2}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="border border-black px-3 py-2 text-sm disabled:opacity-50"
              disabled={question.choices.length >= 6}
              onClick={() => addChoice(questionIndex)}
            >
              選択肢を追加
            </button>
            <button
              type="button"
              className="border border-red-600 px-3 py-2 text-sm text-red-600 disabled:opacity-50"
              onClick={() => removeQuestion(questionIndex)}
              disabled={questions.length <= 1}
            >
              問題を削除
            </button>
          </div>
        </div>
      ))}

      <button type="button" className="border border-black px-3 py-2 text-sm" onClick={addQuestion}>
        問題を追加
      </button>
      <button
        type="button"
        className="ml-2 border border-black px-3 py-2 text-sm disabled:opacity-50"
        onClick={publish}
        disabled={saving}
      >
        {saving ? "公開中..." : "公開"}
      </button>
      {error ? <p className="text-sm">{error}</p> : null}
    </section>
  );
}
