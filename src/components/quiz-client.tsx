"use client";

import { useRef, useState, useEffect, useCallback } from "react";

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

type Challenge = {
  token: string;
  prefix: string;
}

export function QuizClient({ questions, deckId, title }: QuizClient) {
  const cardRef = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string>("");
  const [judged, setJudged] = useState(false);
  const [score, setScore] = useState(0);
  const challengeRef = useRef<Challenge | null>(null);
  const solvedNonceRef = useRef<string | null>(null);
  const solvePromiseRef = useRef<Promise<string> | null>(null);
  const solveResolveRef = useRef<((nonce: string) => void) | null>(null);
  const verifyRequestedRef = useRef(false);
  const completedRef = useRef(false);

  const getChallenge = useCallback(async (deckId: string): Promise<Challenge> => {
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
  }, [deckId]);

  const startPow = useCallback(async (challenge: Challenge) => {
    try {
      solvedNonceRef.current = null;
      solvePromiseRef.current = new Promise<string>((resolve) => {
        solveResolveRef.current = resolve;
      });

      // worker script: uses Web Crypto API to compute SHA-256 and post when found
      const workerCode = `
        self.onmessage = async (e) => {
          const { start, token, prefix } = e.data;
          const enc = new TextEncoder();
          let nonce = start;
          while (true) {
            const msg = token + '.' + nonce;
            const digest = await crypto.subtle.digest('SHA-256', enc.encode(msg));
            const arr = Array.from(new Uint8Array(digest));
            const hex = arr.map(b => b.toString(16).padStart(2, '0')).join('');
            console.log("generated hash:", hex, "prefix:", prefix);
            if (hex.startsWith(prefix)) {
              self.postMessage({ signal: 'finish', from: start % 2 === 0 ? 'even' : 'odd', nonce });
              return;
            }
            nonce += 2;
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const wEven = new Worker(url);
      const wOdd = new Worker(url);

      const cleanup = () => {
        try { wEven.terminate(); } catch {}
        try { wOdd.terminate(); } catch {}
        try { URL.revokeObjectURL(url); } catch {}
      };

      await new Promise<void>((resolve) => {
        const handler = async (e: MessageEvent) => {
          const { signal, nonce } = e.data ?? {};
          if (signal === 'finish') {
            solvedNonceRef.current = String(nonce);
            solveResolveRef.current?.(String(nonce));
            cleanup();
            void maybeSendChallengeResult();
            resolve();
          }
        };

        wEven.onmessage = handler;
        wOdd.onmessage = handler;

        wEven.postMessage({ start: 0, token: challenge.token, prefix: challenge.prefix });
        wOdd.postMessage({ start: 1, token: challenge.token, prefix: challenge.prefix });
      });

    } catch (e) {
      console.error(e);
    }
  }, []);

  const maybeSendChallengeResult = useCallback(async () => {
    if (!verifyRequestedRef.current) {
      return;
    }

    const challenge = challengeRef.current;
    const nonce = solvedNonceRef.current;
    if (!challenge || !nonce) {
      return;
    }

    verifyRequestedRef.current = false;

    try {
      await fetch('/api/challenges/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: challenge.token, nonce })
      });
    } catch (err) {
      console.error('verify error', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const challenge = await getChallenge(deckId);
        if (cancelled) {
          return;
        }
        challengeRef.current = challenge;
        void startPow(challenge);
        void maybeSendChallengeResult();
      } catch (error) {
        console.error(error);
      }
    };

    void init();

    return () => {
      cancelled = true;
      solveResolveRef.current = null;
      solvePromiseRef.current = null;
    };
  }, [deckId, getChallenge, maybeSendChallengeResult, startPow]);

  useEffect(() => {
    if (index >= questions.length && !completedRef.current) {
      completedRef.current = true;
      verifyRequestedRef.current = true;
      void maybeSendChallengeResult();
    }
  }, [index, questions.length, score, deckId, title, maybeSendChallengeResult]);

  if (index >= questions.length) {
    const text = `私はなんでも問題集の ${title} にて ${questions.length}問中 ${score} 問正解しました\n#なんでも問題集 #${title}\n`;
    return (
      <section className="border border-black p-4">
        <h1 className="text-xl">結果</h1>
        <p className="mt-2">
          {score} / {questions.length} 問正解
        </p>

        <div className="mt-5 flex space-x-5">
          <label className="border border-black p-2">
            <a
              href={`https://twitter.com/intent/tweet?url=https://nandemo.tanahiro2010.com/decks/${deckId}&text=${encodeURIComponent(text)}`}
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
