# OpsCue 技育展2026予選スライド 出典・表現の境界

作成日：2026年10月26日（JST）。Phase A承認内容をもとに、Phase Bで発表資料を新規制作。

## 発表条件

2026年10月31日（土）、Zoom画面共有、180秒、参加者相互投票と審査員審査、作品の価値・完成度・技術レベルという評価軸は、ユーザーの提示内容を制作条件として採用した。公式サイトの独立照合は実施していない。

## スライド別の出典

|枚|内容|出典|表現上の境界|
|---|---|---|---|
|1|OpsCue｜募集から、現場が無事に終わるまで。|[OpsCue_Master_Specification_v1.3_2026-10-23.md](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui_仕様書/OpsCue_Master_Specification_v1.3_2026-10-23.md>)<br>[95fd3106-53b5-4d06-b849-cbea5271f02c.png](<C:/Users/user/Pictures/95fd3106-53b5-4d06-b849-cbea5271f02c.png>)|表紙の端末画像は提供されたコンセプトビジュアル。実装・動作確認の証拠ではない。|
|2|勤務前に、情報を探し直していた|[OpsCue_Master_Specification_v1.3_2026-10-23.md](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui_仕様書/OpsCue_Master_Specification_v1.3_2026-10-23.md>)|Master Specification A.1/A.2。現場経験・会話に基づく課題仮説。正式な導入依頼・導入決定・定量効果を示さない。|
|3|一つの勤務に、情報と行動をまとめる|[OpsCue_Master_Specification_v1.3_2026-10-23.md](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui_仕様書/OpsCue_Master_Specification_v1.3_2026-10-23.md>)|図は目指す業務フロー。全工程の実装・連携・動作検証済みを示す図ではない。|
|4|スタッフは準備を、管理者は未確認を把握|[home.png](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui-screenshots/worker/home.png>)<br>[shifts-pre-shift-detail.png](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui-screenshots/admin/shifts-pre-shift-detail.png>)<br>[README.md](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui-screenshots/README.md>)|2026-10-20のテストデータによる保存画面。WorkerはTEST Worker A、AdminはTEST Worker Bの別勤務。現在の動作確認や同一勤務の同期を示さない。原画像からネイティブ画像トリミングのみ。|
|5|通信が途切れたときの応募処理|[worker-shift-applications.ts](<C:/Users/user/OpsCue/OpsCue-team-main/app/actions/worker-shift-applications.ts>)<br>[worker-recruitment-application-controls.tsx](<C:/Users/user/OpsCue/OpsCue-team-main/components/worker/recruitment/worker-recruitment-application-controls.tsx>)<br>[20260926175812_ocv1_worker_application_commands.sql](<C:/Users/user/OpsCue/OpsCue-team-main/supabase/migrations/20260926175812_ocv1_worker_application_commands.sql>)<br>[OpsCue_Backend_%E9%96%8B%E7%99%BA%E6%89%8B%E9%A0%86%E6%9B%B8_20261023_%E6%94%B9%E8%A8%82%E7%89%88.md](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui_仕様書/OpsCue_Backend_%E9%96%8B%E7%99%BA%E6%89%8B%E9%A0%86%E6%9B%B8_20261023_%E6%94%B9%E8%A8%82%E7%89%88.md>)|単一応募のコードはunknownを返し、retryable時にコンポーネント内のキーを保持する。SQLは要求内容を検査し、同じactor/keyの保存結果を返す。成功・キー保持の実環境検証は未実施。画面再読込や再ログインをまたぐキー永続化を保証しない。応募受付は採用・配置確定と別。一括応募の1〜10件、原子性、結果照会は設計段階。|
|6|勤務詳細で、集合と準備を確認|[assignments-detail.png](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui-screenshots/worker/assignments-detail.png>)<br>[README.md](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui-screenshots/README.md>)|静止画デモ。2026-10-20時点のテストデータ。左右は同一保存画像の別領域で、遷移や更新の実行証拠ではない。映像は使用しない。|
|7|現場で働く人に、次の一手を|[OpsCue_Master_Specification_v1.3_2026-10-23.md](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui_仕様書/OpsCue_Master_Specification_v1.3_2026-10-23.md>)<br>[OpsCue_Backend_%E9%96%8B%E7%99%BA%E6%89%8B%E9%A0%86%E6%9B%B8_20261023_%E6%94%B9%E8%A8%82%E7%89%88.md](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui_仕様書/OpsCue_Backend_%E9%96%8B%E7%99%BA%E6%89%8B%E9%A0%86%E6%9B%B8_20261023_%E6%94%B9%E8%A8%82%E7%89%88.md>)|今後の提案・展望。導入実績や現場検証済みの効果は主張しない。|

## 画像の使用方法

画像ファイル自体は加工・上書きしていない。PPTXに元画像を埋め込み、PowerPointの画像トリミング情報で表示領域を指定した。切り出し後の領域に対して縦横同率で拡大し、UI内の文字・数値・状態は書き換えていない。

|スライド|元画像|元画像寸法|切り出し（x,y,width,height、px）|表示枠（width,height、1280×720基準）|
|---|---|---|---|---|
|1|提供キービジュアル|1734×907|720,20,1014,860|674×571.637|
|4・Worker|worker/home.png|390×844|20,303,350,203|540×313.2|
|4・Admin|admin/shifts-pre-shift-detail.png|1440×905|696,306,345,100|540×156.522|
|6・集合準備|worker/assignments-detail.png|390×844|20,277,350,286|540×441.257|
|6・前日確認|worker/assignments-detail.png|390×844|20,587,350,180|540×277.714|

