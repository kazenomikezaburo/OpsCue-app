# OpsCue デモ録画 準備・安全確認レポート

2026年10月28日（JST）。FFmpeg取得限定承認に基づく作業。本番録画は未実施。

## 結論

FFmpeg取得・参照・実行確認は完了。公開デモとローカル出力の一致を確認できず、安全確認はBLOCKED。公開版のJavaScriptは実行せず、ブラウザ起動・操作・録画を停止した。公開ページが危険だと判定したものではない。

## 取得結果

- Playwright: 1.62.1（既存同梱パッケージ）
- 対応FFmpegリビジョン: 1011。既存Playwrightの browsers.json に記載された版。
- 実行時バージョン: `ffmpeg version n7.0.1-playwright-build-1011 Copyright (c) 2000-2024 the FFmpeg developers`
- 取得元: [Playwright公式配布ZIP](https://cdn.playwright.dev/dbazure/download/playwright/builds/ffmpeg/1011/ffmpeg-win64.zip)
- 保存先: [ffmpeg-win64.exe](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-demo-video-20261028/playwright-cache/ffmpeg-1011/ffmpeg-win64.exe>)
- 実行ファイルサイズ: 3,490,816 bytes
- SHA-256: `5b8f3f59ba61685828939ff3c833109748adbdea2fff4b4ae570c9fc0fc1ff4d`
- ライセンス: 同梱の COPYING.LGPLv2.1 を保持。
- 既存Playwrightの実行ファイル解決 `executablePathOrDie` がこの保存先を返し、FFmpegの `-version` が終了コード0で成功。
- 動画エンコード試験・ブラウザ経由の録画試験は未実施。参照・起動成功を録画成功とは扱わない。

公式CLIのdry-runはFFmpegとWinlddを提示したため、そのinstallコマンドは実行しなかった。変更していない既存Playwrightの公式インストーラー内部処理にFFmpegだけを渡した。gc:false と PLAYWRIGHT_SKIP_BROWSER_GC=1 で既存キャッシュ整理を無効化。PLAYWRIGHT_BROWSERS_PATH、TEMP、TMPは当該プロセスだけ指定フォルダへ向けた。永続的な環境設定変更はない。

最初の制限環境では公式配布先のDNS解決に失敗。同一操作のネットワーク許可付き再実行で、最初の公式CDNから取得完了。ブラウザ・Winldd・MP4用ツールは取得していない。

整合性の範囲：公式HTTPS経由の取得・展開完了、インストール完了マーカー、実行成功、保存後SHA-256を確認。配布者が別途公開したチェックサムや署名との照合は未実施であり、ハッシュ一致を独立した真正性証明とは表現しない。

## 公開デモとの照合

- 対象: https://ops-cue-geekten-demo.vercel.app/admin/
- GET 1件のみ。200、35,422 bytes、HTML。リダイレクトなし、Set-Cookieなし。
- 公開HTML SHA-256: `b51d5f74ffe1353ad396722df68da502590fc4669f329aeb37112c1dab96d1c9`
- ローカルout SHA-256: `d45624f0ca128a317112da270500da26a9f009d4b7b8791e995e7706d1cbe549`
- ローカルVercel静的出力 SHA-256: `d45624f0ca128a317112da270500da26a9f009d4b7b8791e995e7706d1cbe549`
- どちらともバイト一致しない。別ビルド・配信時変換・注入等の原因までは未特定。
- 応答のContent-Security-Policyヘッダーは未設定。HTML内のポリシーや公開スクリプトの動作は未確認。
- この不一致を検知した時点で、Workerページ・詳細ページ・JS等の追加取得およびブラウザ実行に進まなかった。

## 8項目の確認結果

|項目|判定・範囲|
|---|---|
|1. 取得元と整合性|公式のPlaywright配布機構、指定リビジョン、保存後ハッシュを記録。独立した公開チェックサム照合は未実施|
|2. Playwrightから利用|参照解決・FFmpeg起動は成功。動画保存そのものは未試験|
|3. ローカルと公開の差異|Admin HTMLの不一致を検出。公開版の構成・由来を確定できずBLOCKED|
|4. Worker→勤務詳細|ローカルソースに /worker と次の勤務の詳細リンク、詳細ビューが存在。公開版の実遷移は未確認|
|5. 前日確認|ローカル初期データのTEST Worker A、展示会勤務は confirmed:false。未確認状態をそのまま見せる想定。送信・確認済みへの変更はしない|
|6. 外部API等|今回の公開アクセスは指定サイトのHTML GETのみ。DB/Auth/API/通知は呼んでいない。公開ページ実行時の通信は未検証|
|7. 書き込み範囲|今回の作業ファイルは指定新規フォルダ内。専用Playwrightキャッシュ・.links・一時領域・ログ・調査スクリプト・レポート。既存ソース、アプリ依存、既存ブラウザキャッシュの変更操作なし|
|8. 映り込み|ローカルはTEST Worker・架空市デモ町などの合成データと固定基準日時を確認。公開版の実画面は未確認のため、映り込みなしとは未判定|

## ソースに基づく撮影候補（まだ実行不可）

対象を確認できた後、Workerホーム → 「次の勤務」内の「勤務詳細を見る」 → 勤務先・集合時刻・仕事内容 → 前日確認の既存状態、の順で表示する。

ローカルの既存配置候補は `/worker/assignments/demo-assignment-reception-1/`。基準日時は2026/10/30 10:00 JST、勤務は10/31、勤務先はサンプル展示ホール。実際のリンクと画面内容を別途確認してから採用する。過去の実アプリ保存画面の確認済み状態は再現しない。

予定仕様：1280×720、約18秒、音声なし、ページ領域だけをWebM/VP8で保存。既存ChromeとPlaywrightを使用し、キャッシュパスは今回の専用フォルダをプロセス限定で設定する。カーソル描画・不要な操作注釈の見え方は未試験。

録画承認後の書き込み予定は本フォルダ内の専用Chromeプロファイル／一時ファイル、WebM、検証レポートに限定。既存Chromeプロファイルには接続しない。動画名は `OpsCue_Worker_Demo.webm` を候補とし、同名があれば上書きしない。MP4は今回取得した最小FFmpegでは作れず、追加取得も行っていない。

公開版を採用する場合、許可する通信は確認済みデモoriginの画面HTML・Next.js静的リソース・静的遷移payloadのGETのみ。別origin、認証、API、通知、送信系メソッド、Service Workerは拒否する計画。単に同一originであることだけでは静的資産と判定しない。

## 停止理由と代替案

現時点では録画可能とは判定しない。本番録画の承認はまだ求めない。

1. 公開版に対応するローカル出力が別にある場合は、その場所を指定してもらい、再照合する。
2. 既存のローカル静的デモを使う場合は、プレビューサーバーの起動を別途承認してもらう。既存safe-runは `.tmp` を作成し得るため、その書き込み範囲も説明してから起動する。本体OpsCueは起動しない。

対象の安全確認が完了した後、最終URL・許可通信・具体的操作・保存先を提示し、本番録画の承認を改めて求める。

## 証跡

- [ffmpeg-preparation.json](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-demo-video-20261028/ffmpeg-preparation.json>)
- [public-static-audit.json](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-demo-video-20261028/public-static-audit.json>)
- [ffmpeg-download-retry.log](<C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-demo-video-20261028/ffmpeg-download-retry.log>)
- [data.ts](<C:/Users/user/OpsCue-Geekten-Demo/site/lib/demo/data.ts>)
- [demo-provider.tsx](<C:/Users/user/OpsCue-Geekten-Demo/site/components/demo/demo-provider.tsx>)
- [WorkerHomeView.tsx](<C:/Users/user/OpsCue-Geekten-Demo/site/components/demo/views/WorkerHomeView.tsx>)
- [AssignmentDetailView.tsx](<C:/Users/user/OpsCue-Geekten-Demo/site/components/demo/views/AssignmentDetailView.tsx>)

本番録画、ブラウザ起動、本体OpsCue操作、DB/Supabase/Auth接続、業務状態変更、Git操作、既存ソース・設定変更、デプロイ、PowerPoint編集は実施していない。秘密ファイルや認証情報は取得・出力していない。
