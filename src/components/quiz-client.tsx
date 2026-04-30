"use client";

import { useRef, useState } from "react";

type QuizChoice = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  choices: QuizChoice[];
};

export function QuizClient({ questions }: { questions: QuizQuestion[] }) {
  const cardRef = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string>("");
  const [judged, setJudged] = useState(false);
  const [score, setScore] = useState(0);

  if (index >= questions.length) {
    return (
      <section className="border border-black p-4">
        <h1 className="text-xl">結果</h1>
        <p className="mt-2">
          {score} / {questions.length} 問正解
        </p>
      </section>
    );
  }

  const current = questions[index];
  const isLast = index === questions.length - 1;
  const correctChoice = current.choices.find((choice) => choice.isCorrect);
  const isCorrect = judged && selectedId === correctChoice?.id;

  const judge = () => {
    if (!selectedId || judged) return;
    const answeredCorrect = selectedId === correctChoice?.id;

    if (answeredCorrect) {
      setScore((prev) => prev + 1);
      cardRef.current?.animate(
        [
          {
            transform: "scale(1)",
            borderWidth: "1px",
            borderColor: "rgb(0 0 0)",
            backgroundColor: "rgb(255 255 255)",
          },
          {
            transform: "scale(1.02)",
            borderWidth: "2px",
            borderColor: "rgb(137 167 141)",
            backgroundColor: "rgb(244 251 245)",
          },
          {
            transform: "scale(1)",
            borderWidth: "1px",
            borderColor: "rgb(0 0 0)",
            backgroundColor: "rgb(255 255 255)",
          },
        ],
        { duration: 260, easing: "ease-out" },
      );
    } else {
      cardRef.current?.animate(
        [
          {
            transform: "translateX(0)",
            borderColor: "rgb(0 0 0)",
            backgroundColor: "rgb(255 255 255)",
          },
          { transform: "translateX(-6px)", borderColor: "rgb(186 141 141)", backgroundColor: "rgb(253 246 246)" },
          { transform: "translateX(6px)", borderColor: "rgb(186 141 141)", backgroundColor: "rgb(253 246 246)" },
          { transform: "translateX(-4px)", borderColor: "rgb(186 141 141)", backgroundColor: "rgb(253 246 246)" },
          { transform: "translateX(4px)", borderColor: "rgb(186 141 141)", backgroundColor: "rgb(253 246 246)" },
          {
            transform: "translateX(0)",
            borderColor: "rgb(0 0 0)",
            backgroundColor: "rgb(255 255 255)",
          },
        ],
        { duration: 280, easing: "ease-out" },
      );
    }

    setJudged(true);
  };

  const next = () => {
    setIndex((prev) => prev + 1);
    setSelectedId("");
    setJudged(false);
  };

  return (
    <section ref={cardRef} className="border border-black p-4">
      <h1 className="text-xl">問題 {index + 1}</h1>
      <p className="mt-3 text-lg">{current.prompt}</p>
      <div className="mt-4 space-y-2">
        {current.choices.map((choice) => (
          <label key={choice.id} className="flex cursor-pointer items-center gap-2 border border-black p-2">
            <input
              type="radio"
              name={`question-${current.id}`}
              value={choice.id}
              checked={selectedId === choice.id}
              onChange={() => setSelectedId(choice.id)}
              disabled={judged}
            />
            <span>{choice.text}</span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {!judged ? (
          <button
            type="button"
            className="border border-black px-3 py-2 text-sm disabled:opacity-50"
            onClick={judge}
            disabled={!selectedId}
          >
            回答する
          </button>
        ) : (
          <button type="button" className="border border-black px-3 py-2 text-sm" onClick={next}>
            {isLast ? "結果を見る" : "次へ"}
          </button>
        )}
      </div>
      {judged ? (
        <p className={`mt-3 text-sm ${isCorrect ? "answer-pop-correct answer-tone-correct" : "answer-pop-wrong answer-tone-wrong"}`}>
          {isCorrect ? "正解です。" : `不正解です。正解: ${correctChoice?.text ?? ""}`}
        </p>
      ) : null}
    </section>
  );
}
