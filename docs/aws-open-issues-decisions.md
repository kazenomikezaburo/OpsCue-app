# AWS未解決事項・判断事項 — AWS-1レビュー候補

> 総合状態：**BLOCKED**。文書候補の作成は実行準備完了・AWS操作承認を意味しません。
> 現在のAWS状態はUNKNOWNで、VERIFIED IN AWSを新たに付与した項目はありません。
> M／S／W構成の採否、IAM権限拡張、認証経路の採用は今回決定しません。

## 基準・証拠の扱い

旧`50c83e50949b0245c9ef95ec8f1de4f6b4820cf8`、新main`587ed91c1c8cf4ddea9ef9f16e49cc09483bd54a`、P1-A`a207ca52098c56d9b76715923ea692bfe3c33735`を使用します。リモート最新mainは未確認。旧証拠パスは当該旧commitを指し、新側に存在するという主張ではありません。

本台帳の後続工程は将来の提案です。現在の承認を付与しません。既存の歴史的状態と承認記録は[履歴](aws-design-approval-history.md)、資産対応は[インベントリ](aws-migration-inventory.md)を参照してください。

## 判断台帳

| ID／論点 | 証拠 | 現在の状態 | 必要な判断・成立条件 | 後続工程 |
|---|---|---|---|---|
| DEC-01 アカウント構成 | 旧統合strict-parserのR.58〜R.60、R.69 | DOCUMENTED ONLY。実topology/callerはUNKNOWN | 旧資産の所属、管理・復旧責任、対象regionを非秘密情報で固定。旧単一accountの記述を現状へ転用しない | AWS-2で範囲決定、AWS-3で別承認の限定metadata監査 |
| DEC-02 M／S／Wの採否 | R.58条件付き論理設計、R.69 | DOCUMENTED ONLY／未採用。保護実行はBLOCKED | 継続・採用・再設計の方針、M/S/Wの実対応、管理者を含む信頼前提、費用・運用負担を判断。旧accountを自動的にMとしない | AWS-2 |
| DEC-03 owner／認証前提 | R.61〜R.69 | BLOCKED。OWNER_IDENTITY_AUTHORITY_TRUST_ROOT_NOT_ESTABLISHED | owner/対象authority、独立trust root、reviewer、対象binding、期限・失効・受領手順を選定。token・MFA・passwordの提出は要求しない | AWS-2で方式設計。確認や認証の実行は個別承認 |
| DEC-04 IAM昇格経路 | B.5、B.6、B.6.1、B.8、旧operator candidate | BLOCKED。role policy/trust変更surfaceが残る | 特権bootstrap作業の残余リスクを受容するか、独立Boundary/固定実行経路等を別設計するか判断。管理者権限を追加して不足を埋めない | AWS-2方針、AWS-4候補審査 |
| DEC-05 Bootstrap | 保存bootstrap YAML、B.6、B.7〜B.9 | 現物UNKNOWN／実行BLOCKED | Toolkit/S3/ECR/SSM/roleの衝突、template/version、明示execution policies、trust、失効・rollback責任を確定。暗黙のAdministratorAccess fallbackを使わない | AWS-3 inventory、AWS-4設計、AWS-6個別承認 |
| DEC-06 既存資源再利用 | 新側CDK、旧P2-04 | 定義IMPLEMENTED IN REPOSITORY、現物UNKNOWN | VPC/subnet/route/DNS、通常role、ログ、SNSの所有・現権限・暗号化・通知先を確認。lookup/import成功を推測しない | AWS-3 |
| DEC-07 Secret衝突・分離 | 旧P2-04、B.5、新側CDKの空Secret3件 | 現物UNKNOWN／deploy BLOCKED | 値を取得せずmetadataで同名衝突を確認。既存ならimport/外部管理等を別設計。通常/canary DBとMessaging token、旧/必要名を維持 | AWS-3 metadata、AWS-4定義判断 |
| DEC-08 CFN権限不足 | B.5、B.7、handler matrix | BLOCKED。schemaと実handlerの分岐対応が未確定 | Secret読取、SG/Cluster/IAM update、ECR read、通常role照会、生成物理ARN、rollbackを解決。未確定APIを包括追加しない | AWS-4。新たな検証は別承認 |
| DEC-09 Boundary・role分離 | 旧canary/scheduler Boundary、IAM policy、新CDK | 定義あり、AWS上の存在・適用はUNKNOWN | operator/CFN/task execution/task runtime/Schedulerを分離。通常/canary正負ケースとDenyを保持。Resource:*を機械削除しない | AWS-3現状、AWS-4秘匿化と意味審査 |
| DEC-10 GitHub OIDC | 旧追跡workflowなし、新mainはoffline検査のみ | 新repo向けAWS認証定義は未実装 | 短期OIDC候補の対象repo/environment/ref/audience、対象roleとartifact revision bindingを設計。人向けMFA trustをCIへ流用しない。仕様は外部確認未実施 | AWS-5設計。設定変更・AWS trust作成は別承認 |
| DEC-11 CI/CD・deploy承認 | 現offline workflow、B.6、R.69 | deploy経路未実装／未承認 | public PRへAWS credentialを渡さず、build/ECR publish/CFN変更/task/live送信を別権限・別承認にする。管理者roleやbootstrap operatorをCIへ付与しない | AWS-5候補、AWS-6/7以降個別判断 |
| DEC-12 image・監視・runtime | P1-A commit、旧canary準備、新CDK/runtime | コードあり、build/runtime未検証 | image digest、production origin、signal終了処理、完了・timeout監視、ライセンス表示を審査。通常配送へ自動昇格しない | 別承認のbuild検証、AWS-7/8 |
| DEC-13 内部証拠・大量tool資産 | 旧IAM証拠、infra/tools、R.69 | 内容・権利・再現性の包括審査は未完了 | vendor/binary/保存応答を除外候補として分離。source、依存lock、合成fixture、証拠を許可リストで審査 | AWS-1後の個別移行計画 |

