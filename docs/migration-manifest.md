# OpsCue P0/P1 移行manifest

作成日：2026-10-12。期限：2026-10-31オンライン予選。目的：3人が新リポジトリでフロント・バック・AWSを開発する。

旧側ラベル：OLD（移行元dispatch-os）。新側ラベル：NEW（OpsCue-appの作業リポジトリ）。パスは各ルートからの相対パス。SHA-256は今回読んだファイルのバイト列であり、秘密スキャンや権利承認の証拠ではない。

今回の唯一の新規ファイルはこのmanifest。コピー・移動・修正・テスト・SQL・DB/Docker/Auth/AWSアクセスは実施していない。旧側4,139件はユーザー指定の保全対象数であり、今回再計数していない。旧側には書き込みを行わない。旧docs全291件の包括移行は行わず、下記の選定ファイルのみ候補にする。

## 判定・実行禁止契約

- MUST MIGRATEはソース移行候補。manifest作成は移行完了でも実行承認でもない。
- 全統合テスト・RLSテストは専用隔離DB、安全なfixture、接続経路を集中管理するfail-closed実行器が完成し、別途承認されるまで実行禁止。新側既存28件も同様。単なる旧ポート置換では安全と判断しない。
- 期待先は opscue-app-dev / API 127.0.0.1:55321 / DB 127.0.0.1:55322 / supabase_db_opscue-app-dev。形式の一致だけでは実DB識別にならない。コンテナ完全ID・context・label・network・volume・bindingと独立承認したDB識別の検証が必要。未確認項目は拒否。
- assertIntegrationTargetの一致結果は executionAuthorized:false。自己申告のapproval/observationを実環境証明に転用しない。実行器は独立した許可・観測・TOCTOU対策が必要。
- Manager、DEMO-001、元dispatch-os DBを変更しない。通常開発DBをテストfixtureやDROP/DELETE/TRUNCATE/GRANTの対象にしない。
- 秘密情報・環境固有情報・第三者素材は全候補で最終確認未完了。今回.env.local/秘密ファイルを読まず、内容の引用やクラウド送信をしていない。未確認を「問題なし」と解釈しない。

## 対象数：旧側 P0 21 件 / P1 63 件 / 合計 84 件

新側13件は別枠。IAMのraw evidence/review JSON、Bootstrap監査テンプレート、infra/tools実験群は下記の保留/ARCHIVEに分離。

## ファイルごとの移行記録

### 1. P0 — docs/dispatch-os-ui-ux-v1.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/dispatch-os-ui-ux-v1.md
- 新予定配置先：docs/dispatch-os-ui-ux-v1.md
- 旧SHA-256：91ef50c3924ce474c1c4e6bbf1af2471f0cb54876f075a85e0af306acf8d4233
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：STEP 211本文レビューと既知形式検査で秘密値・認証値・実個人データ・旧接続先・埋め込み素材の問題を検出せず。第三者参考言及はあるが転載本文/画像は確認できず。著作権の独立確認と外部リンク到達確認は未実施。参照素材の移行・再利用は未承認。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：移行済み（STEP 211：ローカルへの無改変コピーのみ。GitHub共有・実行は未承認）

- STEP 211新SHA-256：91ef50c3924ce474c1c4e6bbf1af2471f0cb54876f075a85e0af306acf8d4233（旧ハッシュと一致・本文無改変）

### 2. P0 — docs/dispatch-os-ui-patterns-v1.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/dispatch-os-ui-patterns-v1.md
- 新予定配置先：docs/dispatch-os-ui-patterns-v1.md
- 旧SHA-256：1d665445c07dd47e17fd29b28a7b999c2bde299b21a9abefb4a0ca90c272c37b
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：dispatch-os(L25), dispatch-os(L28), dispatch-os(L35), dispatch-os(L2067)
- 秘密/環境/権利：STEP 211本文レビューと既知形式検査で秘密値・認証値・実個人データ・旧接続先・埋め込み素材の問題を検出せず。第三者参考言及はあるが転載本文/画像は確認できず。著作権の独立確認と外部リンク到達確認は未実施。参照素材の移行・再利用は未承認。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：移行済み（STEP 211：ローカルへの無改変コピーのみ。GitHub共有・実行は未承認）

- STEP 211新SHA-256：1d665445c07dd47e17fd29b28a7b999c2bde299b21a9abefb4a0ca90c272c37b（旧ハッシュと一致・本文無改変）

### 3. P0 — docs/dispatch-os-design-foundation-v1.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/dispatch-os-design-foundation-v1.md
- 新予定配置先：docs/dispatch-os-design-foundation-v1.md
- 旧SHA-256：c3bed8a9ad98ad15303277c34c77d0a3937f9dcdd0ce20c67ca17b95125838b3
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：dispatch-os(L220)
- 秘密/環境/権利：STEP 211本文レビューと既知形式検査で秘密値・認証値・実個人データ・旧接続先・埋め込み素材の問題を検出せず。第三者参考言及はあるが転載本文/画像は確認できず。著作権の独立確認と外部リンク到達確認は未実施。参照素材の移行・再利用は未承認。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：移行済み（STEP 211：ローカルへの無改変コピーのみ。GitHub共有・実行は未承認）

- STEP 211新SHA-256：c3bed8a9ad98ad15303277c34c77d0a3937f9dcdd0ce20c67ca17b95125838b3（旧ハッシュと一致・本文無改変）

### 4. P0 — docs/opscue-v1-gap-audit.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/opscue-v1-gap-audit.md
- 新予定配置先：docs/opscue-v1-gap-audit.md
- 旧SHA-256：1d5340476fcd058410158e93ca9b052a44aafde1992da4c098e9eff127948426
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：dispatch-os(L5)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：未移行

### 5. P0 — docs/ocv1-01-worker-journey-timeline-contract.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/ocv1-01-worker-journey-timeline-contract.md
- 新予定配置先：docs/ocv1-01-worker-journey-timeline-contract.md
- 旧SHA-256：87e9495e298be6a497d3bcc0321edb9791a85d4317fecb42f615b20e05a367af
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：STEP 211本文レビューと既知形式検査で秘密値・認証値・実個人データ・旧接続先・埋め込み素材の問題を検出せず。第三者参考言及はあるが転載本文/画像は確認できず。著作権の独立確認と外部リンク到達確認は未実施。参照素材の移行・再利用は未承認。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：移行済み（STEP 211：ローカルへの無改変コピーのみ。GitHub共有・実行は未承認）

- STEP 211新SHA-256：87e9495e298be6a497d3bcc0321edb9791a85d4317fecb42f615b20e05a367af（旧ハッシュと一致・本文無改変）

### 6. P0 — docs/ocv1-02a-recruitment-visibility-contract.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/ocv1-02a-recruitment-visibility-contract.md
- 新予定配置先：docs/ocv1-02a-recruitment-visibility-contract.md
- 旧SHA-256：695b6df3856408ef664299d4edcc00d1f63276c1a5c264d33b5926f8130682b7
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：STEP 211本文レビューと既知形式検査で秘密値・認証値・実個人データ・旧接続先・埋め込み素材の問題を検出せず。第三者参考言及はあるが転載本文/画像は確認できず。著作権の独立確認と外部リンク到達確認は未実施。参照素材の移行・再利用は未承認。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：移行済み（STEP 211：ローカルへの無改変コピーのみ。GitHub共有・実行は未承認）

