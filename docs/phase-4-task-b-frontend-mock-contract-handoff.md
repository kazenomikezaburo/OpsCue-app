# Phase 4 Task B — Frontendモック契約テスト

## 基準・原本・作業範囲

2026-11-19 JST。専用ブランチ `feat/phase-4-task-b-frontend-mock-contract`。
独立worktree：`C:\Users\katou\team dev\OpsCue-app-phase-4-task-b-mock-contract`。
GitHubから取得して確認したmainの基点は `326f0abbfc910d3d6242f649c2bc031d218a021d`。

読み取ったBackend原本：
`C:\Users\katou\Downloads\Phase4_TaskB_一括応募_契約設計 (2) (1).md`。
SHA-256：`78fc92a810c7f1f97eb3e715d33bfd235bf4a919f4cca466742557949040923e`。
第2・3・5・6・11章を照合し、旧第4章と矛盾する処理順は第11章を優先した。
原本は設計案と記載するが、receipt-firstの方針採用とB-01〜B-15の番号・受入条件は
ユーザーが共有したPM補足回答（2026-11-19）を優先する。

列挙された `02_TaskB_receipt-first改訂_提示資料.md` と
`Frontend宛て_TaskB追加確認への回答.txt` の実ファイルは今回のアクセス範囲では取得できていない。
それらを読んだとは主張しない。ユーザーが本文として提供したRPCシグネチャ、成功・拒否・receipt形状、
理由コード、Bケース表、および未確定wireをBLOCKEDとする指示に基づいて実装する。

RPC名は `apply_to_own_project_shifts(p_project_id, p_shift_ids, p_idempotency_key)` と
`get_own_application_batch_receipt(p_idempotency_key)`。今回これらの関数を実装・呼出ししない。
既存単件Actionのループによる代替もしない。

## Backend設計と既存Frontend UI案の差分表

| 項目 | 第11章・PM補足の契約 | 既存Frontend | 今回の対応・制限 |
| --- | --- | --- | --- |
| 要求・同一性 | 同一案件1〜10件、UUID正規化、shiftIds昇順の集合比較 | RC要求はcontractVersion付き。選択の混在・件数・重複検証あり | 独立mock要求DTOを追加。既存選択検証を回帰。実所属をIDだけから推測しない |
| 既応募applied | 成功、newApplicationCountとalreadyAppliedCountを分離 | Demo preflightはhasActiveApplication=trueを拒否 | 新mockでは受付結果の件数を検証。既存Demoのpreflight・単件応募は変更しない |
| 成功 | new+already=要求数、appliedShiftIds=要求集合、昇順、replayed:boolean | 既存successはmeaningだけ | 件数・重複・集合・順序・型を検証。不正応答はunknown |
| 全体拒否 | new=0、拒否シフトのみ、1シフト1理由、ID昇順、最大10件 | 既存rejectedはnew=0とsafeReasonTextだけ | 8理由コード・要求への所属・一意性・昇順を検証。通過シフトを成功表示しない |
| receipt-first | 既存receiptを現在の案件可視状態より先に再生 | receipt用adapterなし | メモリfixtureはclosed後の保存済み成功の再生のみ定義。closed後の新規キーは未定義として停止。Backend順序の実証ではない |
| completed | 照会したキーの文脈でprojectIdと正規化したshiftIds集合を照合 | receiptEvidence=confirmedは表示用情報だけ | 新mockでは照合後の結果だけ確定表示。receiptに未定義のbatchKeyフィールドを追加しない |
| not_found | 未コミットの初回があり得る。未実行の証明ではない | batch結果型に表現なし | unknownとして要求保持。自動再送・新規キー作成なし。明示retryは同じ要求 |
| IDEMPOTENCY_CONFLICT | 自動破棄・自動再送しない。照会・確認が必要 | batch結果型に表現なし | 形式不備でも競合表示を検出したら再送抑止。invalid_conflict_responseで契約違反を区別し、照会は継続可能。内容一致のcompletedのみ確定 |
| unavailable | 確定した未受理の扱いはreceipt-first正式実装後 | batch結果型に表現なし | 直接応答もcompleted.resultも確定表示しない。正式実装・wireの確定はBLOCKED |
| 例外・22023 | 例外の正確な伝達・実行事実の証拠が必要 | 正式batch境界なし | ローカル不正入力は送信前に拒否。送信後の例外はコードやmessageだけで未実行とせず要求保持 |
| close/reopen | 未確定キー・要求を保持 | Demoはコンポーネント内に保持 | mock sessionをview所有期間と分離。公開値は内部と参照を共有しないdeep readonly snapshot。reload後永続復旧は未実装 |

