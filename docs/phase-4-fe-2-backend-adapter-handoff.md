# Phase 4-FE-2：Backend案件取得adapter・モック契約テスト

## 基準と境界

作業開始時（2026-11-14 JST）にGitHubで最新HEADと未mergeを確認した。

- Frontend PR #19：`e9be28d31cab28672a4c0bcea054397fff53f341`
- Backend PR #20（draft）：`43880abafbb9403339ab418f2cc78a8a9600817e`
- 専用ブランチ：`feat/phase-4-fe-2-backend-adapter`。PR #19 HEADから独立worktreeで作成。
- #20の型定義・取得wrapper・SQLを読み取って照合した。#20のコミット、取得実装、migrationは取り込んでいない。

契約正本は#20の`project-recruitment-contract.ts`と`get-worker-recruitment-projects.ts`。
所属シフト型は`get-worker-recruitment.ts`の`RecruitmentShift`を参照し、Task A SQLの
`jsonb_strip_nulls`による欠落（nested eligibilityも含む）を確認した。
Backend parserの部分検証を通った値も信頼せず、Frontend adapterでZod検証する。

## 作業中の外部merge（最終再確認）

作業開始後に、GitHub上で#19・#20が第三者によりmergeされた。
#19 merge commitは`2d8bfd91cec24297d1505de78215be7783f93e07`、
#20の更新後HEADは`ca5961e0b833c70388924ea22ff665095ee467f2`、
#20 merge後のmainは`3aec0ba3229f09e0fc81f22e057e7a8b57e57aad`。
更新はBackendブランチへのmain取り込みであり、Task Aの4ファイルは開始時SHAから差分なし。
`RecruitmentShift`の参照型も開始時契約のまま。取得契約の変更は検出していない。

この作業ではmerge/rebaseせず、基点は#19の指定HEADに保持する。
#19 HEADがmainのancestorであることを確認済み。依存PRのmergeが完了したため、
後続PRの宛先をmainにし、今回の8ファイルだけを差分として提示する。mainへのmergeは実行しない。

## 実装した変換

`backend-project-recruitment-dto.ts`は上記SHAのwire shapeのローカル検証境界。
`backend-project-recruitment-adapter.ts`は副作用を持たず、Task Aと同じ2つの関数signatureを注入する。
Task A wrapper内部でthrowされる`RecruitmentContractError`も契約違反として区別するため、
型判定関数`isContractError`を注入する（将来のserver bindingで`instanceof`を使用する）。
例外のmessage/prefixでは分類しない。本番用の入口は`backend-project-recruitment-reader.ts`（`server-only`）。
現在の呼出元はモックテストのみで、実Backend、route、Server Actionへの接続はない。

- `projectId`をUUID正規化して識別する。同じ`projectName`を統合しない。
- `projectName`をprojectへ、`shiftCount`を`publishedShiftCount`へ、
  `appliedCount`を`appliedShiftCount`へ変換する。後者はBackend定義のapplied/accepted件数。
- `firstStartsAt` / `lastEndsAt`を保持し、JSTの開始日〜終了日を表示用に変換する。
  日付候補の生成や日付絞り込みには使わない。
- `hourlyWageMin` / `hourlyWageMax`を別々に保持する。カードは範囲・同額・0円・片側不明を表現する。
  範囲を既存の単一`hourlyWage`へ丸めない。
- 欠落可能なsummaryの時給・最寄り期限は`null`へ変換する。必須フィールドの欠落は拒否する。
  SQLで省略されるshiftの時給・応募状態等はUIの`null`へ変換する。
- 詳細はheaderの`projectId`と各shiftの所属を照合する。会場は各shiftの`workplaceName`を使う。
  案件単位の会場集約は行わず、カードの`venueText`は`null`。
- `applicationAvailability` / `hasActiveApplication` / `safeReasonText`は`null`を維持する。
  `state`・応募状態・残枠・eligibilityから応募許可や理由文を導出しない。
  未契約の追加キーを受け取っても応募許可に使わない。
- `applyAllowedShiftCount`は`null`。未取得の所属シフトを使った総数・応募可能数の推測はない。

既存reader/view modelの追加フィールドはoptionalで、合成Demoの出力と振る舞いを保つ。
新adapterのpagination metadataは旧synthetic readerのenvelopeと分離している。
将来UIへ渡す際は一覧の`source/items/dates`とpaging state、詳細の`detail`とpaging stateを分ける。
サーバー関数をClient Componentのpropsへ渡さない。

## ページングと取得結果

- Task Aはzero-based pageを受け、一覧は12件（offset=`page * 12`）、所属シフトは24件（offset=`page * 24`）。
  注入先wrapperがそのlimit/offsetで取得する。adapterもページ最大件数と継続ページの件数を検証する。
- `hasMore`をそのまま使う。一覧の`totalProjects`はBackend値を保持し、取得数から再計算しない。
  詳細に未契約の総数を追加しない。日付引数・filterは公開しない。
- 一覧の順序はSQLの`firstStartsAt, projectId`、シフトは`startsAt, shiftId`。
  日時は文字列順ではなくinstantで比較し、同時刻では正規化したUUIDで比較する。