- STEP 211新SHA-256：695b6df3856408ef664299d4edcc00d1f63276c1a5c264d33b5926f8130682b7（旧ハッシュと一致・本文無改変）

### 7. P0 — docs/ocv1-07c0-line-delivery-contract.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/ocv1-07c0-line-delivery-contract.md
- 新予定配置先：docs/ocv1-07c0-line-delivery-contract.md
- 旧SHA-256：ae94e82b30a3c4817a1a733506c83230cbec512de700652c2896c0401727ea8b
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：AWS・バック（個人割当未定）
- 移行状況：未移行

### 8. P0 — docs/placement-break-domain-design-v1.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/placement-break-domain-design-v1.md
- 新予定配置先：docs/placement-break-domain-design-v1.md
- 旧SHA-256：3a7ac40c4f19fd587a788cd96eb3581964555cae4d6a8aa066a426d928702437
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：未移行

### 9. P0 — docs/operational-incident-domain-design-v1.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/operational-incident-domain-design-v1.md
- 新予定配置先：docs/operational-incident-domain-design-v1.md
- 旧SHA-256：fd9acc69572a23a4c3a0ab57de5a97968f68818ab9452d08cccb79ef371aa08d
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：未移行

### 10. P0 — docs/domain-2.9a-announcement-design-result.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/domain-2.9a-announcement-design-result.md
- 新予定配置先：docs/domain-2.9a-announcement-design-result.md
- 旧SHA-256：f2159b83d1ad0430a740cce486c790f9a9c7a3791052ea1674aa73d8af5a4d96
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：未移行

### 11. P0 — docs/ui-1.6-edit-security-plan.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/ui-1.6-edit-security-plan.md
- 新予定配置先：docs/ui-1.6-edit-security-plan.md
- 旧SHA-256：b825e910f5d019aaf0c4038439ea9007a32be97d7f22a422d5eef47b40310d3d
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：未移行

### 12. P0 — docs/staff-2a-skill-qualification-foundation-result.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/staff-2a-skill-qualification-foundation-result.md
- 新予定配置先：docs/staff-2a-skill-qualification-foundation-result.md
- 旧SHA-256：1e8759669380903d4533be8fa20260120ec52c15009bd78394db99b4bb8db4ce
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：未移行

### 13. P0 — docs/staff-2c-structured-job-requirements-result.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/staff-2c-structured-job-requirements-result.md
- 新予定配置先：docs/staff-2c-structured-job-requirements-result.md
- 旧SHA-256：940fdb27aa3544efd71c02fef89035865d1978f9fd6decb6b892b6e6c18d957b
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：未移行

### 14. P0 — docs/staff-2d-availability-work-conditions-foundation-result.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/staff-2d-availability-work-conditions-foundation-result.md
- 新予定配置先：docs/staff-2d-availability-work-conditions-foundation-result.md
- 旧SHA-256：01bb890a6cf7370489a70bb263120c2879fe402d2c591cbac1bd8eb3682ab4ac
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：未移行

### 15. P0 — docs/staff-2i-availability-work-conditions-ui-result.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/staff-2i-availability-work-conditions-ui-result.md
- 新予定配置先：docs/staff-2i-availability-work-conditions-ui-result.md
- 旧SHA-256：ba02971c12304539fa6778ac7ec197feaa34f64fd7fbabaff7e301edf99f72a2
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：未移行

### 16. P0 — docs/staff-2g-3-candidate-picker-read-ui-result.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/staff-2g-3-candidate-picker-read-ui-result.md
- 新予定配置先：docs/staff-2g-3-candidate-picker-read-ui-result.md
- 旧SHA-256：6706aa644a935e94e1a38bb7e7c588a7e33ec342e43a684c6c2e6b5aa0feeddf
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：未移行

### 17. P0 — docs/admin-ui-3.0b-6c-canonical-project-ia-result.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/admin-ui-3.0b-6c-canonical-project-ia-result.md
- 新予定配置先：docs/admin-ui-3.0b-6c-canonical-project-ia-result.md
- 旧SHA-256：760bbced524e7bfab897f4e7a05c4496354573d8ed640fedc7892ab0f5542396
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：未移行

### 18. P0 — docs/admin-ui-3.0b-6g-project-workplace-canonical-ux-result.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/admin-ui-3.0b-6g-project-workplace-canonical-ux-result.md
- 新予定配置先：docs/admin-ui-3.0b-6g-project-workplace-canonical-ux-result.md
- 旧SHA-256：4fa1e09e2ce0c9943b16e24c34d2e139d47de7990828b5c94350001160342e02
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：フロント・バック（個人割当未定）
- 移行状況：未移行

### 19. P0 — docs/opscue-p2-04-iac-existing-resources.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/opscue-p2-04-iac-existing-resources.md
- 新予定配置先：docs/opscue-p2-04-iac-existing-resources.md
- 旧SHA-256：160688d84bb573aedb60a7b3146bbd78e983814c442b638abd8055befb023feb
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：AWS・バック（個人割当未定）
- 移行状況：未移行

### 20. P0 — docs/opscue-p2-04b1-permissions-review.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/opscue-p2-04b1-permissions-review.md
- 新予定配置先：docs/opscue-p2-04b1-permissions-review.md
- 旧SHA-256：075a07aae74922df61611070df81fd88b64eb66cbf59c0fe9729fd226ddce2ad
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：AWS・バック（個人割当未定）
- 移行状況：未移行

### 21. P0 — docs/ocv1-07c2-06a-production-readiness-canary-preparation.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/ocv1-07c2-06a-production-readiness-canary-preparation.md
- 新予定配置先：docs/ocv1-07c2-06a-production-readiness-canary-preparation.md
- 旧SHA-256：5039281dca8950f0e3e3b6fff88619585f9159e31d7a447eeca7a4333e83e198
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：AWS・バック（個人割当未定）
- 移行状況：未移行

### 22. P1 — docs/opscue-p2-04b6-bootstrap-preflight.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/opscue-p2-04b6-bootstrap-preflight.md
- 新予定配置先：docs/opscue-p2-04b6-bootstrap-preflight.md
- 旧SHA-256：f44ce38c7b4236e4061c036e79093784ee1fc7762fd59ccfcb7161d85fc05124
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：AWS・バック（個人割当未定）
- 移行状況：未移行

### 23. P1 — docs/opscue-p2-04b6-1-bootstrap-operator-architecture.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/opscue-p2-04b6-1-bootstrap-operator-architecture.md
- 新予定配置先：docs/opscue-p2-04b6-1-bootstrap-operator-architecture.md
- 旧SHA-256：9158a7d68fc4f6fac5833c5d195987711e8637d398f38849f39d88ba307abdb6
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：AWS・バック（個人割当未定）
- 移行状況：未移行

### 24. P1 — docs/opscue-p2-04b8-bootstrap-operator-role-preflight.md