新モジュールは**既知フィールドのモック検証境界**であり、正式wire schema全体の凍結ではない。
応答の未知の追加キーは検証・表示に使わず、Zodの出力から除外する。
初回batch_rejectedのreplayed必須性は原本例から確定できないためoptionalとし、欠落時の値を補完しない。
再生を表すモック応答ではreplayed=trueを明示する。この必須性の正式決定はBLOCKED。

## B-01〜B-15：期待入出力と確認範囲

すべて合成UUIDと注入したメモリ関数で実行し、テストは実装本体のvalidator/session/viewを使用する。
Backend全体の代替実装や、実サービスの安全性の証明ではない。

| ID | モック入力・観測 | 期待するFrontend結果 |
| --- | --- | --- |
| B-01 | 2シフト、applied/new=2/already=0/要求全ID | success、新規2・既応募0を表示。採用・配置とは区別 |
| B-02 | 2シフト、applied/new=1/already=1 | success。既応募だけを理由に全体拒否しない |
| B-03 | 2シフトのうち1件だけcapacity_full | batch_rejected、新規0。理由のないシフトも成功扱いしない |
| B-04 | 3シフトのうち2件のみ拒否 | 拒否2件のIDと理由だけを昇順で表示 |
| B-05 | mock commit後に応答消失、明示的同一キー再送 | 最初の保存結果をreplayed=trueで採用。保持要求は同一 |
| B-06 | 同一キー・異なるシフト集合 | conflict。別キーへの置換・retryなし。元receiptの内容不一致も確定禁止 |
| B-07 | 通信断 | unknown、batchKey/projectId/shiftIdsを不変で保持。自動再送なし |
| B-08 | unknown後のreceipt not_found | 未実行と断定せず保持。初回・再送applyのbatchKey/projectId/shiftIds全体を記録・深比較 |
| B-09 | completed、UUIDの大小文字・順序だけ異なる同じ集合 | projectIdと正規化ID集合が一致すれば保存結果を採用 |
| B-10 | completedの案件・集合不一致、重複・欠落・壊れた結果 | unknown、確定表示禁止、元要求保持 |
| B-11 | 保存済みapplied後にmock案件closed、同キー再送 | 保存済み成功をreplayed=trueで再生する保証のみ。closed後新規キーのwireは未定義 |
| B-12 | 0件・11件・大小文字違いの重複・既知の別案件選択 | ローカル入力拒否。実際の所属不一致はmock unavailableとして未確定を保持 |
| B-13 | 同一viewで二重送信、別sessionから同キー同時送信 | view内は1回に抑止。2sessionはmockの1回分の確定＋再生応答を消費。DB lockの証明なし |
| B-14 | 40P01/40001/55P03/57014/5xx等の失敗 | unknown・同じ要求保持。自動再送なし。明示retryも同一キー |
| B-15 | unknown結果画面を閉じて再表示 | 未確定キーと要求内容を保持。表示寿命だけで新規操作を許可しない |

追加ケース：成功の件数不一致/小数/負数/ID不一致/重複/逆順/部分成功、
拒否の新規1件/空理由/他ID/未知コード/重複理由/逆順/11理由、全8理由文言化、
成功1件/10件/全件既応募、拒否の再生・completed、競合後のnot_found/通信断、
通信中close、確定後の明示的な別キー操作を検証する。

## 状態遷移と復旧条件

- startはローカル検証成功時だけpendingへ。通信中のstart/retry/照会を追加送信しない。
- 正しいappliedはsuccess、正しいbatch_rejectedはrejected。件数・要求集合・理由条件を検証してから採用する。
- 競合表示を伴わない通信断・不正応答・不一致receipt・not_foundはunknown。既存のconflict latchは解除せず、元要求を保つ。
- IDEMPOTENCY_CONFLICT表示は形式不備でもconflictとして保持。形式不備はinvalid_conflict_response（契約違反）とし、以後の照会失敗やnot_foundでもretryを解除しない。
- conflictからは、元要求と整合するcompletedを検証できた場合にのみこのmockの確定表示へ進む。
  他内容の初回receiptを手動で採用・破棄するUXは未契約のため追加しない。
- retry/recheckは明示的呼出しのみ。スケジューラ、バックオフ、自動キー生成、localStorage、TTLは追加しない。
- close/reopenはvisibleだけを変更し、pending/unknown/conflictの要求を破棄しない。
- start/getState/retry/recheck/close/reopenの公開値は内部状態のdeep cloneをfreezeしたsnapshot。
  要求・結果・配列・拒否理由要素の内部参照は公開しない。保持の検証は参照一致ではなく内容一致で行う。
