"use client";

import { useRef, useState, useEffect } from "react";

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

type QuizClient = {
  questions: QuizQuestion[];
  deckId: string;
  title: string;
}

export function QuizClient({ questions, deckId, title }: QuizClient) {
  const cardRef = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string>("");
  const [judged, setJudged] = useState(false);
  const [score, setScore] = useState(0);
  const completedRef = useRef(false);

  const getChallenge = (async (deckId: string) => {
    const response = await fetch(`/api/challenges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        deckId: deckId
      })
    });
    if (!response.ok) {
      throw new Error("failed to create challenge");
    }
    return await response.json();
  });
  const onComplete = (async (deckId: string) => {
    
  });

  useEffect(() => {
    if (index >= questions.length && !completedRef.current) {
      completedRef.current = true;
      onComplete(deckId);
    }
  }, [index, questions.length, score, deckId, title, onComplete]);

  if (index >= questions.length) {
    const text = `私はなんでも問題集の ${title} にて ${questions.length}問中 ${score} 問正解しました\n#tanahiro2010 #なんでも問題集 #${title}\n`;
    return (
      <section className="border border-black p-4">
        <h1 className="text-xl">結果</h1>
        <p className="mt-2">
          {score} / {questions.length} 問正解
        </p>

        <div className="mt-5 flex space-x-5">
          <label className="border border-black p-2">
            <a
              href={`https://twitter.com/intent/tweet?url=https://word.tanahiro2010.com/decks/${deckId}&text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512">
                <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
              </svg>
              <span>に投稿する</span>
            </a>
          </label>
        </div>

        {score > questions.length / 2 && (
          <div className="mt-5 flex justify-center">
            <iframe width="956" height="538" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
          </div>
        )}
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