## 工程と承認の分割

| 工程 | 成果物／到達点 | この文書時点で許可されていない操作 |
|---|---|---|
| AWS-2 | DEC-01〜05の選択、M/S/W採否、identity・authority確認方式、限定監査packet | 実認証、環境・credential探索、AWS接続、IaC適用 |
| AWS-3 | 別途承認されたAPI/対象/出力だけのAWS metadata台帳 | Secret値取得、token取得、権限変更、未許可fallback |
| AWS-4 | 限定したIAM/CDK候補と権限・衝突・rollbackの審査 | synth/diff/deploy、検査実行、依存installは別承認 |
| AWS-5 | CI認証・権限・artifact・承認経路設計と候補workflow | GitHub/AWS設定変更、credential付与、workflow起動 |
| AWS-6 | exact mutation planによる必要最小限のIAM/bootstrap準備 | 包括的bootstrap許可、アプリdeployへの承認継承 |
| AWS-7 | 無効状態を維持した基盤deployとread-back | DB変更、Secret値登録、task実行、Scheduler有効化、実送信への自動移行 |
| AWS-8 | 別承認の限定canary、証拠照合、復旧確認 | 通常配送・対象拡大の自動承認 |

AWS-3を開始する前にDEC-03の安全な読み取り・認証前提を解決する必要があります。現在はその成立を確認していません。AWS-2の設計許可から接続許可を推論しません。

## AWS-2で求める判断

1. M/S/Wを採用・継続検討・別案比較のどこへ置くか。具体的account作成は含めない。
2. owner/authority/trust root・reviewerと安全な非秘密資料の受領方式をどう選定するか。
3. 将来の限定metadata監査の対象・API・許容出力・停止条件・期限をどう固定するか。
4. bootstrap特権の残余リスクを受容する方向か、独立した制約設計を先行するか。
5. 移行する履歴文書・policy・証拠の許可リストと非公開対応台帳の保存先をどう分けるか。

この5点は未決定です。新たな資料受領、環境調査、AWS認証、実行、権限変更、公開の承認を本書から生成しません。