- terminal結果は表示用に保持するが、明示的な次の操作は別キーで開始できる。
  同session内の使用済みキーを新しい論理操作へ再利用しない。

## 変更ファイル・配線

1. `lib/worker/recruitment/recruitment-batch-mock-contract.ts`：モック要求・既知応答のZod検証とreceiptの要求照合。
2. `lib/worker/recruitment/recruitment-batch-mock-session.ts`：メモリ内状態・二重送信抑止・要求保持・表示モデル。
3. `components/worker/recruitment/recruitment-batch-mock-result.tsx`：新しいモック専用結果表示。既存結果componentを置き換えない。
4. `scripts/worker-recruitment/recruitment-batch-mock-contract.test.ts`：B-01〜B-15および不正応答・復旧の追加ケース。
5. この引継ぎ文書。

新規mock component/sessionはテストからのみ使用し、募集route、Server Action、Backend reader、RPCへ配線しない。
既存の `project-recruitment-schema.ts`、`project-recruitment-types.ts`、`recruitment-selection.ts`、
`recruitment-batch-result.tsx`、単件controls、合成fixture/Demoは無改変。

## 実際の検証

- レビュー修正後の最終実行：モック80件＋既存回帰135件、合計**215/215 PASS**。
  fail/cancelled/skipped/todoはすべて0。nested subtestを含む。
  B-01〜B-15の15親テストを維持。P0再現・不正receipt・snapshot改変・fixture境界もPASS。
- 実行commandは `node --import tsx --test --test-reporter=tap` への9ファイル明示指定。
  新規 recruitment-batch-mock-contract.test.ts と既存の
  backend-project-recruitment-adapter.test.ts / recruitment-selection.test.ts / pr-a-controls.test.mjs /
  shift-views.test.mjs / project-views.test.ts / project-recruitment-reader.test.ts /
  project-read-lifecycle.test.mjs / project-demo-flow.test.mjs（すべてscripts/worker-recruitment配下）。
- 最終Web型チェック、新規テストの個別型チェック、追加4ソース/テストのESLintはすべてPASS。
- 追加5ファイルの差分検査を対象パスに限定して実施し、空白エラーなし。
- 初回のWeb型チェックは、新規worktreeにNextのルート型がなくPageProps/LayoutPropsで失敗。
  telemetryを無効にしたnext typegen後、Web型チェックPASS。
- Web型対象から除外される新規テストも、TypeScript APIのcreateProgram/getPreEmitDiagnosticsで別途PASS。
- 追加4ソース/テストへのESLint PASS（自動修正なし）。
- tsxのWindows userInfo APIは通常sandboxで拒否されたため、同じオフラインテストを
  実行可能な権限で実行した。依存インストールなし、lockfile変更なし。
- 同一lockfileの既存FE-2 worktreeのnode_modulesを新規worktreeから参照。
  next typegen以外のdev/server/buildは起動していない。実ブラウザ検証は未実施。

## レビュー指摘4件の修正と再現結果（2026-11-19）

今回修正したのは既存の未コミット5ファイルのうちcontract/session/test/この文書の4ファイル。
mock結果UIは今回無改変。commit、stage、push、PR作成、main merge、deployは実施しない。
修正完了はcommit/PRの許可ではなく、読み取り専用の再レビュー待ち。

### 修正1：公開状態からの内部変更（P0）

- 修正箇所：`lib/worker/recruitment/recruitment-batch-mock-session.ts:9`（内部型と公開型）、
  `:31`（clone/freeze）、`:78`（公開メソッド）。全returnはsnapshotへ統一。
- 再現テスト：`scripts/worker-recruitment/recruitment-batch-mock-contract.test.ts:429`。
  start/getState/retry/recheck/close/reopenの各公開値にReflect.setでrequest=null、status=successを試み、
  通信断後の別キーstartが送信を追加しないことを確認。
- 修正前：start/getStateなどの戻り値改変で実要求が失われ、送信回数1→2（明示retry後は2→3）を実測。
  6サブケースすべて失敗。修正後：同じ6サブケースPASS。保持要求は元の内容のまま。
- 追加テスト：`:482` は要求・success/rejected結果・配列・拒否理由要素の深い分離とfreeze、
  `:513` はpending/blocked-startのsnapshot保護を確認。
- 残存リスク：snapshotはメモリ上の値。reload/離脱後の復旧や保存期間を保証しない。

### 修正2：不正形式の競合応答（P0）

- 修正箇所：`lib/worker/recruitment/recruitment-batch-mock-contract.ts:43`（競合表示の検出）、
  `:82`（直接応答）、`:92`（receipt応答）、
  `lib/worker/recruitment/recruitment-batch-mock-session.ts:50`（再送抑止の保持）。