- 区分：MUST MIGRATE / 仕様・運用
- 旧相対パス：docs/opscue-p2-04b8-bootstrap-operator-role-preflight.md
- 新予定配置先：docs/opscue-p2-04b8-bootstrap-operator-role-preflight.md
- 旧SHA-256：002fbb1dff9232eeeb7ea809cb3fc0e8c58a6728a118270eb5d063ad32322fb9
- 移行理由：UI・ドメイン・認可・運用境界を3人で共有する。結果文書は現行仕様の補足として選定。
- 依存：本文の参照文書、現行 lib/actions/app、Supabase migrations。AWS文書は infra のCDK・IAM定義。参照リンク閉包は未確認。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：歴史的結果と現行仕様を区別。旧環境名・リンクを見直し、未解決HOLD/未承認状態を保持。画像・Figma等は権利確認後に別承認。
- 移行後実行禁止条件：閲覧のみ。記載コマンド・SQL・AWS操作は別承認まで実行禁止。
- レビュー担当：AWS・バック（個人割当未定）
- 移行状況：未移行

### 25. P1 — scripts/integration/admin-attendance-test.ts

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/admin-attendance-test.ts
- 新予定配置先：scripts/integration/admin-attendance-test.ts
- 旧SHA-256：c59501ebaea920246966a98b84a1a2a54ba23f6ac3b4d8d78130a414b1486018
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 26. P1 — scripts/integration/worker-attendance-test.ts

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/worker-attendance-test.ts
- 新予定配置先：scripts/integration/worker-attendance-test.ts
- 旧SHA-256：417e331c13d00847b9057932e4ff38f77fa24d5a271fcb9f28d9bb052f2f9a99
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：supabase_db_dispatch-os(L19), dispatch-os(L19), supabase_db_dispatch-os(L22), dispatch-os(L22)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 27. P1 — scripts/integration/worker-pre-shift-test.ts

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/worker-pre-shift-test.ts
- 新予定配置先：scripts/integration/worker-pre-shift-test.ts
- 旧SHA-256：95e60e8ce6915ca06239ee4b13a197c284cd00dff43b4f8608d3085120c5e498
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：supabase_db_dispatch-os(L15), dispatch-os(L15)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 28. P1 — scripts/integration/pre-shift-admin-test.ts

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/pre-shift-admin-test.ts
- 新予定配置先：scripts/integration/pre-shift-admin-test.ts
- 旧SHA-256：6bf6d46b6bf080e7de1feddb5e17f65d083ca998c9ceca58fc435307dcbf1d28
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 29. P1 — scripts/integration/pre-shift-rls-test.ts

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/pre-shift-rls-test.ts
- 新予定配置先：scripts/integration/pre-shift-rls-test.ts
- 旧SHA-256：1cd25936a22504ffd374d0cf81d247529a5a0d95339379fd2870fe3b916c72c2
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：supabase_db_dispatch-os(L31), dispatch-os(L31)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 30. P1 — scripts/integration/attendance-confirmation-test.ts

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/attendance-confirmation-test.ts
- 新予定配置先：scripts/integration/attendance-confirmation-test.ts
- 旧SHA-256：a844b326bb6e4330f82bfdb498e9eb3a135444ade53649376fd9a42b05e660fe
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：supabase_db_dispatch-os(L13), dispatch-os(L13)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 31. P1 — scripts/integration/attendance-revision-test.ts

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/attendance-revision-test.ts
- 新予定配置先：scripts/integration/attendance-revision-test.ts
- 旧SHA-256：3cd1185d0e90c6bdec9eaeca87989d20499168bf624469bb0c9a3c701163ea76
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：supabase_db_dispatch-os(L10), dispatch-os(L10)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 32. P1 — scripts/integration/assignment-state-transition-test.ts

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/assignment-state-transition-test.ts
- 新予定配置先：scripts/integration/assignment-state-transition-test.ts
- 旧SHA-256：8b528d7824958102915b120fb879510ad3401a286e9404ca340c111e0500f888
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：supabase_db_dispatch-os(L17), dispatch-os(L17)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 33. P1 — scripts/integration/assignment-integrity-test.ts

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/assignment-integrity-test.ts
- 新予定配置先：scripts/integration/assignment-integrity-test.ts
- 旧SHA-256：8b5e462779242cb2e0adfbf7b8cdb0128cdbc6e414bcd411ce7029a0f8f01dfc
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：supabase_db_dispatch-os(L23), dispatch-os(L23)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 34. P1 — scripts/integration/assignment-absence-transition-test.ts

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/assignment-absence-transition-test.ts
- 新予定配置先：scripts/integration/assignment-absence-transition-test.ts
- 旧SHA-256：2f82613385ed78ff092d96c765f7c5315281dbcb9be705f6a4504ff40be295e2
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：supabase_db_dispatch-os(L19), dispatch-os(L19)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 35. P1 — scripts/integration/api-security-test.ts

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/api-security-test.ts
- 新予定配置先：scripts/integration/api-security-test.ts
- 旧SHA-256：382b51a8104aaf84f6bce5e8619d6d18b762eeaa81c20de05b4b3ee89914af92
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 36. P1 — scripts/integration/admin-project-workplace-canonical-ux-test.mjs

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/admin-project-workplace-canonical-ux-test.mjs
- 新予定配置先：scripts/integration/admin-project-workplace-canonical-ux-test.mjs
- 旧SHA-256：e91b3a251d5caf346b81f41ab6a8e3c24baef26757d518126e7e3d0e9e9432b0
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：supabase_db_dispatch-os(L39), dispatch-os(L39)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 37. P1 — scripts/integration/admin-project-history-foundation-test.mjs

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/admin-project-history-foundation-test.mjs
- 新予定配置先：scripts/integration/admin-project-history-foundation-test.mjs
- 旧SHA-256：059c2b42c9cddbb3524c014a626dd7f1476e501190433eafa06ffa36e47a6b07
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：supabase_db_dispatch-os(L23), dispatch-os(L23)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 38. P1 — scripts/integration/worker-line-push-adapter-test.ts

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/worker-line-push-adapter-test.ts
- 新予定配置先：scripts/integration/worker-line-push-adapter-test.ts
- 旧SHA-256：bcde50f44c1554c636d437f0eb3bb29180540d30e106ae1f64fbdf47583a4f48
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：supabase_db_dispatch-os(L145), dispatch-os(L145)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 39. P1 — scripts/integration/worker-line-identity-consent-test.mjs

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/worker-line-identity-consent-test.mjs
- 新予定配置先：scripts/integration/worker-line-identity-consent-test.mjs
- 旧SHA-256：396eab39ad30e4dd3c4449efccb7f3e56136424c24292dbab32d5e3b8935343b
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：supabase_db_dispatch-os(L5), dispatch-os(L5)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 40. P1 — scripts/integration/worker-line-delivery-claim-finalize-test.mjs

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/worker-line-delivery-claim-finalize-test.mjs
- 新予定配置先：scripts/integration/worker-line-delivery-claim-finalize-test.mjs
- 旧SHA-256：30ae7eeec22a55fccea0fc3bd15894d6fbc27440f1ace9e8a7781a27328a715f
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：supabase_db_dispatch-os(L6), dispatch-os(L6)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 41. P1 — scripts/integration/worker-line-dispatcher-container-test.mjs

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/worker-line-dispatcher-container-test.mjs
- 新予定配置先：scripts/integration/worker-line-dispatcher-container-test.mjs
- 旧SHA-256：30615925cc399711b6d2cd37e7a0f8b18cb2d598b6ca41363d6047daed17540e
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：supabase_db_dispatch-os(L13), dispatch-os(L13), supabase_db_dispatch-os(L14), dispatch-os(L14), host.docker.internal(L120), 54322(L123), host.docker.internal(L123), host.docker.internal(L170), 54322(L173), host.docker.internal(L173)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 42. P1 — scripts/integration/day-of-fixture-matrix-test.mjs

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/day-of-fixture-matrix-test.mjs
- 新予定配置先：scripts/integration/day-of-fixture-matrix-test.mjs
- 旧SHA-256：39f21637e45bae0d46eb18214ded6d0e2572f0c7e03393b35219dcde9eba637f
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：54321(L7), 54321(L8), 54321(L10)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 43. P1 — scripts/integration/worker-line-browser-fixture.mjs

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/worker-line-browser-fixture.mjs
- 新予定配置先：scripts/integration/worker-line-browser-fixture.mjs
- 旧SHA-256：356f64e79e96a3df2cfe9ee09521115c4cba2534112bb302b980dd86946299ca
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：54321(L4), supabase_db_dispatch-os(L17), dispatch-os(L17)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 44. P1 — scripts/integration/worker-journey-browser-fixture.mjs

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/worker-journey-browser-fixture.mjs
- 新予定配置先：scripts/integration/worker-journey-browser-fixture.mjs
- 旧SHA-256：9dffe9fc0a9cddc3ae773ed90eba99d4124f24880664c5ed280d9cdbe4e504ff
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：54321(L4), supabase_db_dispatch-os(L17), dispatch-os(L17)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 45. P1 — scripts/integration/admin-journey-browser-fixture.mjs

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/admin-journey-browser-fixture.mjs
- 新予定配置先：scripts/integration/admin-journey-browser-fixture.mjs
- 旧SHA-256：bb5fac8c9e0b9dbef025cc8c08cd7695894492a076bbb9e90a3283816c64f76a
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：54321(L4), supabase_db_dispatch-os(L10), dispatch-os(L10)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 46. P1 — scripts/integration/auth-fixtures.ts

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/auth-fixtures.ts
- 新予定配置先：scripts/integration/auth-fixtures.ts
- 旧SHA-256：bb75e184df590e0b356d6ac319def3da38dc205b66bbca947dca6a65f1ee56b4
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：54321(L16), supabase_db_dispatch-os(L49), dispatch-os(L49)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 47. P1 — scripts/integration/test-data.ts