- 結合は連続pageかつ直前の`hasMore: true`のみ。重複ID、順序逆転、ページ飛び/再適用、
  一覧総数の変化、別案件のシフトページを検出して`pagination_violation`にする。
  重複を黙って削除して継続せず、結合全体を拒否して既存データを変更しない。
  呼出側は先頭から再取得する必要がある。offset方式の同時更新に対するsnapshot保証はない。

取得結果は次のように分かれる。

- `ready`：正常。items=[]の一覧、headerあり・shifts=[]の詳細も正常結果。
- `not_found`：Backendの明示的な`project: null`かつitems=[] / hasMore=falseのみ。
- `invalid_request`：入力ID/page不正、またはBackendの完全なinvalid_request envelope。
- `error / retrieval_failed`：DB・RPC・通信等で注入関数がthrowした場合。
- `error / contract_violation`：DTO欠落・不正値・所属/ページ内順序の不整合。
- `error / pagination_violation`：ページ結合時の不整合（issueで分類）。

取得障害を空結果や取得不可に変換しない。生の例外、DB詳細、権限情報を結果へ含めない。

## BLOCKED：次の接続前に必要なこと

1. **実取得への接続**：#20は作業中に外部でmergeされたが、SQLの実DB検証は依然として未確認。Backend側で承認済みの専用隔離環境と
   fail-closed実行器を用意し、別途明示承認の下でmigration/RLS/role/Branch/取得契約を検証する。
   プロジェクト名・ポート一致やoffline guard成功だけを実行許可にしない。
   認可は既存の`profiles.account_type`とserver guard/RLSに保持する。
2. **日付フィルタ**：本体でのfilter引数・境界・ページング/集計scopeの確定待ち。
   今回は候補・クライアントfilter・全件取得による代替を実装しない。
3. **応募可能数**：Backendの確定した集計事実とscopeが必要。
   `shiftCount - appliedCount`やロード済みページから算出しない。
4. **独立した応募可否**：`applicationAvailability`および`hasActiveApplication`の取得契約・欠落時の意味の確定待ち。
   未確定の間は選択・確認を抑止する。既存単件controlsのstate解釈は変更しない。
5. **一括応募・batchKey・結果照会**：原子的な受付、idempotency、unknown回復の契約が必要。
   既存の単件Actionループで代用しない。合成Demoの模擬契約を本体へ転用しない。
6. **UI routeへの配線**：上記の必要契約と実Backend接続の別途承認後、server-only入口から取得し、
   一覧/所属シフトの`hasMore`・loading/失敗・再取得をUIへ配線する。
   現在の募集route、単件取得/応募/取下げ、Demo gateは保全する。

`docs/migration-manifest.md`の実行制限、旧dispatch-os DB、Manager、DEMO-001の保護を維持する。
秘密ファイルを読まず、実DB・実Auth・LINE・AWS・migration適用・main merge・deployは行っていない。

## 検証

- モック契約53件と既存募集回帰82件、合計**135/135 PASS**。
  fail / cancelled / skipped / todoはいずれも0。node:testのnested subtestを含む件数。
  新規はDTO変換/欠落/不正値、同名別ID、時給範囲、12/24件ページング、結合異常、
  0件と取得不可/invalid_request/障害/契約違反の区別、全stateの応募抑止を検証した。
  既存は選択/RC DTO、単件応募・取下げcontrols、シフトUI/Next error retry、
  合成reader、案件UI、遅延応答の破棄、Demo遷移/履歴/unknown結果保持を実行した。
- 実行は`node --import tsx --test --test-reporter=tap`へ次の8ファイルを明示指定：
  `backend-project-recruitment-adapter.test.ts`、`recruitment-selection.test.ts`、
  `pr-a-controls.test.mjs`、`shift-views.test.mjs`、`project-views.test.ts`、
  `project-recruitment-reader.test.ts`、`project-read-lifecycle.test.mjs`、`project-demo-flow.test.mjs`
  （すべて`scripts/worker-recruitment/`配下）。
- `npm run typecheck:web` **PASS**。Web設定から除外される新規契約テストも、
  ローカル一時tsconfigを用いた`tsc --noEmit`で別途型チェック **PASS**。
- `npm run lint`と新規テストのESLint **PASS**。
- 標準`npm run build` **PASS**（Next.js 16.4.2 / Turbopack / Node 24.14.0）。
  実環境ファイルを持たないworktree、架空のbuild用公開設定、telemetry無効で実行した。
  初回は依存へのworktree外JunctionをTurbopackが拒否。元依存をworktree内へコピーし、
  Next設定/標準build command/lockfileを変更せず解消した。
- 通常sandboxでの初回test起動はWindows userInfo APIが拒否され、テスト本体に到達しなかった。
  同じオフラインcommandを実行可能な権限で再実行し、上記PASSを確認した。
- 対象8ファイルの`git diff --cached --check` **PASS**。

新規契約テストはTask Aのwire-shapedモックだけを使う。
実取得テスト・integration/RLSテストは実行していない。ブラウザーの新規操作確認も対象外。
既存worktree、未追跡Demo、DB/Auth/外部サービスの設定や実データは変更していない。