- 再現テスト：`scripts/worker-recruitment/recruitment-batch-mock-contract.test.ts:449`。
  正常応答とreplayed欠落/値不正/型不正/ok不正/ok欠落の6サブケース。
- 修正前：正常応答だけは抑止。5種の不正形式はunknownとなり、手動retryで送信回数1→2を実測。
  修正後：正常はidempotency_conflict、不正形式はinvalid_conflict_response（契約違反）として区別し、
  どちらもconflict状態で同一要求を保持。自動/手動retry・別キーstartは送信を増やさない。
- 結果照会は可能で、not_foundや照会失敗は抑止を解除しない。適合するcompletedのみ確定表示へ進める。
- `:532` ではreceipt直下・completed.result内・request欠落/不一致の競合表示も確認。
- 残存リスク：この保守的な抑止は不正wireを正式結果として受理するものではない。
  正式wire、元要求と異なる保存receiptの手動解決UXはBLOCKED。

### 修正3：B-08の再送引数（P1）

- 修正箇所・テスト：`scripts/worker-recruitment/recruitment-batch-mock-contract.test.ts:171`。
- 修正前：apply回数と照会キーだけを検証し、再送要求全体の記録・照合がなかった。
  この項目は検証不足の修正であり、別の実動作不具合を再現したとは主張しない。
- 修正後：初回と再送apply引数をstructuredCloneで記録。
  not_found直後は送信履歴が[元要求]のまま、明示retry後は[元要求,元要求]と深比較。
  batchKey/projectId/shiftIdsがすべて一致することを確認しPASS。
- 残存リスク：本人・実所属・実Backend側の冪等性の証明ではない。

### 修正4：closed fixtureの保証範囲（P2）

- 修正箇所：`scripts/worker-recruitment/recruitment-batch-mock-contract.test.ts:65`、B-11 `:220`、
  制限のテスト `:556`、この文書の差分表・B-11・本節。
- 修正前（ソースで確認）：closed後の新規キーにunavailableを返し、receiptへ記録しないfixtureだった。
  これは第11章の対象検証失敗receiptを再現しておらず、正式wireとして誤読できる状態だった。
- 修正後：保存済み成功はclosed後も先に検索・再生する。
  closed後の新規キーはMOCK_CLOSED_NEW_KEY_UNSPECIFIEDでfixtureの未定義シナリオとして停止し、
  unavailable等のBackend戻り値を定義しない。制限テストとB-11はPASS。
- この例外はfixtureの使用制限であり、Backendの例外コード・wire・ロールバック・receipt不在の保証ではない。
  fixtureはclosed後新規キーのreceipt作成/失敗結果、認可、U-2、実DBロックをモデル化していない。
- 残存リスク：正式receipt-first実装とwire・同時実行対策の確定/実DB検証はBLOCKED。

### 実測の修正前後

- P0の同じ2親＋12サブケース（node:test計14件）：修正前pass=1/fail=13、修正後pass=14/fail=0。
  失敗数は親テストを含む。正常競合1サブケースは修正前からPASS。
- 最終9ファイル：215/215 PASS、fail/cancelled/skipped/todoは0。
- Web型チェック、新規テスト個別型チェック、ESLint PASS。対象5ファイルの差分検査で空白エラーなし。
- 既存schema・単件controls・Demo/fixture・AGENTS・package/lockfile・mock結果UIは、
  元worktreeと専用worktreeの対象23ファイルで作業前後SHA-256を照合し、差異0。
- 実Backend/DB/migration/Auth/LINE/AWS、実ブラウザ、build/dev/server、依存インストールは使用していない。
## 残存BLOCKED

- 正式RPC実装と実応募の有効化、正式wire全体（初回拒否のreplayed必須性、
  unavailableの確定形、例外/22023の伝達・破棄条件、認可失効時のreceipt応答など）。
- U-2：receipt保持・匿名化・削除・再生可能期間。時刻からキー破棄を推論しない。
- 同時実行対策の最終決定と実DB検証。B-13/B-14はDBの原子性・ロック・二重応募防止の実証ではない。
- reload/離脱/別端末にまたがる未確定結果の永続化・復旧期間。
- conflictで元要求と異なる保存receiptが得られた際の手動解決UX。
- 未取得の追加提示資料2原本と、最終承認版wire schemaとの将来再照合。

元worktreeの未追跡Demo2件と既存の合成Demo環境を保全。
DB・migration・Auth・LINE・AWS・実応募/RPC接続・main merge・push・deployは実施していない。