- 区分：MUST MIGRATE / 統合・fixture（23件）
- 旧相対パス：scripts/integration/test-data.ts
- 新予定配置先：scripts/integration/test-data.ts
- 旧SHA-256：68dee79776f1805e1a6f0f97a07cb56cb447cf43cb839eafea14de8a64272957
- 移行理由：認可・業務遷移・LINE境界の回帰資産を失わない。補助2件とブラウザfixture3件を含む。
- 依存：auth-fixtures.ts、test-data.ts、既存 test-runner.ts、package.json/lock、tsx/Node、現行 migrations/lib/actions。LINE Docker検証は dispatcher/build/CDKにも依存。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：共通実行器と実環境識別・隔離DB・安全なfixtureへ改修。直結SQL/子プロセス/SDK/環境変数fallbackを全点検。固定認証値・実データを除去。ポート置換だけでは不可。
- 移行後実行禁止条件：専用隔離DBと安全なfixture、全経路のfail-closed検証、実行承認が揃うまで実行禁止。ブラウザfixtureも禁止。
- レビュー担当：バック（LINE・コンテナはAWSも）（個人割当未定）
- 移行状況：未移行

### 48. P1 — supabase/tests/rls/helpers.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/helpers.sql
- 新予定配置先：supabase/tests/rls/helpers.sql
- 旧SHA-256：920be32beaea5a610ee602b82aa026d605b4f7229abf4d3c3035df5217da4f6a
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 49. P1 — supabase/tests/rls/README.md

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/README.md
- 新予定配置先：supabase/tests/rls/README.md
- 旧SHA-256：27af5a262fde3784b7176cd416433338bd977cbd2b2d4cb6585eb82e9f2553ec
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：54322(L45)
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 50. P1 — supabase/tests/rls/setup.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/setup.sql
- 新予定配置先：supabase/tests/rls/setup.sql
- 旧SHA-256：b99ea0116ac07d126b20f22d40416aac9c78c1e21d0c36fb73be5e48c1b26555
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 51. P1 — supabase/tests/rls/test_anon.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/test_anon.sql
- 新予定配置先：supabase/tests/rls/test_anon.sql
- 旧SHA-256：25bc448f7796d2a5cf9230fdc83b0e5242eb9ceca9ff52c401cd52d11d7b6810
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 52. P1 — supabase/tests/rls/test_assignments.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/test_assignments.sql
- 新予定配置先：supabase/tests/rls/test_assignments.sql
- 旧SHA-256：046bb20f02ecfc5ff19197afec6960083204afb90542ef0d81ed30655ab1f774
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 53. P1 — supabase/tests/rls/test_attendance_events.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/test_attendance_events.sql
- 新予定配置先：supabase/tests/rls/test_attendance_events.sql
- 旧SHA-256：c25490aa8bc296de976883448235e501b1f6aed665a4dca7d61f3c059a82b174
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 54. P1 — supabase/tests/rls/test_attendance_records.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/test_attendance_records.sql
- 新予定配置先：supabase/tests/rls/test_attendance_records.sql
- 旧SHA-256：8b73a9bbc27693a1ce098518ed9b95af5b5e09ae15c6decf8679420c357e1710
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 55. P1 — supabase/tests/rls/test_branches.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/test_branches.sql
- 新予定配置先：supabase/tests/rls/test_branches.sql
- 旧SHA-256：6c14528a0aeeda7e1496c601391c06106234299a79ea197707155274da6a5fd0
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 56. P1 — supabase/tests/rls/test_hierarchy.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/test_hierarchy.sql
- 新予定配置先：supabase/tests/rls/test_hierarchy.sql
- 旧SHA-256：1aebfdc667d7aeb9f947c8a5c38e5c9a6f3dc9e56b0af02f516d9a10a5ba0748
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 57. P1 — supabase/tests/rls/test_idor.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/test_idor.sql
- 新予定配置先：supabase/tests/rls/test_idor.sql
- 旧SHA-256：d914f1b489a36486f5e6b93441857a613cb59c9becbfe4c67a814a3b64cbc4fd
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 58. P1 — supabase/tests/rls/test_pre_shift_confirmations.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/test_pre_shift_confirmations.sql
- 新予定配置先：supabase/tests/rls/test_pre_shift_confirmations.sql
- 旧SHA-256：11bdfb5e1ab1c7dc0bd817ced6162647dc93e4d3b4942782132aebad43c274c4
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 59. P1 — supabase/tests/rls/test_privilege_escalation.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/test_privilege_escalation.sql
- 新予定配置先：supabase/tests/rls/test_privilege_escalation.sql
- 旧SHA-256：61523d4aaf3cfa1069c56c6b70548ca55c787ae9681c77c8080ade130cd0ee4c
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 60. P1 — supabase/tests/rls/test_profiles.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/test_profiles.sql
- 新予定配置先：supabase/tests/rls/test_profiles.sql
- 旧SHA-256：3e2aed22de165d8565b2258a56c1aacbdd34b7c3c4263e94b3e8a930f77a71be
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 61. P1 — supabase/tests/rls/test_projects.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/test_projects.sql
- 新予定配置先：supabase/tests/rls/test_projects.sql
- 旧SHA-256：c9376115a7464f6fc936ad00d35ed0e08bc60afc8df27bea5fcec82d0acaef6c
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 62. P1 — supabase/tests/rls/test_shift_applications.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/test_shift_applications.sql
- 新予定配置先：supabase/tests/rls/test_shift_applications.sql
- 旧SHA-256：a7b208fba47d9a24832b075a0ef2ba33468a18a86dfeef1c0249b8b8b7d3dcdc
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 63. P1 — supabase/tests/rls/test_workers.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/rls/test_workers.sql
- 新予定配置先：supabase/tests/rls/test_workers.sql
- 旧SHA-256：2be676e192f66164648b7ba556d62815339d51f7491e7bee07086d9a02951b6a
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 64. P1 — supabase/tests/run_rls_tests.sql

