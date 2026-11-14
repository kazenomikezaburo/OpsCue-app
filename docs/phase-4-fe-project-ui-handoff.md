# Phase 4-FE：案件単位UIの接続準備

対象：PR #19 / `feat/pr-ui-01-main-integration`。着手時のGitHub HEADは
`c12a0547ae3bb5e33f1dc4490f402fb527fd658e`（2026-11-14確認）。
IDE側の別ブランチと未追跡Demoは保全し、cleanな担当worktreeをfast-forwardして作業した。

## 実装済み

- 既存の`ProjectRecruitmentList`、`ProjectRecruitmentDetail`、シフト行、選択・確認・模擬結果UIを再利用。
- `lib/worker/recruitment/project-recruitment-reader.ts`をUI用read境界にした。
  readerの出力をZodで検証し、取得失敗・不正データは安全な`error`に統一する。
  不正projectIdと明示的な取得不可（`null`）だけを`not_found`にする。
  異なる案件の詳細、他案件のシフト、重複IDは受け付けない。
- UIのカード型を同じlibへ移動し、従来のimport元からも型を再exportする。
- 検索・日付候補・集計・ID検索を`__fixtures__/project-recruitment-reader.fixture.ts`へ分離。
  同名・異なるprojectIdの2案件を独立して表示し、詳細にはその案件の全所属シフトを渡す。
  不明値は`null`のまま扱う。集計は完全な合成データに限る。
- `use-project-recruitment-read.ts`で読み込み・再試行・応答の所有権を管理。
  案件・日付切替直後は古いデータを隠し、遅い旧応答とunmount後の更新を破棄する。
- Demoの表示例からloading・一覧empty・所属シフトempty・error・404表示を確認できる。
  errorには再読み込み、404には一覧へ戻る導線がある。取得不可時の選択確定は無効。
  この404はDemo内の表示状態であり、案件詳細のHTTPルートは新設していない。
- 既存の合成データ内「もっと見る」とページ表示を維持。実シフトページングは参照しない。
  別案件へ移動すると選択を解除し、unknownの模擬結果は同じbatchKeyのまま保持する。

## Backend接続：BLOCKED

以下は確定DTO・取得契約の到着待ち。現在の型・schema・reader interfaceはFrontendの
view modelであり、BackendのDTO、RPC、cursor、認可、応募受付の仕様を確定するものではない。

1. **案件ID・一覧/詳細DTOと取得口**
   新しいserver-onlyの`lib` adapterで、確定DTOをこのUIのview modelに明示的に変換する。
   名前をIDに変換しない。既存のRC schemaと合わない項目はここで再検討する。
   主な変更先：`project-recruitment-reader.ts`、`project-recruitment-schema.ts`、
   `project-recruitment-types.ts`。fixtureの集計コードはlive adapterに転用しない。
2. **案件単位のページング・並び順・日付範囲・集計の意味**
   件数や会場・時給の集約範囲、日付候補、詳細の所属シフト取得範囲をBackendと確認する。
   未取得ページのシフトから案件総数や応募可能数を推定しない。
   `ProjectRecruitmentList.loadMore`には確定した案件ページングだけを接続する。
   所属シフトにも取得制限がある場合、完全取得済みと誤認しない表示・選択契約を追加確認する。
3. **取得不可・認可・404の対応**
   Backendの安全な取得不可と障害をadapterで区別する。role/RLS判定はサーバーに置く。
   確定後に既存guardを維持したServer Componentで取得し、routeで`notFound()`を扱う。
   サーバーreader関数や秘密情報をClient Componentのpropsに渡さない。
   既存`/worker/recruitment`のシフト一覧・単件詳細は、切替承認まで維持する。
4. **応募可否の独立事実・一括応募/受付証跡**
   `applicationAvailability`、`hasActiveApplication`等の対応をBackendと確認する。
   一括応募・idempotency・受付証跡は引き続きBLOCKED。Demoの確認は実応募ではない。
   単件Actionをループして代替しない。既存の応募・取下げAction/controlsは変更していない。

接続時の主な差替え箇所は`RecruitmentDemo`が選ぶ合成readerと新設するサーバーadapter/route。
Demoは合成readerのまま残し、本番の取得処理と分ける。transportやRPC名は今回追加していない。

## 検証（2026-11-14）

- 関連ユニットテスト80件PASS：既存選択/DTO 15、応募controls 34、既存シフトUI 11、
  新規reader 10、案件UI 4、取得lifecycle 4、Demo遷移2。
  `node --import tsx --test scripts/worker-recruitment/*.test.*`相当の各ファイルを明示指定して実行。
- `npm run typecheck:web` PASS（Next typegen + Web TypeScript）。
- `npm run lint` PASS（PowerShell実行ポリシーにより`npm.cmd`で起動）。
- 標準`npm run build` PASS（Next.js 16.4.2 / Turbopack、架空のbuild用公開設定、デプロイなし）。
- UI/取得lifecycle/Demo遷移テストは合成データと最小のhook schedulerで実コードを実行する。
  実ブラウザーの操作・レイアウト・フォーカス保証を代替するものではない。
- ブラウザー接続機能は利用不可、ネイティブアプリへのアクセス承認はタイムアウト。
  実ブラウザー操作確認は未完了。既存3100/3101サーバーは停止・変更していない。
- 空接続設定の一時Previewを`127.0.0.1:43119`で起動し、DemoルートのHTTP 200、
  合成データ表示、Demo見出し、初期loading表示を確認。これは画面操作の検証ではない。

実DB・実Auth・LINE・AWS・migration適用・main merge・本番デプロイは行わない。
既存Demoのdevelopment/明示フラグ/空接続設定のgateも変更していない。
