# OpsCue
募集から、現場が無事に終わるまで。

WorkerとAdminの業務をつなぐWebアプリです。既存機能を活用し、IssueとPRで改善します。
- Worker：募集・応募、勤務予定・条件、当日の確認、勤怠、通知
- Admin：案件・勤務・配置、スタッフ管理、勤怠確認、連絡・対応状況

## 共有状態
OpsCue-app（Private）は予定名です。まだGit初期化・共有・招待していません。
所有権、業務情報の開示、ライセンス、依存関係の最終承認は未完了です。
過去39コミット、原本証拠、秘密情報疑い8件、権利保留6件は移行しません。
ローカル検査用のスクリプト、固定コピー、Manifest、結果、審査表、検証記録も自動的に共有しません。

## 技術・構成
Next.js 16.3.7 / React 19 / TypeScript / Tailwind CSS / Supabase（PostgreSQL 17、Auth、RLS）。
検証した組合せはNode.js 22.23.3 / npm 10.9.9、npm lockfile v3です。
Windowsで検証済み。macOS・チーム全員の再現性は未検証です。
Node22の公式配布物を検証して使い、システムPATH変更や自動インストールは行いません。

| パス | 用途 |
|---|---|
| app/ | ページ、Server Actions、API routes |
| components/ | Worker・Admin・共通UI |
| lib/ | ドメイン、読み取り、認証、Supabase、LINE |
| supabase/migrations/ | DB変更履歴 |
| supabase/tests/ | 実行保留中のRLSテスト |
| scripts/integration/ | fixture・不足依存の審査待ち統合テスト |
| scripts/safety/ | URL構造ガードと合成テスト |
| proxy.ts | セッション・通知の継続導線 |

publicの権利保留素材、favicon、AWS IaC・dispatcher等は初期共有から除外しています。
依存パッケージにCDK等が残っていますが、通常Web手順で実行しません。

## 確認済み・未検証
| 項目 | 状態 |
|---|---|
| Node22・npm10起動 | 確認済み |
| npm ci（lifecycle scripts無効） | 398パッケージ導入成功 |
| 合成URLガード | 36件PASS |
| Web型検査・ESLint | PASS |
| Gitleaksユーザー実行結果 | 固定564件、ハッシュPASS、終了0、検出報告なし |
| Next dev /画面動作 | 未検証 |
| Next build | BUILD_NOT_RUN：通信遮断・副作用条件未成立 |
| Docker・Supabase起動・migration・Auth・RLSテスト | 未検証／別承認 |
| macOS・Dockerイメージでの再現性 | 未検証 |

スキャン結果は秘密不存在、全形式の検査、人間の権利・開示承認を保証しません。
README/CONTRIBUTINGと今回のフォント修正は旧スキャンの対象バイト列と異なり、最終共有前に最終集合を再検査します。

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

本番・remoteへ接続せず、ローカルAPI54321／DB54322／Studio54323との対応を確認します。
DB初期化・reset・migration・seed・Auth操作は今回許可していません。

Next起動候補も未検証です。Google Fonts取得依存はシステムフォントへ変更済みです。
フォント変更後もルート型生成・Web型検査・lint・合成ガード36件はPASSしました。
通信遮断とDB/Auth/API等の副作用条件が成立していないため、起動/buildを保留します。
~~~sh
npm run dev
~~~
承認後はlocalhost:3000を使用します。実環境の秘密値で不足設定を埋めません。
npm testとnpm run typecheckは存在しません。Web型検査はnext typegenを含むtypecheck:webです。
build scriptは存在しますが、実行は保留です。

[統合テスト](scripts/integration/README.md)は参考資料です。依存保留21件は初期共有から除外する提案です。
RLS README・setup・helpers・実行入口と一部統合/ダッシュボードfixtureテストはその21件に含まれます。
不足test-data、Auth準備、SQL setupのDROP/GRANT等を審査するまで実行しません。
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
| ポート競合 | 承認済みローカル対象と54321〜54323の対応を確認 |
| native/CLIが動かない | 無効化したlifecycle処理の必要性を別途審査 |

[CONTRIBUTING.md](CONTRIBUTING.md)と[AGENTS.md](AGENTS.md)を参照してください。
Next変更前は導入版のnode_modules/next/dist/docsを読みます。
Next.jsはcreate-next-app由来です。公式Next.jsドキュメントは参考情報であり、
Vercel等へのデプロイ許可を意味しません。


## COLLAB-SHARE-7 初期共有候補

オーナーは本人または共有可能なチームによる制作と、会社・顧客の非公開情報を含まないことを申告しています。
541件を初期共有候補、21件を依存保留、2件のローカル検証記録を除外と整理しました。
この申告や候補分類は、第三者ライセンス・秘密不存在・GitHub共有の最終承認を保証しません。
既存の秘密情報疑い8件・権利保留6件は引き続き除外です。
node_modulesとネイティブバイナリを共有しません。依存ライセンスは配布時の通知義務等を別途確認します。
検査スクリプト・結果・審査CSV・コピー入力は初期共有候補へ追加しません。
21件が初期共有にない状態の型検査範囲はWeb用設定に限定し、DB/fixtureテストは起動しません。