- 区分：MUST MIGRATE / RLS（17件）
- 旧相対パス：supabase/tests/run_rls_tests.sql
- 新予定配置先：supabase/tests/run_rls_tests.sql
- 旧SHA-256：242d987779d93b63bfe539d4b0ebe5681c3f41a4c8e6da1bf61df8c7f0a11d57
- 移行理由：テーブル・匿名・権限昇格・IDORのセキュリティ回帰資産。
- 依存：run_rls_tests.sql、rls/setup.sql、helpers.sql、全 test_*.sql、現行全migration/GRANT、隔離DB、SQL実行器。旧seed内容は移行しない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：setupのDROP/GRANTとAuth seedを隔離専用に再設計。初期schemaだけの前提を現行migrationへ更新。通常開発DBのRLS/GRANTを変えない。
- 移行後実行禁止条件：専用隔離DB・安全なfixture完成、対象証明・別承認までSQL/runner実行禁止。
- レビュー担当：バック（個人割当未定）
- 移行状況：未移行

### 65. P1 — Dockerfile.line-dispatcher

- 区分：MUST MIGRATE / Dispatcherビルド
- 旧相対パス：Dockerfile.line-dispatcher
- 新予定配置先：Dockerfile.line-dispatcher
- 旧SHA-256：f0deec68cba0414f760997932a53b5a507b088fffb7f6140aaf06b36af35408e
- 移行理由：既存 dispatcher.ts を新側だけでコンテナ化するための不足資産。
- 依存：scripts/line-delivery-dispatcher.ts、lib、tsconfig.json、package.json/lock、Node22、esbuild、Docker。CDKはLINE通知基盤でありWeb全体ではない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：新側の依存バージョンに整合するbuild:line-dispatcherを別変更で追加。秘密・実環境URLのイメージ混入を防止。ライセンス・lock整合を確認。
- 移行後実行禁止条件：Docker/build/install/push/deploy/LINE送信は別承認まで禁止。
- レビュー担当：AWS・バック（個人割当未定）
- 移行状況：未移行

### 66. P1 — scripts/build-line-dispatcher.mjs

- 区分：MUST MIGRATE / Dispatcherビルド
- 旧相対パス：scripts/build-line-dispatcher.mjs
- 新予定配置先：scripts/build-line-dispatcher.mjs
- 旧SHA-256：877d2d3153ef0af69547001c506667d00652b39c6622f6913e07283bd132b169
- 移行理由：既存 dispatcher.ts を新側だけでコンテナ化するための不足資産。
- 依存：scripts/line-delivery-dispatcher.ts、lib、tsconfig.json、package.json/lock、Node22、esbuild、Docker。CDKはLINE通知基盤でありWeb全体ではない。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：新側の依存バージョンに整合するbuild:line-dispatcherを別変更で追加。秘密・実環境URLのイメージ混入を防止。ライセンス・lock整合を確認。
- 移行後実行禁止条件：Docker/build/install/push/deploy/LINE送信は別承認まで禁止。
- レビュー担当：AWS・バック（個人割当未定）
- 移行状況：未移行

