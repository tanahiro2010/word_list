# 技術ドキュメント

## 概要 — このリポジトリの目的

「なんでも問題集」はユーザーが単語帳（Deck）を作成・公開し、Web上でクイズとして解けるサービスです。本ドキュメントは実装済みの全機能について「どこで（ファイル/エンドポイント）」「どうやって（実装/技術）」および「何を目的に（目的/設計意図）」を網羅的に記載します。


---

## 主要データモデル（Prisma schema）

- どこで: [prisma/schema.prisma](prisma/schema.prisma)
- どうやって: Prisma を使った PostgreSQL モデル定義
- 目的:
  - `Deck`: 単語帳（id, title, isPublished, solvedCount など）
  - `Question`: 各問題（deckId 外部キー）
  - `Choice`: 問題の選択肢（isCorrect フラグ）
  - `Challenge`: PoW 用の一時チャレンジ（value: token, prefix, expiresAt）


---

## フロントエンド（UI コンポーネント）

- App ヘッダー
  - どこで: [src/components/app-header.tsx](src/components/app-header.tsx)
  - どうやって: React (Next.js app router) のクライアントコンポーネント。Tailwind風ユーティリティクラスを用いたレスポンシブ実装。モバイルではハンバーガーで検索フォームと作成ボタンを展開。
  - 目的: サイトのナビゲーション、検索フォーム、`CreateDeckModal` への導線を提供。

- 単語帳作成モーダル
  - どこで: [src/components/create-deck-modal.tsx](src/components/create-deck-modal.tsx)
  - どうやって: クライアントサイドフォームで `/api/decks` に POST。送信後、編集ページ (`/decks/:id/edit`) に遷移。
  - 目的: 新しい `Deck` を作成するための UX。

- 単語帳編集（問題編集）
  - どこで: [src/components/deck-editor.tsx](src/components/deck-editor.tsx)
  - どうやって: クライアントで複数の `Question` と `Choice` を作成・編集し、`/api/decks/:deckId/publish` に JSON を送信して公開。公開処理はサーバ側でバリデーション・トランザクション済み。
  - 目的: 単語帳の問題データを作成・公開する。公開時に DB をトランザクションで更新し一貫性を担保。

- クイズプレイヤー（解答画面）
  - どこで: [src/components/quiz-client.tsx](src/components/quiz-client.tsx)
  - どうやって: サーバから取得した `questions` をクライアントで順に表示。選択→判定→次へ、最終結果画面で Twitter 共有と条件付き YouTube 埋め込みを表示。クイズ完了時に PoW チャレンジを取得して並列 Worker（Web Crypto）でノンス探索し、成功したら `/api/challenges/verify` に送信。
  - 目的: ユーザーが問題を解く UI。終了時に PoW を通して「解かれた」記録をサーバに正当な手段で伝達する仕組み。


---

## サーバ API（Next.js App Route）

- 単語帳作成 API
  - どこで: [src/app/api/decks/route.ts](src/app/api/decks/route.ts)
  - どうやって: POST で受け取り `prisma.deck.create` を実行。リクエストサイズ制限・レート制限・禁止フラグメント検査を [src/lib/abuse-protection.ts](src/lib/abuse-protection.ts) で行う。
  - 目的: 新しい `Deck` を生成し、編集画面へリダイレクトするための ID を返す。

- 単語帳公開 API
  - どこで: [src/app/api/decks/[deckId]/publish/route.ts](src/app/api/decks/[deckId]/publish/route.ts)
  - どうやって: 投稿された問題データを受け、内容検査（禁止語句）・サイズとレートの保護を行い、DB 内の既存 Questions/Choices を削除して新規作成、最後に `deck.isPublished=true` を更新。すべてトランザクション内で実行。
  - 目的: 公開済みページへ反映するための信頼できる一括更新を行う。

- PoW チャレンジ生成 API
  - どこで: [src/app/api/challenges/route.ts](src/app/api/challenges/route.ts)
  - どうやって: `deckId` を受け取って `Challenge` レコードを作成。`prefix` は sha256 の16進表現と一致する文字のみ（hex）でランダム生成（デフォルト 5 文字）。`expiresAt` を設定して有効期限を付与。
  - 目的: クライアント側で PoW（前方一致）を行うためのトークンと比較プレフィックスを発行する。

- PoW 検証 API
  - どこで: [src/app/api/challenges/verify/route.ts](src/app/api/challenges/verify/route.ts)
  - どうやって: `token` と `nonce` を受け、DB で `Challenge` を確認（存在・未期限切れ）。サーバ側で `sha256(token.nonce)` を計算し `prefix` と前方一致するか検査。成功すれば `deck.solvedCount` をトランザクションでインクリメントし、`Challenge` を削除。
    - SHA-256 はサーバ側で `src/lib/crypto.ts` の `sha256` を使用（実装は Web Crypto を優先、フォールバックで純粋JS 実装）。
  - 目的: クライアント側から届いた nonce が正当に計算された（トークンと prefix に対して）ことを検証し、二重送信や期限切れを防ぎつつ solvedCount を正しく更新する。


---

## ハッシュ／暗号ユーティリティ

