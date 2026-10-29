# OpsCue 技育展2026予選スライド 最終確認

作成日：2026年10月26日（JST）

## 成果物

- [OpsCue_GeekTen2026_Preliminary.pptx](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026/output/OpsCue_GeekTen2026_Preliminary.pptx>)
- [OpsCue_GeekTen2026_SpeakerNotes.md](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026/output/OpsCue_GeekTen2026_SpeakerNotes.md>)
- [OpsCue_GeekTen2026_Sources.md](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026/output/OpsCue_GeekTen2026_Sources.md>)
- [OpsCue_GeekTen2026_Review.md](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026/output/OpsCue_GeekTen2026_Review.md>)

## 確認結果

|項目|結果|確認範囲|
|---|---|---|
|7枚・16:9|確認済み|7枚、1280×720相当（13.3333×7.5インチ）|
|編集可能性|確認済み|全87個のネイティブ図形・テキスト。5枚目の図解・矢印・注記も編集可能。UIとキービジュアルは埋め込み画像|
|全ページの画像出力|確認済み|最終PPTXを再インポートし、7枚すべて1920×1080 PNGで再レンダリング|
|目視確認|確認済み|全7枚を個別に確認。スライド文字の切れ・意図しない重なり・画像歪みは見当たらない|
|UI可読性|確認済み・制限あり|勤務先・集合時刻・確認済み・未提出を判読可能。元画像の解像度により拡大部分にはぼけが残る|
|画像の保持|確認済み|埋め込まれた4種類のPNGは元ファイルとSHA-256一致。5個の画像オブジェクト、6枚目は同一画像を2回使用|
|文字と配色|確認済み|Noto Sans JP、ネイビー#071D3B、ブルー#0865EF、ホワイト。主要見出し33pt、本文おおむね22.5〜29.25pt、注記16.5pt以上。表紙・締めは大きく強調|
|実装状態|確認済み|単一応募＝設計・ソース実装あり／実環境での復旧未検証。一括応募＝設計中。保存画面の日時・テストデータ注記あり|
|ノート欄|確認済み|7枚すべてに対応原稿・推定秒数・発表枠・実測未実施・進行メモ・出典あり。PPTX XMLで原稿本文の一致を確認|
|180秒構成|計画値として確認済み|15/25/30/35/35/25/15秒＝180秒。原稿推定168秒、切替・間12秒。発話実測は未実施|
|PPTX構造・レイアウト|確認済み|パッケージ整合性、図形境界、見出し適合、書体ポリシーの自動検査で指摘0・警告0。最終ファイルの再インポート成功|
|既存ファイル保全|確認済み|既存リポジトリ691ファイルのSHA-256、元PowerPoint・添付画像・Git HEAD/index/config計6ファイルのSHA-256が制作前後で一致|
|機密候補ファイル|限定確認|3ファイルは内容を読まずサイズ・最終更新時刻のみ一致確認。秘密値の取得・出力なし|
|Git状態|確認済み|新規成果物フォルダを除いたstatusが制作前と一致。既存next.config.tsの変更等を保持。commit/push/ブランチ作成/設定変更なし|
|DB・AWS・外部設定|本制作から操作なし|DB接続・SQL・AWS・デプロイ・外部サービス設定変更なし。外部システム自体の状態をライブ監査した意味ではない|

## 各スライドのプレビュー

### 1. OpsCue｜募集から、現場が無事に終わるまで。
![スライド1](C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026/output/previews/slide-1.png)

### 2. 勤務前に、情報を探し直していた
![スライド2](C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026/output/previews/slide-2.png)

### 3. 一つの勤務に、情報と行動をまとめる
![スライド3](C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026/output/previews/slide-3.png)

### 4. スタッフは準備を、管理者は未確認を把握
![スライド4](C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026/output/previews/slide-4.png)

### 5. 通信が途切れたときの応募処理
![スライド5](C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026/output/previews/slide-5.png)

### 6. 勤務詳細で、集合と準備を確認
![スライド6](C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026/output/previews/slide-6.png)

### 7. 現場で働く人に、次の一手を
![スライド7](C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026/output/previews/slide-7.png)

## 残る確認事項

1. **読み上げ時間の実測**：発表者本人が切替を含めて通し読みし、原稿160〜170秒・全体180秒以内を確認する。実測値を推定値として混同しない。
2. **本番のPowerPoint・Zoom表示**：今回の画像確認はArtifact Toolレンダラー。Microsoft PowerPoint本体の表示とZoom共有先での見え方・フォント代替は未検証。Noto Sans JPは制作環境に存在するが、PPTXに書体ファイルは埋め込んでいない。
3. **保存画面の解像度**：Worker原画像は390×844。内容改変やAIによる補完はしておらず、拡大時のぼけは元画像由来で残る。重要UIは読めるよう切り出した。
4. **技術動作の未検証**：資料制作でDB接続・操作テストは行っていない。スライドの未検証・設計中表示を維持する。

## 検証方法の補足

最終化ツールはWindows環境でハードリンク公開に失敗したため、タスク専用スクリプト内で、その新規成果物1件だけを排他的コピー（既存ファイル上書き不可）へ切り替えた。全バリデーターを維持し、検証済みバイト列と完成ファイルのSHA-256一致も確認した。スキル・ランタイムのファイルは変更していない。

## 最終ファイル識別

- PPTX SHA-256: `2d6e1b48294bde131bd9d376a8a3bd62104476007295b5a8916186d12d9587a1`
- PPTX サイズ: 2,281,292 bytes
- 自動検証詳細は専用作業フォルダ `.build/final-validation.json`、ノート・画像検査は `.build/content-validation.json`、保全比較は `.build/preservation-check.json` に保存。