### 67. P1 — infra/iam/p2-04b1/bootstrap-operator-candidate.json

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b1/bootstrap-operator-candidate.json
- 新予定配置先：infra/iam/p2-04b1/bootstrap-operator-candidate.json
- 旧SHA-256：9ce96799f08236e6d4bf1130fc2d8fadd2feac885564a02b11d823783ad24e6a
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 68. P1 — infra/iam/p2-04b1/canary-execution-boundary.json

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b1/canary-execution-boundary.json
- 新予定配置先：infra/iam/p2-04b1/canary-execution-boundary.json
- 旧SHA-256：16a081b446132f30e2068e314bb038783ca1fb22855aca93d529345832cf3c4a
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 69. P1 — infra/iam/p2-04b1/cfn-execution-iam.json

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b1/cfn-execution-iam.json
- 新予定配置先：infra/iam/p2-04b1/cfn-execution-iam.json
- 旧SHA-256：9e922ad078684e1a8ff3d99d77fb6d42756ddf85ba2c706c8f35eb5dc6ca4493
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 70. P1 — infra/iam/p2-04b1/cfn-execution-services.json

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b1/cfn-execution-services.json
- 新予定配置先：infra/iam/p2-04b1/cfn-execution-services.json
- 旧SHA-256：11c6e78fd39b04b6f4c8ded9e1df4fc6729733474a12b76a266d7ed261a49584
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 71. P1 — infra/iam/p2-04b1/compare-simulator-results.mjs

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b1/compare-simulator-results.mjs
- 新予定配置先：infra/iam/p2-04b1/compare-simulator-results.mjs
- 旧SHA-256：b8772622bb94bb7e22de9905282da23360fa616a92c83ec3a750df5e4eb9877c
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 72. P1 — infra/iam/p2-04b1/generate-simulator-requests.mjs

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b1/generate-simulator-requests.mjs
- 新予定配置先：infra/iam/p2-04b1/generate-simulator-requests.mjs
- 旧SHA-256：61be86e980dde4fb4422123a840492f269f2e3653500f26003fd5a2fc17868a2
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 73. P1 — infra/iam/p2-04b1/normal-secret-read.template.json

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b1/normal-secret-read.template.json
- 新予定配置先：infra/iam/p2-04b1/normal-secret-read.template.json
- 旧SHA-256：4794fbcf0410baef1345557290c4604815f8bd3cf83dd49666bba977d1bf99c5
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 74. P1 — infra/iam/p2-04b1/scheduler-boundary.json

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b1/scheduler-boundary.json
- 新予定配置先：infra/iam/p2-04b1/scheduler-boundary.json
- 旧SHA-256：5dff363fd471fe7928ce104dfad297031281ff0ec3213b7a9f1f42b5807101b6
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 75. P1 — infra/iam/p2-04b1/simulator-harness-test.mjs

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b1/simulator-harness-test.mjs
- 新予定配置先：infra/iam/p2-04b1/simulator-harness-test.mjs
- 旧SHA-256：5fe6077c8d4f69e2039f5264229f661df1132bbc183e48108692ea070f446155
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 76. P1 — infra/iam/p2-04b1/simulator-harness.mjs

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b1/simulator-harness.mjs
- 新予定配置先：infra/iam/p2-04b1/simulator-harness.mjs
- 旧SHA-256：d739def2fcbf3061fdfd0a0bdbceca913fd08c966fd731739fa9adc74d6d333f
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 77. P1 — infra/iam/p2-04b1/verification-cases.json

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b1/verification-cases.json
- 新予定配置先：infra/iam/p2-04b1/verification-cases.json
- 旧SHA-256：5d9e2393cfbe49dd9c7caf44e7d5c0918c903d0f2011fdae57e62569b3f27617
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 78. P1 — infra/iam/p2-04b1/verify-local.mjs

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b1/verify-local.mjs
- 新予定配置先：infra/iam/p2-04b1/verify-local.mjs
- 旧SHA-256：c9943205c3076c5e6a5ad75e9e76e4bd11fe04b7b95d850391e2201440fc6e99
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 79. P1 — infra/iam/p2-04b5/reconcile-handlers.mjs

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b5/reconcile-handlers.mjs
- 新予定配置先：infra/iam/p2-04b5/reconcile-handlers.mjs
- 旧SHA-256：f1b129c24bc2873a4c7a15832a030f4dace6a75f53d03f8da0a3fba486f6da36
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 80. P1 — infra/iam/p2-04b7/audit-simulator-evidence.mjs

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b7/audit-simulator-evidence.mjs
- 新予定配置先：infra/iam/p2-04b7/audit-simulator-evidence.mjs
- 旧SHA-256：1d62d7cf780f2361843c4df225b4f7e6ac62f744ae2ee5b070bc112127f10f9b
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 81. P1 — infra/iam/p2-04b7/policy-artifacts-test.mjs

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b7/policy-artifacts-test.mjs
- 新予定配置先：infra/iam/p2-04b7/policy-artifacts-test.mjs
- 旧SHA-256：ca19d8cb994a928983e690427daad905fb92633b3474120fb0d4104a86b96c0e
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 82. P1 — infra/iam/p2-04b7/policy-artifacts.mjs

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b7/policy-artifacts.mjs
- 新予定配置先：infra/iam/p2-04b7/policy-artifacts.mjs
- 旧SHA-256：b03a47b23ac1dc96c66639cf8e8610586d864324544b06b3dc56255d5de8c961
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 83. P1 — infra/iam/p2-04b7/verify-created-policies.mjs

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b7/verify-created-policies.mjs
- 新予定配置先：infra/iam/p2-04b7/verify-created-policies.mjs
- 旧SHA-256：cff3be6ef3823d182949907b2be45ca4cab1b13d00c116f93bccbbd32d4f6a1a
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

### 84. P1 — infra/iam/p2-04b8/trust-policy.json

- 区分：MUST MIGRATE / IAMソース・レビュー補助
- 旧相対パス：infra/iam/p2-04b8/trust-policy.json
- 新予定配置先：infra/iam/p2-04b8/trust-policy.json
- 旧SHA-256：39406f4462096ca1b6ba3a790cb2c9f665e315b6cb929a2dc9edbe3caf0781f3
- 移行理由：最小権限・境界・trust・静的検証の設計根拠を共有。実AWSの証明ではない。
- 依存：同じ infra/iam サブディレクトリの相互参照、P2-04権限/Bootstrap文書、Node。review/evidence入力は別途安全な模擬データへ置換。AWS CLI依存の有無は実行前レビュー。
- 旧環境参照（識別語と行番号のみ）：既知文字列の直接参照なし。import先・環境変数・生成値・間接接続は未確認。
- 秘密/環境/権利：秘密スキャン未完了・環境固有識別子の精査未完了・第三者素材/ライセンス未確認。本文リンク先の画像等はこの候補に含まない。
- 移行前修正・レビュー：アカウント/ARN/リソースIDを承認済み設定へ分離。外部照会・権限作成経路を遮断し、模擬レビュー入力を用意。AdministratorAccessを既定許可にしない。
- 移行後実行禁止条件：スクリプト・IAM simulator・STS・bootstrap・deployはすべて別承認まで実行禁止。
- レビュー担当：AWS（個人割当未定）
- 移行状況：未移行

## STEP 210時点の新側未コミット13件（過去記録・旧側移行件数には含めない）

当時の13件：GitHub未反映（当時のローカル変更として未コミット。GitHub実状態は未確認）。当時このmanifestは14件目の新規作業であり、その13件には含めなかった。下表のconfig・アカウント文書のハッシュはSTEP 215修正後へ更新し、その他は当時の記録を保持する。現在の件数は後述のSTEP 214記録で区別する。