- どこで: [src/lib/crypto.ts](src/lib/crypto.ts)
- どうやって:
  - 複数のハッシュ関数を実装（`djb2`, `fnv1a32`, `crc32`, `murmurHash3_32`）。用途は主に汎用ユーティリティ。
  - `sha256(message)` は非同期関数で、まず `globalThis.crypto.subtle.digest`（Web Crypto）を使い、存在しない環境では純粋JS実装（`sha256Pure`）にフォールバック。
  - 目的: サーバ/クライアントで一貫した SHA-256 を使えるようにし、クライアントは Web Crypto、サーバは可能なら Web Crypto を利用することでバイナリ整合性を確保。Node の `crypto` モジュールは使わない設計（環境依存で危険なため）。


---

## 悪用防止（Rate limiting / Content filtering）

- どこで: [src/lib/abuse-protection.ts](src/lib/abuse-protection.ts)
- どうやって: IP 単位で簡易バケットレート制限、リクエストサイズ制限、禁止フラグメント検査、429 応答ユーティリティを提供。各 API（作成・公開）で組み合わせて利用。
- 目的: スパムや大量リクエストからサービスを保護する。


---

## 生成画像 / SEO

- OG 画像生成
  - どこで: [src/app/og/[deckId]/route.tsx](src/app/og/[deckId]/route.tsx)
  - どうやって: Next.js の `ImageResponse` を使いランタイムでカード画像を生成（deck タイトルを埋め込む）。
  - 目的: SNS や Twitter で共有された際のリッチカード表示を提供。

- サイトマップ
  - どこで: [src/app/sitemap.ts](src/app/sitemap.ts)
  - どうやって: 公開済み Deck を DB から列挙して sitemap を生成。
  - 目的: 検索エンジン向けに公開ページを通知。


---

## Worker ヘルパー（過去/補助実装）

- どこで: [src/hooks/worker.ts](src/hooks/worker.ts)
- どうやって: 任意の関数を Blob 化して Web Worker で実行するカスタムフックを提供。ただし PoW の実装ではブラウザ側の `crypto.subtle` を利用する直接生成 Worker に差し替えている。
- 目的: 重い計算をメインスレッドから切り離すためのユーティリティ。


---

## エンドツーエンドの PoW フロー（何を目的にどう動くか）

1. クライアント（`QuizClient`）がクイズ終了時に `POST /api/challenges`（[src/app/api/challenges/route.ts](src/app/api/challenges/route.ts)）を呼ぶ。
   - 目的: `token`（Challenge.value）と `prefix`（hex）を受け取る。
2. クライアントは並列 Worker（2 つ、start=0/1）を生成し、`token.nonce` の SHA-256 ハッシュが `prefix` と前方一致する nonce を探索する。
   - どうやって: Worker 内でブラウザの `crypto.subtle.digest('SHA-256', ...)` を使い、高速かつ信頼できるハッシュを計算。見つかったら `POST /api/challenges/verify` に `{ token, nonce }` を送る。
   - 目的: クライアントの計算コストを担保し、不正な自動化や誤操作を抑制しつつ「解かれた」ことをサーバに通知する。
3. サーバの `/api/challenges/verify` は DB 上の `Challenge` と照合し、`sha256(token.nonce)` を再計算して `prefix` と前方一致するかチェック。成功時に `deck.solvedCount` をインクリメントし `Challenge` を削除。
   - どうやって: `sha256` はサーバ環境で Web Crypto が使えるならそれを使い `await sha256(...)`、なければ純粋JSの `sha256Pure` を使って検証。
   - 目的: クライアントの計算結果が真正であることを検証してから DB を更新することで、不正なインクリメントを防止。


---

## 運用上の注意点と改善候補（現在の設計の狙いとリスク）

- prefix の難易度: 現在 5 文字の hex（約20ビット）で固定。運用上は負荷が増えたら短縮、または長くして難易度を上げるべき。
- 二重送信対策: 現在 `Challenge` は検証成功時に削除するため同一トークンでの重複加算は防げるが、並行リクエストやレースに注意。DB トランザクションで更新/削除しているため一般的なケースは安全。
- ログと監視: PoW の失敗率・検証時間をログ化すると悪用やリグレッションの検出に役立つ。
- クライアント互換性: クライアントは Web Crypto を利用する前提。古いブラウザではフォールバックが必要になる可能性がある。


---

## 参照ファイル一覧（素早く確認したい箇所）

- サイト全体
  - [src/app/page.tsx](src/app/page.tsx)
  - [src/app/layout.tsx](src/app/layout.tsx)
  - [src/app/sitemap.ts](src/app/sitemap.ts)

- Deck / 編集 / 公開
  - [src/components/deck-editor.tsx](src/components/deck-editor.tsx)
  - [src/app/api/decks/route.ts](src/app/api/decks/route.ts)
  - [src/app/api/decks/[deckId]/publish/route.ts](src/app/api/decks/[deckId]/publish/route.ts)

- クイズ + PoW
  - [src/components/quiz-client.tsx](src/components/quiz-client.tsx)
  - [src/app/api/challenges/route.ts](src/app/api/challenges/route.ts)
  - [src/app/api/challenges/verify/route.ts](src/app/api/challenges/verify/route.ts)

- ユーティリティ
  - [src/lib/crypto.ts](src/lib/crypto.ts)
  - [src/lib/abuse-protection.ts](src/lib/abuse-protection.ts)
  - [src/lib/prisma.ts](src/lib/prisma.ts)


---

この `docs/tech.md` はコードベースの現状をベースに作成しました。追加で細かい設計方針やログの場所、運用手順（DB マイグレーションや環境変数一覧）などを追記したければ指示してください。
