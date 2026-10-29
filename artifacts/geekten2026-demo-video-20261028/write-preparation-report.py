from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).parent
demo=Path('C:/Users/user/OpsCue-Geekten-Demo/site')
modules=Path('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
exe=root/'playwright-cache/ffmpeg-1011/ffmpeg-win64.exe'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def link(p,label=None):return f'[{label or p.name}](<{p.as_posix()}>)'
version=subprocess.check_output([str(exe),'-version'],text=True).splitlines()[0]
audit=json.loads((root/'public-static-audit.json').read_text(encoding='utf-8'))
metadata={'dateJST':'2026-10-28','playwrightVersion':json.loads((modules/'playwright/package.json').read_text())['version'],'ffmpegRevision':'1011','ffmpegVersion':version,'sourceURL':'https://cdn.playwright.dev/dbazure/download/playwright/builds/ffmpeg/1011/ffmpeg-win64.zip','method':'Unmodified bundled Playwright registry.install([findExecutable("ffmpeg")], {gc:false}); isolated PLAYWRIGHT_BROWSERS_PATH; existing CLI dry run would also download Winldd, so CLI install was not executed.','binaryPath':str(exe),'binarySha256':sha(exe),'binaryBytes':exe.stat().st_size,'files':[{'name':p.name,'bytes':p.stat().st_size,'sha256':sha(p)} for p in exe.parent.iterdir() if p.is_file()],'referenceCheck':'Existing Playwright executablePathOrDie("javascript") resolves this binary; ffmpeg -version exit code 0.','recordingTest':'NOT_RUN','mp4':'Not supported by this minimal recording build; no conversion tools acquired.','integrityBoundary':'Official HTTPS downloader completed and installation marker exists. Local SHA-256 recorded; no independent published checksum or signature was obtained.','publicAudit':audit,'localAdminOutputs':{name:{'exists':p.is_file(),'sha256':sha(p) if p.is_file() else None,'bytes':p.stat().st_size if p.is_file() else None} for name,p in [('out',demo/'out/admin/index.html'),('vercelStatic',demo/'.vercel/output/static/admin/index.html')]}}
(root/'ffmpeg-preparation.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
report=f'''# OpsCue デモ録画 準備・安全確認レポート

2026年10月28日（JST）。FFmpeg取得限定承認に基づく作業。本番録画は未実施。

## 結論

FFmpeg取得・参照・実行確認は完了。公開デモとローカル出力の一致を確認できず、安全確認はBLOCKED。公開版のJavaScriptは実行せず、ブラウザ起動・操作・録画を停止した。公開ページが危険だと判定したものではない。

## 取得結果

- Playwright: {metadata['playwrightVersion']}（既存同梱パッケージ）
- 対応FFmpegリビジョン: 1011。既存Playwrightの browsers.json に記載された版。
- 実行時バージョン: `{version}`
- 取得元: [Playwright公式配布ZIP]({metadata['sourceURL']})
- 保存先: {link(exe)}
- 実行ファイルサイズ: {exe.stat().st_size:,} bytes
- SHA-256: `{sha(exe)}`
- ライセンス: 同梱の COPYING.LGPLv2.1 を保持。
- 既存Playwrightの実行ファイル解決 `executablePathOrDie` がこの保存先を返し、FFmpegの `-version` が終了コード0で成功。
- 動画エンコード試験・ブラウザ経由の録画試験は未実施。参照・起動成功を録画成功とは扱わない。

公式CLIのdry-runはFFmpegとWinlddを提示したため、そのinstallコマンドは実行しなかった。変更していない既存Playwrightの公式インストーラー内部処理にFFmpegだけを渡した。gc:false と PLAYWRIGHT_SKIP_BROWSER_GC=1 で既存キャッシュ整理を無効化。PLAYWRIGHT_BROWSERS_PATH、TEMP、TMPは当該プロセスだけ指定フォルダへ向けた。永続的な環境設定変更はない。

最初の制限環境では公式配布先のDNS解決に失敗。同一操作のネットワーク許可付き再実行で、最初の公式CDNから取得完了。ブラウザ・Winldd・MP4用ツールは取得していない。

整合性の範囲：公式HTTPS経由の取得・展開完了、インストール完了マーカー、実行成功、保存後SHA-256を確認。配布者が別途公開したチェックサムや署名との照合は未実施であり、ハッシュ一致を独立した真正性証明とは表現しない。

## 公開デモとの照合

- 対象: https://ops-cue-geekten-demo.vercel.app/admin/
- GET 1件のみ。200、35,422 bytes、HTML。リダイレクトなし、Set-Cookieなし。
- 公開HTML SHA-256: `{audit['requests'][0]['sha256']}`
- ローカルout SHA-256: `{metadata['localAdminOutputs']['out']['sha256']}`
- ローカルVercel静的出力 SHA-256: `{metadata['localAdminOutputs']['vercelStatic']['sha256']}`
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

- {link(root/'ffmpeg-preparation.json')}
- {link(root/'public-static-audit.json')}
- {link(root/'ffmpeg-download-retry.log')}
- {link(demo/'lib/demo/data.ts')}
- {link(demo/'components/demo/demo-provider.tsx')}
- {link(demo/'components/demo/views/WorkerHomeView.tsx')}
- {link(demo/'components/demo/views/AssignmentDetailView.tsx')}

本番録画、ブラウザ起動、本体OpsCue操作、DB/Supabase/Auth接続、業務状態変更、Git操作、既存ソース・設定変更、デプロイ、PowerPoint編集は実施していない。秘密ファイルや認証情報は取得・出力していない。
'''
(root/'OpsCue_Demo_Preparation_Report.md').write_text(report,encoding='utf-8')
print(json.dumps({'report':str(root/'OpsCue_Demo_Preparation_Report.md'),'ffmpegSha256':sha(exe),'recordingReady':False,'publicStaticMatch':False},ensure_ascii=False))