| 新相対パス | 状態 | SHA-256 | 共有判断・必要な修正 | 担当 | 移行状況 |
|---|---|---|---|---|---|
| scripts/safety/assert-local-target.mjs | 変更・GitHub未反映 | 4ccd7f116174ce52c81135f6bff7d7fadf9c49c424c0126e59edfe3b74d116fa | 条件付き共有候補：URL形式のみ。55321/55322・kind拒否を維持。DB識別/実行許可には不可。 秘密/環境/権利確認未完了。 | バック（configはAWS共同） | レビュー待ち |
| scripts/safety/assert-local-target.test.mjs | 変更・GitHub未反映 | f25575b52c662820ccda9459abac4ddc38990c390206680c2ff8534b30da2b36 | 条件付き共有候補：純粋テスト候補。旧ポート拒否・秘密非露出・異常入力を維持。今回未実行。 秘密/環境/権利確認未完了。 | バック（configはAWS共同） | レビュー待ち |
| supabase/config.toml | 変更・GitHub未反映 | 0fc3e466a7e3e85c4ba01ed03f357d2c759440fa7bbd0010c4cb165807a4e1f3 | 条件付き共有候補：project ID/各ポート整合、STEP 215でコメント文字化けを修正。inspectorポート実競合は未確認、並行起動前の注意を追加。コンテナ識別の証明には不可。 秘密/環境/権利確認未完了。 | バック（configはAWS共同） | レビュー待ち |
| docs/local-test-accounts.md | 未追跡・GitHub未反映 | 1ac785d82bc47dd5a3d17ba9edd3d2a52ef16700528b7fc81e987f4aebcdc569 | 条件付き共有候補：手動作成結果はユーザー報告と実検証を区別。STEP 215で実クラスタ識別値を除外し、各環境の独立承認・比較条件を追加。最終審査は別途必要。 秘密/環境/権利確認未完了。 | バック（configはAWS共同） | レビュー待ち |
| scripts/dev/local-account-plan.mjs | 未追跡・GitHub未反映 | c69505533b50c3df7f9e09848845d66068e1746ea0ad55681bf5f31ccf4d06e0 | 条件付き共有候補：オフライン計画のみ。既存Manager/支店保護・不整合停止・非原子性を維持。 秘密/環境/権利確認未完了。 | バック（configはAWS共同） | レビュー待ち |
| scripts/dev/local-account-plan.test.mjs | 未追跡・GitHub未反映 | 768264682b0cc9893b96dc5bcdee3f20c229c4e3db535ab8fbf971d93e0d7e83 | 条件付き共有候補：オフライン模擬テスト。実Auth/DB安全性の証拠には不可。今回未実行。 秘密/環境/権利確認未完了。 | バック（configはAWS共同） | レビュー待ち |
| scripts/dev/prepare-local-accounts.mjs | 未追跡・GitHub未反映 | b7950ecac2021ca464f5a23089dcad1722ab27fc60d5ebad77806b6dbab864ba | 条件付き共有候補：実行入口の無条件拒否を維持。実作成アダプターは別設計/承認。 秘密/環境/権利確認未完了。 | バック（configはAWS共同） | レビュー待ち |
| scripts/safety/actor-pre-shift-authorization.test.mjs | 未追跡・GitHub未反映 | beb128f3b6193405a290f2bc17463941feed1c0ca5624a6a8b2f633e5bfca0ba | 条件付き共有候補：下記migrationとの対。ソース解析/モデルのみでSQL実効性を証明しない。 秘密/環境/権利確認未完了。 | バック（configはAWS共同） | レビュー待ち |
| scripts/safety/assert-integration-target.mjs | 未追跡・GitHub未反映 | 772099e101fd7f853c7e1ef1ab02f52818913eeecd789d8aae58260b32bc1f5d | 条件付き共有候補：executionAuthorized:falseを維持。模擬照合を実行許可としない。 秘密/環境/権利確認未完了。 | バック（configはAWS共同） | レビュー待ち |
| scripts/safety/assert-integration-target.test.mjs | 未追跡・GitHub未反映 | a668d6c258828b5168964c416108f84537de346089eb1f785e327d0a270090bd | 条件付き共有候補：Proxy/偽装/import無副作用の模擬テスト。今回未実行。 秘密/環境/権利確認未完了。 | バック（configはAWS共同） | レビュー待ち |
| scripts/safety/verify-local-account-target.mjs | 未追跡・GitHub未反映 | e6c2b405d51f8ec64f1cf9135502c13d82a2acdcd319f84a1555e059dc0b09e2 | 条件付き共有候補：オフライン照合のみ。live入口拒否を維持。 秘密/環境/権利確認未完了。 | バック（configはAWS共同） | レビュー待ち |
| scripts/safety/verify-local-account-target.test.mjs | 未追跡・GitHub未反映 | 6e030d181c63c4d5c984997d54dddd17ecc0f85c97e95c8e6fc995224d50046c | 条件付き共有候補：上記ガードと入口拒否のオフラインテスト。今回未実行。 秘密/環境/権利確認未完了。 | バック（configはAWS共同） | レビュー待ち |
| supabase/migrations/20261012010651_harden_actor_and_pre_shift_insert_authorization.sql | 未追跡・GitHub未反映 | 24386945b0d3ea508bbb2f6396e2225c307b1c1bfcfaa4aaee1818a31f824ace | 条件付き共有候補：Phase Aのhelper2件のみ。Phase B BLOCKEDを保持。名前からpre-shift全体の修正済みと誤認しない。適用は禁止。 秘密/環境/権利確認未完了。 | バック（configはAWS共同） | レビュー待ち |

新側13件の依存：URLガードとintegrationガード・テストは相互依存。account-plan/prepare/verify/docsは一式レビュー。認可テストとmigrationは対でレビューし、適用承認を分離する。既知旧参照は拒否テストにも存在しうるため、一括置換は禁止。全13件について実DB/Docker/Auth/AWS操作は許可されない。

## ARCHIVE / EXCLUDE / 依存としてのレビュー待ち

- ARCHIVE：旧docsの歴史的作業結果・スクリーンショット・Figma比較証跡（上記選定分以外）。infra/tools のassume-role/GUI/parser/provider/privilege研究、raw simulator evidence、infra/iam/**/evidence、infra/iam/**/review。選定ソースの入力依存があれば安全な模擬入力を別途作る。
- ARCHIVE：opscue-bootstrap-review.yaml。監査用テンプレートを新側のデプロイ既定値にしない。R69等の詳細履歴は旧側保管、execution ready NO/authority未確認/未承認の要点はP0権限・運用文書に保持する。
- EXCLUDE：node_modules、.next、dist、cdk.out、bin/obj、.packages、キャッシュ、一時ファイル、.env各種、鍵/token、実データ・ログ、環境固有cdk.context、未審査の実AWS証跡、権利未確認の第三者画像。削除はしない。
- 依存レビュー待ち：旧 scripts/integration/README.md、package.json の必要スクリプト差分、README/CONTRIBUTING/AGENTSの新側改訂。旧ファイル丸ごと移行せず、新側現状に基づいて別承認で最小修正する。旧seedは内容移行せず安全なfixtureに置換。

## 安全な最短順序・完了判定

1. フロント/バック/AWS担当者を割り当て、このmanifestと選定範囲をレビュー。共有前にローカルの秘密/環境/ライセンス確認を別承認で行う。ハッシュ変化時は再レビュー。
2. 最初の候補はUI仕様2件とdesign foundation、Worker journey/recruitment契約。リンク閉包・権利確認後、静的Markdownだけを別承認で移行。本文のコマンドは実行しない。
3. 新READMEの旧バージョン/除外記載/移行状態、CONTRIBUTINGのbranch/PR承認、AGENTSの欠落UIリンクを新側実態へ更新。CI/Secrets/招待/保護ルールは未確認として分離する。
4. Dispatcher build資産・IAMソース・残る仕様文書をソースのみ移行。WebアプリAWS基盤はLINE CDKとは別に不足評価する。Bootstrap/STS/LINE送信を開始しない。
5. 統合23件/RLS17件を禁止付きでソース移行。現行migration、専用隔離DB、安全fixture、実行器と独立識別の設計を先に確定。実環境作成/接続/テストは別承認後のみ。
6. 新側13件をレビューし、offlineとliveの境界を維持して共有準備。migration適用、Auth作成、DB変更、GitHub反映はこのmanifestの承認に含めない。

開発開始の残課題：参照切れ、buildスクリプト不足、秘密/権利確認、IAM入力依存と最小権限、3人の個別アクセス/MFA、GitHub招待/保護/CI承認、隔離テスト環境、実DB識別・全接続経路保護、Web全体のデプロイ範囲。静的フロント/バックの作業開始と、DB/AWS操作の許可は分ける。

移行済みへの変更条件：承認済みコピー/修正後の新側ハッシュ・差分・依存閉包・秘密/権利レビュー結果を記録。修正後は旧ハッシュと一致不要だが変更理由と新ハッシュを記録する。共有済み/実行可能/本番準備完了は別の検証記録を必要とする。現時点でこのmanifestを根拠に「移行完了」としない。

## STEP 211 — P0静的仕様書5件の移行結果

実施日：2026-10-12。成功5件・停止0件。旧側manifestハッシュを再検証し、全件一致。新側の同名ファイルが存在しないことを確認後、CreateNewで上書きを拒否し、旧ファイルのバイト列を内容変更せず複製した。コピー後SHA-256は全件一致。旧側は読み取りのみ。既存未コミット資産は変更しない。

