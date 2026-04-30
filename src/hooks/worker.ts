import { useEffect, useRef, useState } from "react";

type WorkerFunction<T, U> = (input: T) => U;

// useWorkerは、WebWorkerを使用して非同期処理を行うカスタムフック
export function useWorker<T, U>(workerFunc: WorkerFunction<T, U>, input: T) {
    // 結果を保持するためのstate
    const [result, setResult] = useState<U | null>(null);
    // Workerインスタンスを保持するためのref
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // WebWorker用のスクリプトをBlobとして作成
        const blob = new Blob(
            [
                `
          self.onmessage = async (e) => {
            const func = ${workerFunc.toString()};
            const result = func(e.data);
            self.postMessage(result);
          };
        `,
            ],
            { type: "application/javascript" }
        );

        // BlobからWorkerを作成
        const worker = new Worker(URL.createObjectURL(blob));
        workerRef.current = worker;

        // Workerからのメッセージを受け取ったときに結果をstateにセット
        worker.onmessage = (e) => {
            setResult(e.data);
        };

        // Workerに入力データを送信
        worker.postMessage(input);

        // コンポーネントのアンマウント時にWorkerを終了
        return () => {
            worker.terminate();
        };
    }, [workerFunc, input]);

    // 計算結果を返す
    return result;
}