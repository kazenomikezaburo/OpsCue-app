# OpsCue
募集から、現場が無事に終わるまで。

WorkerとAdminの業務をつなぐWebアプリです。既存機能を活用し、IssueとPRで改善します。
- Worker：募集・応募、勤務予定・条件、当日の確認、勤怠、通知
- Admin：案件・勤務・配置、スタッフ管理、勤怠確認、連絡・対応状況

## 共有状態
開発拠点は[OpsCue-app](https://github.com/kazenomikezaburo/OpsCue-app)です。ローカルGitは初期化済みで、現在のブランチはmainです。未コミット変更があります。GitHub側の公開範囲、反映状態、招待受諾、保護設定は未確認です。文書整備・ローカルコピーはGitHub共有承認を意味しません。
所有権、業務情報の開示、ライセンス、依存関係の最終承認は未完了です。
過去39コミット、原本証拠、秘密情報疑い8件、権利保留6件は移行しません。
ローカル検査用のスクリプト、固定コピー、Manifest、結果、審査表、検証記録も自動的に共有しません。

## 技術・構成
Next.js 16.4.0（package.jsonの宣言） / React 19 / TypeScript / Tailwind CSS / Supabase（PostgreSQL 17、Auth、RLS）。
過去の検証記録の組合せはNode.js 22.23.3 / npm 10.9.9、npm lockfile v3です。現在の宣言バージョンでの全体検証を意味しません。
過去記録はWindows上の検証です。現在の全体動作、macOS・チーム全員の再現性は未検証です。
Node22の公式配布物を検証して使い、システムPATH変更や自動インストールは行いません。

| パス | 用途 |
|---|---|
| app/ | ページ、Server Actions、API routes |
| components/ | Worker・Admin・共通UI |
| lib/ | ドメイン、読み取り、認証、Supabase、LINE |
| supabase/migrations/ | DB変更履歴 |
| supabase/tests/ | 未移行のRLSソース候補。実行禁止 |
| scripts/integration/ | fixture・不足依存の審査待ち統合テスト |
| scripts/safety/ | URL構造ガードと合成テスト |
| proxy.ts | セッション・通知の継続導線 |

publicの権利保留素材、favicon等は初期共有の除外対象です。LINE用CDK（infra/bin・lib・test）とscripts/line-delivery-dispatcher.tsはローカルに存在しますが、Dockerfile.line-dispatcher、scripts/build-line-dispatcher.mjs、infra/iam・infra/tools・Bootstrap補助資産は未移行です。ソースの存在はAWSへのデプロイ済み・実行可能を意味しません。
依存パッケージにCDK等が残っていますが、通常Web手順で実行しません。

## 過去の証跡・未検証
| 項目 | 状態 |
|---|---|
| Node22・npm10起動 | 過去記録：確認済み |
| npm ci（lifecycle scripts無効） | 過去記録：398パッケージ導入成功 |
| 合成URLガード | 過去記録：当時の36件PASS |
| Web型検査・ESLint | 過去記録：PASS |
| Gitleaksユーザー実行結果 | 過去の固定564件：ハッシュPASS、終了0、検出報告なし |
| Next dev /画面動作 | 未検証 |
| Next build | BUILD_NOT_RUN：通信遮断・副作用条件未成立 |
| Docker・Supabase起動・migration・Auth・RLSテスト | 未検証／別承認 |
| macOS・Dockerイメージでの再現性 | 未検証 |

上表は過去の固定対象に対する証跡です。STEP 213ではテスト・ビルド・インストール・実接続を行っていません。現在の全ファイルの検証結果ではありません。手動アカウント準備・ログインのユーザー報告は[local-test-accounts](docs/local-test-accounts.md)に分離し、今回の実検証として扱いません。スキャン結果は秘密不存在、全形式の検査、人間の権利・開示承認を保証しません。
現在の文書・移行資産は旧スキャン対象集合と異なります。最終共有前に承認された範囲で最終集合を再検査します。

## 初回セットアップ
以下は承認後の手順です。未承認のDB初期化・外部通信は行いません。
Node22.23.3とnpm10.9.9を明示的に使い、バージョンを確認します。
依存取得の通信先・lockfile integrityを確認し、実資格情報を渡さずaudit・telemetryを無効化します。

~~~sh
node --version
npm --version
npm ci --ignore-scripts --no-audit --no-fund
npm run test:local-target
npm run typecheck:web
npm run lint:web
~~~

npmのユーザー認証設定・環境変数を流用しない実行環境が必要です。
第三者lifecycle scriptsは未実行です。Supabase CLI、esbuild等の利用可否を導入成功だけで保証しません。
Dockerfileのnpm ciはignore-scripts未指定、Nodeタグは浮動です。Docker/compose起動はまだ推奨しません。

## 環境変数
.env.exampleから各自の.env.localを作る手順は、ローカル環境の実行承認後に行います。
実設定ファイルはGit管理・Issue・PR・ログへ掲載しません。
- NEXT_PUBLIC_SUPABASE_URL：各自の承認されたローカル接続先
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY：各自のローカル環境の公開用キー
- 空値では認証・DB連携が使えません
- OPSCUE_CONTINUATION_SECRET：任意の継続導線用、サーバー限定
- LINE関連の値は空のまま。AWS資格情報は設定しません
- NODE_ENVは手動上書きしません

NEXT_PUBLIC変数はブラウザへ公開され得ます。service-roleや秘密値を置きません。

## Supabaseと起動（未検証・実行保留）
Git、承認されたDockerエンジン、利用可能性を確認したSupabase CLIが必要です。RLSテストにはpsqlも必要です。
configのPostgreSQLは17、seed自動適用はfalse、sql_pathsは空です。
ただし新規Supabase起動はDB作成やmigrationを伴い得るため、seed無効だけで安全とは判断しません。
使い捨て環境、daemon/container/volume/DB同一性、migration/fixtureの影響範囲を確認し、人間の実行承認が必要です。
URLガードはURL構造だけを確認し、DB同一性・使い捨て性を保証しません。
実ユーザー・スタッフ・顧客データは禁止。合成Auth fixtureも別承認です。

承認後のCLI help確認と起動候補（未検証）：
~~~sh
npx --no-install supabase --help
npx --no-install supabase start
~~~

新ローカル設定はproject_id=opscue-app-dev、API=http://127.0.0.1:55321、DB=127.0.0.1:55322、Studio=http://127.0.0.1:55323です。期待するDBコンテナ名はsupabase_db_opscue-app-devです。
旧dispatch-osの543xx環境とsupabase_db_dispatch-osは操作対象にしません。本番・外部Supabaseへの接続も禁止です。
ポート番号・project ID・コンテナ名だけでは実環境の安全性を証明できません。実コンテナ完全ID、context、labels、network、volume、binding、独立承認したDB識別と対象隔離を確認できない場合は停止します。オフラインガードの一致結果（executionAuthorized:false）は実行許可ではありません。
DB初期化・reset・migration・seed・Auth操作は今回許可していません。

Next起動候補も未検証です。Google Fonts取得依存はシステムフォントへ変更済みです。
過去のフォント変更時点ではルート型生成・Web型検査・lint・合成ガード36件のPASS記録があります。現在の全体結果として扱いません。
通信遮断とDB/Auth/API等の副作用条件が成立していないため、起動/buildを保留します。
~~~sh
npm run dev
~~~
承認後はlocalhost:3000を使用します。実環境の秘密値で不足設定を埋めません。
npm testとnpm run typecheckは存在しません。Web型検査はnext typegenを含むtypecheck:webです。
build scriptは存在しますが、実行は保留です。

[統合テストREADME](scripts/integration/README.md)は旧環境向けの参考資料で、記載コマンドは実行禁止です。旧コンテナ・旧API・reset手順が残っています。過去の依存保留21件とは別に、現在の移行候補はmanifestで管理します。
旧側の統合資産23件（fixture・補助を含む）とRLS資産17件は未移行です。
統合・RLSテストは、専用隔離DB、安全なfixture、全接続経路を保護するfail-closed共通実行器、別途の明示承認がすべて揃うまで実行禁止です。新側に存在する統合テストも対象です。test-data/Auth準備、SQL setupのDROP/GRANT、元DBへのfallbackを審査し、単純なポート置換では安全と判断しません。
記載のresetを無条件に実行せず、古いCLI/migration説明も現行設定と照合します。

## LINE・AWS・本番
LINE資格情報を設定せず、実送信、Dispatcher、Schedulerを起動しません。
LINE_DELIVERY_ENABLED=falseだけで全LINE経路が遮断されるとは判断しません。
dispatcher向けMockはLogin/Webhook全体のMockではありません。
AWS資格情報・本番操作・デプロイは通常のセットアップに混ぜません。
Event C/D NOT_AUTHORIZED、Live DISABLED、R.70 NOT_STARTED。BACKUP-3/6は開始しません。

## トラブルシューティング
| 症状 | 対応 |
|---|---|
| PageProps/LayoutPropsが見つからない | typecheck:webでルート型生成。strictを緩和しない |
| Supabase設定・ログイン失敗 | 承認済みローカル設定と合成Auth準備を確認。RLSを緩和しない |
| test-dataがない | 保留対象fixtureへの依存。勝手に実データで補わない |
| フォント表示差 | OSごとのシステムフォント差。改行・表・ボタン・等幅表示は画面未検証 |
| ポート競合 | 新側55321〜55323と対象隔離を確認。旧543xx環境を停止・変更して解決しない |
| native/CLIが動かない | 無効化したlifecycle処理の必要性を別途審査 |

[CONTRIBUTING.md](CONTRIBUTING.md)と[AGENTS.md](AGENTS.md)を参照してください。
Next変更前は導入版のnode_modules/next/dist/docsを読みます。
Next.jsはcreate-next-app由来です。公式Next.jsドキュメントは参考情報であり、
Vercel等へのデプロイ許可を意味しません。


## COLLAB-SHARE-7時点の初期共有候補（過去記録）

オーナーは本人または共有可能なチームによる制作と、会社・顧客の非公開情報を含まないことを申告しています。
当時は541件を初期共有候補、21件を依存保留、2件のローカル検証記録を除外と整理しました。現在の集合・移行状況は[migration-manifest](docs/migration-manifest.md)を参照してください。
この申告や候補分類は、第三者ライセンス・秘密不存在・GitHub共有の最終承認を保証しません。
既存の秘密情報疑い8件・権利保留6件は引き続き除外です。
node_modulesとネイティブバイナリを共有しません。依存ライセンスは配布時の通知義務等を別途確認します。
検査スクリプト・結果・審査CSV・コピー入力は初期共有候補へ追加しません。
21件が初期共有にない状態の型検査範囲はWeb用設定に限定し、DB/fixtureテストは起動しません。

## STEP 211移行済み仕様書

以下はローカルに無改変コピーした静的仕様書です。共有承認・実装完了・実行許可とは別です。

- [UI/UX方針](docs/dispatch-os-ui-ux-v1.md)
- [UI Pattern](docs/dispatch-os-ui-patterns-v1.md)
- [Design Foundation](docs/dispatch-os-design-foundation-v1.md)
- [Worker Journey・Shift Timeline契約](docs/ocv1-01-worker-journey-timeline-contract.md)
- [Recruitment Visibility・Discovery契約](docs/ocv1-02a-recruitment-visibility-contract.md)
- [移行manifest・STEP 211結果](docs/migration-manifest.md)

JourneyとRecruitment契約の本文は過去時点のCONTRACT FROZEN / NOT IMPLEMENTEDを保持しています。現在の実装・画面・RLSとの一致は未確認です。冒頭の機能紹介も全機能の動作保証ではなく、未確認のJourney機能や契約要件を実装済みと断定しません。

未解決：docs/ui-1-admin-ia-route-plan.md、画面構成台帳・画面構成Markdown正本、docs/ui_reference/**は新側にありません。Figma正本・版・アクセス権・現行UIとの整合、第三者参考素材の権利確認は未完了です。5件だけでUI/IA仕様が完結したとは判断せず、参照素材を勝手に取り込みません。