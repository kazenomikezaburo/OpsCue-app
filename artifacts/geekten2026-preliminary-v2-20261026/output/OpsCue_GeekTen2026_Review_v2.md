# OpsCue 技育展2026予選スライド v2 制作・確認レポート

作成日：2026年10月26日（JST）。承認済みv1と制作レポートを基準に、発表資料のみを改善。

## 成果物

- [OpsCue_GeekTen2026_Preliminary_v2.pptx](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-v2-20261026/output/OpsCue_GeekTen2026_Preliminary_v2.pptx>)
- [OpsCue_GeekTen2026_SpeakerNotes_v2.md](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-v2-20261026/output/OpsCue_GeekTen2026_SpeakerNotes_v2.md>)
- [OpsCue_GeekTen2026_Review_v2.md](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-v2-20261026/output/OpsCue_GeekTen2026_Review_v2.md>)

## 改善内容

|枚|改善点|審査で伝える軸|
|---|---|---|
|1|問いを大きく配置。ネイビー背景、シアンの線、OpsCue表記とキャッチコピーを7枚目と統一|作品の価値：現場体験|
|2|情報が分散する課題と、スタッフ・管理者それぞれの負担を大小のカードで整理|作品の価値：課題の具体性|
|3|ネイビー背景に業務フロー。前日確認を強調し、Worker/Adminを対比|作品の価値：一つの勤務を軸にした設計|
|4|実画面の全体像を残し、次の勤務・前日確認の未提出状態を拡大。二つは別勤務と注記|完成度：役割別UI|
|5|結果不明という問題、同じキーでの再試行、記録済み結果の再利用を4段階で図解。実装と未検証を別表示|技術レベル：冪等性と復旧を考えた設計|
|6|勤務詳細の全体像から、勤務先・住所、集合時刻、仕事内容、前日確認へ視線を誘導|完成度：勤務前の情報設計|
|7|冒頭の問いを回収し、目指す体験を大きく提示。表紙とブランド表現を統一|作品の価値・可能性|

## 確認結果

|項目|結果・範囲|
|---|---|
|枚数・画面比率|7枚、16:9（1280×720相当）|
|編集可能性|130個のネイティブ図形・テキスト。図解、矢印、カード、注記も編集可能。10個の画像オブジェクトは独立して配置・トリミング可能|
|レンダリング|完成PPTXを再インポートし、7枚を1920×1080 PNGへ再出力|
|目視|全7枚を個別確認。6枚目の切り出し上端を修正。スライド文字の切れ、意図しない重なり、画像の縦横歪みは見当たらない|
|UI可読性|拡大した勤務情報・確認状態は判読可能。小さな全体像は文脈用。元画像の低解像度によるぼけは残る|
|配色・文字|ネイビー#071D3B、ブルー#0865EF、ホワイトを主に使用。Noto Sans JPで統一。見出し30〜32.25pt、主要本文・役割説明は18.75〜36pt程度。注記は15〜15.75pt以上。表紙・締めはさらに大きく強調|
|余白|基本左右56px。カード間隔、画面注記の領域を確保。図形境界・見出し適合の自動検査も指摘0・警告0|
|画像の真正性|使用した元PNG4種類はPPTX埋め込みデータとSHA-256一致。UIの文字・状態・数値を変更していない。トリミング後の縦横比をXMLでも確認|
|原稿とノート|全7枚のノート欄に原稿・推定秒数・発表枠・実測未実施・進行メモ・出典を格納。原稿本文とPPTX XMLの一致を確認|
|時間|発表枠15/25/30/35/35/25/15秒＝180秒。原稿推定14/23/28/33/33/23/14秒＝168秒、切替・間12秒。実測は未実施|
|構造・書体|PPTXパッケージ、レイアウト、書体ポリシーの検査を通過。最終ファイルの再インポート成功。Microsoft PowerPoint本体による検証とは区別|
|既存ファイル保全|開始時の既存リポジトリ730ファイル、元資料・Git HEAD/index/config等5ファイルのSHA-256が一致。機密候補3ファイルは内容を読まずサイズ・更新時刻の一致のみ確認|
|Git・アプリ|新規v2出力フォルダを除くGit status、HEADが開始時と一致。既存v1とアプリコードを保持|
|DB・外部サービス|DB、AWS、Supabase、Vercelその他のアプリ外部環境への接続・操作・設定変更なし。外部環境の状態をライブ監査した意味ではない|

## 実装状態と表現の境界

- 単一応募：承認済みの静的調査に基づく設計・ソース実装の説明。同じキーで再試行し、結果が記録済みなら再利用する。実環境での復旧動作は未検証。
- ブラウザ再読込・再ログインをまたぐキー保持や、必ず復旧できることは主張しない。DBへの適用や動作をv2で再確認していない。
- 同一案件1〜10シフト一括応募：設計中。全件成功または新規登録0件という設計を単一応募の実装と混同しない。
- UIは2026年10月20日保存のテストデータ。現在の動作確認済み画面として扱わない。4枚目のWorker/Adminは別勤務の表示例で、同期や操作前後の証拠ではない。
- 6枚目は同じ保存画面を複数回トリミングした静止画デモ。準備情報は画面上の仕事内容までとし、持ち物・地図・チェックリストを追加していない。
- 3枚目は目指す業務フロー、7枚目は目指す価値。全工程の完成や定量効果、導入実績は主張しない。
- 表紙の端末画像は既存コンセプトビジュアル。実環境の証拠ではない。図形の枠、拡大説明、番号はプレゼン側の注釈でありアプリのUIではない。