### 審査の範囲・残る制約

- 5件の本文を静的レビューし、既知の認証値/接続文字列/個人情報/旧環境識別子/埋め込み画像形式を補助検査した。問題は検出しなかったが、完全な秘密スキャン・法的な権利保証ではない。
- UI PatternのExternal ReferencesはPattern名・概念・用途のみ参考、本文をOpsCue向けに再構成したと明記。Design FoundationはCal.com/Linear/Notion/ClickUpへの分析・参考言及を含み、Reference CSS/JSON/fontのコピー・runtime利用を禁止している。今回コピーするのはプロジェクト固有のMarkdown本文だけであり、第三者素材はコピーしていない。独立した原典/ライセンス照合は未実施。これら素材の取り込みは別レビューを必要とする。
- UI仕様の既存テスト/ビルド指示、Journey/Recruitmentの実装手順はこの作業で実行しない。CONTRACT FROZEN / NOT IMPLEMENTED等の歴史的ステータスは無改変で保持し、現行実装の証明として扱わない。
- コピー成功はGitHub共有承認、DB/AWS操作、統合テスト実行、仕様の最新性/実装完了を意味しない。

### コピー後の参照確認

| 文書 | 確認できた参照先 | 未解決事項 |
|---|---|---|
| UI/UX方針 | UI Design Dictionaryへの参考言及（名称のみ） | 外部原典・権利の独立照合は未実施 |
| UI Pattern | AGENTS.md、今回のUI/UX方針、app/admin・app/worker・components/admin・components/workerディレクトリ | docs/ui-1-admin-ia-route-plan.mdは新側にない。https://ui-design-dictionary.pages.dev/ は未アクセス・到達性未確認 |
| Design Foundation | 今回のUI Pattern、app/globals.css、components/admin/drawer.tsx | docs/ui_reference/**は新側にない。Dispatch_OS_画面構成台帳.xlsx、Dispatch_OS_画面構成_完成版.mdは新側にない。Figma正本・バージョン・アクセス権は未確認 |
| Worker Journey契約 | 明示的な外部URL/ローカルファイルリンクなし。スキーマ・RPC・Phaseへの意味参照あり | Phase文書との依存閉包・現行migration/実装との一致は未検証 |
| Recruitment契約 | 明示的な外部URL/ローカルファイルリンクなし。スキーマ・RPC・Phaseへの意味参照あり | STAFF-2F/OCV1-02B/03等との依存閉包・現行実装との一致は未検証 |

不足参照は本作業で追加・修正しない。UI/IA正本が欠けるため、これら5件だけで新側のUI仕様が完結したとは判断しない。参照ディレクトリの存在確認は個別routeや挙動の検証ではない。

### コピー前後SHA-256

| 相対パス | 旧（コピー前） | 新（コピー後） |
|---|---|---|
| docs/dispatch-os-ui-ux-v1.md | 91ef50c3924ce474c1c4e6bbf1af2471f0cb54876f075a85e0af306acf8d4233 | 91ef50c3924ce474c1c4e6bbf1af2471f0cb54876f075a85e0af306acf8d4233 |
| docs/dispatch-os-ui-patterns-v1.md | 1d665445c07dd47e17fd29b28a7b999c2bde299b21a9abefb4a0ca90c272c37b | 1d665445c07dd47e17fd29b28a7b999c2bde299b21a9abefb4a0ca90c272c37b |
| docs/dispatch-os-design-foundation-v1.md | c3bed8a9ad98ad15303277c34c77d0a3937f9dcdd0ce20c67ca17b95125838b3 | c3bed8a9ad98ad15303277c34c77d0a3937f9dcdd0ce20c67ca17b95125838b3 |
| docs/ocv1-01-worker-journey-timeline-contract.md | 87e9495e298be6a497d3bcc0321edb9791a85d4317fecb42f615b20e05a367af | 87e9495e298be6a497d3bcc0321edb9791a85d4317fecb42f615b20e05a367af |
| docs/ocv1-02a-recruitment-visibility-contract.md | 695b6df3856408ef664299d4edcc00d1f63276c1a5c264d33b5926f8130682b7 | 695b6df3856408ef664299d4edcc00d1f63276c1a5c264d33b5926f8130682b7 |

## STEP 214 — 共有前レビュー履歴

当時の変更22件（追跡済み変更6件・未追跡16件）を静的レビューした。SHARE READY 17件、FIX REQUIRED 3件、LOCAL ONLY 0件、BLOCKED 2件。これは共有候補の分類でありGitHub共有承認ではない。過去13件の記録とは別の時点である。

- SHARE READY 17件：README.md、CONTRIBUTING.md、AGENTS.md、STEP 211仕様書5件、URLガード/テスト2件、integrationガード/テスト2件、account-targetガード/テスト2件、offline account-plan/テスト/拒否入口3件。
- FIX REQUIRED 3件：supabase/config.toml、docs/local-test-accounts.md、docs/migration-manifest.md。
- BLOCKED 2件：supabase/migrations/20261012010651_harden_actor_and_pre_shift_insert_authorization.sql、scripts/safety/actor-pre-shift-authorization.test.mjs。SQLは標準migration適用経路に入り得るため、テストと対で自動適用分離・レビューを要する。
- Phase AはDB未適用として管理し、共有保留・適用禁止を維持する。実DBの現在の適用状況は接続禁止により再確認していない。SQLコメントは「この変更では未適用」という証跡であり、技術的な実行阻止ではない。Phase BはBLOCKED。
- GitHub側のCI、Supabase連携、migration自動適用、デプロイ連携、招待・保護設定は未確認。既存統合テストの旧接続経路は未封鎖で、統合・RLSテストの実行禁止を維持する。

## STEP 215 — FIX REQUIRED 3件の最小修正

- config：読める英文の意味は保持し、文字化けした区切りだけをASCIIのハイフンへ修正。inspector_port=8083は変更せず、同一ホストの他環境との競合可能性と別承認の起動前確認をコメントに追加。実バインドは未確認のため、ポート変更が必要とは断定しない。全非コメント設定行が修正前後で一致することを静的に確認した。
- local-test-accounts：端末固有の実クラスタ識別値を削除。安全確認に必要な情報であるため、各環境で独立承認した期待値との照合、旧環境との分離、不明時停止を記載。実識別取得・保管方式は未確定。実行拒否入口、既存アカウント/DEMO-001保護を維持。
- manifest：個人端末の絶対パスをOLD/NEWラベルと各ルートからの相対パスへ変更。旧13件を過去記録化し、STEP 214の22件の分類を追記。旧移行元SHA-256は変更せず、今回のconfig・アカウント文書の新側ハッシュだけを更新した。
- 今回は修正のみで再審査待ち。SHARE READYへの自動昇格、GitHub共有承認、実DB操作・migration適用・デプロイの許可はない。テスト/ビルド/DB/Docker/Auth/AWS/SQL実行は行っていない。変更集合は引き続き22件で、今回新規ファイルは作成しない。
- 残るP0：GitHub側自動実行/適用経路、最終共有集合の秘密・権利・開示審査、旧環境直結テストの封鎖と隔離fixture/実行器、招待・branch保護設定の確認。Phase Aと依存テストの共有保留を解除しない。