- 4・6枚目の画像は2026年10月20日保存、テストデータの表示である。現在の動作確認済みとは扱わない。
- 4枚目のWorkerとAdminは別のスタッフ・別の勤務。同期や操作前後の証拠ではない。
- 6枚目の左右は同一保存画像の別領域。静止画デモであり、操作録画ではない。
- 表紙の端末画像はコンセプトビジュアル。実機画面や運用件数の証拠には使わない。
- 添付の横長ロゴ画像は使用せず、OpsCue表記を編集可能な文字として配置した。

## 技術説明の根拠と未検証事項

- 単一応募のソース：通信エラーをunknown/retryableとして返す。UIはretryableの場合に同じ操作キーを保持する。SQLは利用者とキーで要求・結果を記録し、同じ要求の保存結果を再利用する。
- 5枚目はこの設計・ソース実装を説明する。実環境での復旧成功、DBへの適用、同時実行、セキュリティ検証の完了を主張しない。
- コンポーネント内でのキー保持と、ブラウザ再読込・再ログインをまたぐ永続的な復旧は別。後者を確認したとは述べない。
- 一括応募の1〜10件、全件成功または新規0件、結果照会・再送は設計中。単一応募を繰り返して原子的一括処理を実装済みとみなさない。
- 応募受付と、採用・配置確定は別。
- Auth/RLS等はPhase Aでソースを静的に確認したが、今回の35秒の技術スライドは通信結果不明への対応に絞っている。

## 原稿と時間

原稿893字。読み上げ推定168秒、切替・間12秒、発表枠合計180秒。実測は未実施。推定値は編集上の配分であり、通し読み・Zoom共有の実測を代替しない。

## 参照ファイルのSHA-256

- [OpsCue_Master_Specification_v1.3_2026-10-23.md](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui_仕様書/OpsCue_Master_Specification_v1.3_2026-10-23.md>)
  - SHA-256: `b480f2539f880e74ce9a8e921a56f22614dc3274a45d6cc6dd3baab7a4aa0286`
- [95fd3106-53b5-4d06-b849-cbea5271f02c.png](<C:/Users/user/Pictures/95fd3106-53b5-4d06-b849-cbea5271f02c.png>)
  - SHA-256: `cdb2fb9ea49ce7d449431484620e5375c3df1332fcdec7a392c69d33d1d47446`
- [home.png](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui-screenshots/worker/home.png>)
  - SHA-256: `5ecf3acd2a7d2ee43a814a3b9a29604b9debc04f8156fe42e44848cb5ec0b692`
- [shifts-pre-shift-detail.png](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui-screenshots/admin/shifts-pre-shift-detail.png>)
  - SHA-256: `4aac8aae29603685d23977ce1b2a7cb094cc1e56ee5c11ccdf65fd4fd610b1c9`
- [README.md](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui-screenshots/README.md>)
  - SHA-256: `9da9e8dda4211392fea2e2a86a86cedbacd73ef1bc5d413c156eecf0902702a2`
- [worker-shift-applications.ts](<C:/Users/user/OpsCue/OpsCue-team-main/app/actions/worker-shift-applications.ts>)
  - SHA-256: `9b7bfb2df3c1e0021ebd41aebeb5f4084809ad2dfea009a41fbd624d17fe8307`
- [worker-recruitment-application-controls.tsx](<C:/Users/user/OpsCue/OpsCue-team-main/components/worker/recruitment/worker-recruitment-application-controls.tsx>)
  - SHA-256: `640dc3c85ba924ef0bd9cd725dcdc648508f6f7af5f52a96c621854f37baa801`
- [20260926175812_ocv1_worker_application_commands.sql](<C:/Users/user/OpsCue/OpsCue-team-main/supabase/migrations/20260926175812_ocv1_worker_application_commands.sql>)
  - SHA-256: `274d9dc117cd60663d960356c5ddc4605ea5124baed84f87c80a06778c774893`
- [OpsCue_Backend_%E9%96%8B%E7%99%BA%E6%89%8B%E9%A0%86%E6%9B%B8_20261023_%E6%94%B9%E8%A8%82%E7%89%88.md](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui_仕様書/OpsCue_Backend_%E9%96%8B%E7%99%BA%E6%89%8B%E9%A0%86%E6%9B%B8_20261023_%E6%94%B9%E8%A8%82%E7%89%88.md>)
  - SHA-256: `0b8374af448669a7a7bc4e33f00ce93a86a4d31888de6c7a50047a2d7eeecb75`
- [assignments-detail.png](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui-screenshots/worker/assignments-detail.png>)
  - SHA-256: `945dfa3aac6d321162e9d70db5dd2e42d5abecba87c94470d45af9d97f60af98`
- [OpsCue_8AE8B2B1E49C93E7B9BBE3B983E3A483%89.pptx](<C:/Users/user/Documents/OpsCue_8AE8B2B1E49C93E7B9BBE3B983E3A483%89.pptx>)
  - SHA-256: `b10fb35be622c8bf6a0b987d52bff0263e6702d0ce8c43a392cb8cd840990c29`