## 原稿と進行

原稿902字。168秒は文字数と説明の間を考慮した編集上の推定であり、音読の実測ではない。スライドは手動切替で、アニメーションや操作デモに依存しない。
発表中の目安：0:15で課題、0:40で解決策、1:10で役割別UI、1:45で技術、2:20で勤務詳細、2:45で締め。180秒内に終えるため、本人の通し読みで実測値を確認する。

## 使用素材・基準資料

- 基準PowerPoint：[OpsCue_GeekTen2026_Preliminary.pptx](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026/output/OpsCue_GeekTen2026_Preliminary.pptx>)
- 基準レポート：[OpsCue_GeekTen2026_Review.md](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026/output/OpsCue_GeekTen2026_Review.md>)
- 技術・課題の出典と静的調査の境界：[OpsCue_GeekTen2026_Sources.md](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026/output/OpsCue_GeekTen2026_Sources.md>)
- 本大会の日時・条件はユーザー提示条件を継承。外部サイトの独立照合は実施していない。

|使用箇所|原画像|寸法|切り出し x,y,w,h（px）|
|---|---|---|---|
|1|[95fd3106-53b5-4d06-b849-cbea5271f02c.png](<C:/Users/user/Pictures/95fd3106-53b5-4d06-b849-cbea5271f02c.png>)|1734×907|720,20,1014,860|
|4 Worker|[home.png](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui-screenshots/worker/home.png>)|390×844|全体＋20,303,350,203|
|4 Admin|[shifts-pre-shift-detail.png](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui-screenshots/admin/shifts-pre-shift-detail.png>)|1440×905|全体＋696,306,345,90|
|6|[assignments-detail.png](<C:/Users/user/OpsCue/OpsCue-team-main/docs/ui-screenshots/worker/assignments-detail.png>)|390×844|全体＋勤務先35,365,320,50／時刻35,433,320,49／仕事内容35,517,320,29／確認35,600,320,45|

元画像は上書き・画素編集していない。PowerPointの画像トリミングで表示範囲を指定し、縦横比を維持して配置。AI生成・補完・新しい画面撮影・録画は使用していない。

## 各スライドのプレビュー

### 1. OpsCue｜募集から、現場が無事に終わるまで。
![スライド1](C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-v2-20261026/output/previews/slide-1.png)

### 2. 勤務前に、情報を探し直していた
![スライド2](C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-v2-20261026/output/previews/slide-2.png)

### 3. 一つの勤務に、情報と行動をまとめる
![スライド3](C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-v2-20261026/output/previews/slide-3.png)

### 4. 立場に合わせて、必要な情報が見える
![スライド4](C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-v2-20261026/output/previews/slide-4.png)

### 5. 応募できたか分からない。その再試行を安全に
![スライド5](C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-v2-20261026/output/previews/slide-5.png)

### 6. 勤務前の確認が、この画面にまとまる
![スライド6](C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-v2-20261026/output/previews/slide-6.png)

### 7. 「どこだっけ」を減らし、次の行動へ
![スライド7](C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-v2-20261026/output/previews/slide-7.png)

## 残る確認事項

1. 発表者本人による音読・切替の実測。原稿160〜170秒、全体180秒以内を確認する。
2. Microsoft PowerPoint本体とZoom共有先の表示は未検証。Noto Sans JPのフォントファイルは埋め込んでいないため、本番環境で確認する。
3. Worker保存画面は390×844px。拡大部分には元画像由来のぼけが残る。画面の真正性を保つため補完していない。
4. 単一応募の復旧は実環境未検証、一括応募は設計中という注記を本番でも保持する。

## 検証ファイル

Windowsのハードリンク制約により、最終化スクリプト内で今回の新規PPTXだけを排他的コピーへ切り替えた。検証を省略せず、検証済みファイルと最終ファイルのSHA-256一致を確認。スキルやランタイムは変更していない。
- [final-validation.json](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-v2-20261026/.build/final-validation.json>)
- [content-validation.json](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-v2-20261026/.build/content-validation.json>)
- [preservation-check.json](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-v2-20261026/.build/preservation-check.json>)
- v2 PPTX SHA-256: `b4c451061f634063b57ece0083b77b16219bd5ecc18518926c74af5083dd2805`
- v1 PPTX SHA-256（変更なし）: `2d6e1b48294bde131bd9d376a8a3bd62104476007295b5a8916186d12d9587a1`
- v2 PPTXサイズ: 3,052,983 bytes
