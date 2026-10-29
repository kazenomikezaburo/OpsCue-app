import pathlib, json, hashlib, subprocess, zipfile, xml.etree.ElementTree as E
from PIL import Image

root = pathlib.Path('C:/Users/user/OpsCue/OpsCue-team-main')
base = root/'artifacts/geekten2026-preliminary-20261026'
out = base/'output'
data = json.loads((base/'.build/content.json').read_text(encoding='utf-8'))
baseline = json.loads((base/'.build/baseline.json').read_text(encoding='utf-8'))
validation = json.loads((base/'.build/final-validation.json').read_text(encoding='utf-8'))
content = json.loads((base/'.build/content-validation.json').read_text(encoding='utf-8'))
def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def link(p):
    p=pathlib.Path(p)
    return f'[{p.name}](<{p.as_posix()}>)'

changed=[]
for rel, expected in baseline['files'].items():
    p=root/rel
    if not p.is_file() or sha(p)!=expected: changed.append(rel)
extra_changed=[p for p,h in baseline['external'].items() if not pathlib.Path(p).is_file() or sha(p)!=h]
metadata_changed=[]
for rel, expected in baseline['metadataOnly'].items():
    p=root/rel
    if not p.is_file() or [p.stat().st_size,p.stat().st_mtime_ns]!=expected: metadata_changed.append(rel)
status=subprocess.check_output(['git','--no-optional-locks','status','--porcelain=v1','-uall'],cwd=root).decode()
filtered=''.join(line+'\n' for line in status.splitlines() if not line.startswith('?? artifacts/geekten2026-preliminary-20261026/'))
preservation={'repositoryFilesChecked':len(baseline['files']),'changed':changed,'externalAndGitChecked':len(baseline['external']),'externalAndGitChanged':extra_changed,'metadataOnlyChecked':len(baseline['metadataOnly']),'metadataChanged':metadata_changed,'gitStatusExcludingNewOutputUnchanged':filtered==baseline['status']}
assert not changed and not extra_changed and not metadata_changed and preservation['gitStatusExcludingNewOutputUnchanged'], preservation
(base/'.build/preservation-check.json').write_text(json.dumps(preservation,ensure_ascii=False,indent=2),encoding='utf-8')

notes_target=out/'OpsCue_GeekTen2026_SpeakerNotes.md'
assert not notes_target.exists()
(base/'OpsCue_GeekTen2026_SpeakerNotes.md').rename(notes_target)

sources=['# OpsCue 技育展2026予選スライド 出典・表現の境界','','作成日：2026年10月26日（JST）。Phase A承認内容をもとに、Phase Bで発表資料を新規制作。','','## 発表条件','','2026年10月31日（土）、Zoom画面共有、180秒、参加者相互投票と審査員審査、作品の価値・完成度・技術レベルという評価軸は、ユーザーの提示内容を制作条件として採用した。公式サイトの独立照合は実施していない。','','## スライド別の出典','','|枚|内容|出典|表現上の境界|','|---|---|---|---|']
for i,s in enumerate(data['slides'],1):
    sources.append(f"|{i}|{s['title']}|{'<br>'.join(link(p) for p in s['sources'])}|{s['note']}|")
sources += ['','## 画像の使用方法','','画像ファイル自体は加工・上書きしていない。PPTXに元画像を埋め込み、PowerPointの画像トリミング情報で表示領域を指定した。切り出し後の領域に対して縦横同率で拡大し、UI内の文字・数値・状態は書き換えていない。','',
'|スライド|元画像|元画像寸法|切り出し（x,y,width,height、px）|表示枠（width,height、1280×720基準）|',
'|---|---|---|---|---|',
'|1|提供キービジュアル|1734×907|720,20,1014,860|674×571.637|',
'|4・Worker|worker/home.png|390×844|20,303,350,203|540×313.2|',
'|4・Admin|admin/shifts-pre-shift-detail.png|1440×905|696,306,345,100|540×156.522|',
'|6・集合準備|worker/assignments-detail.png|390×844|20,277,350,286|540×441.257|',
'|6・前日確認|worker/assignments-detail.png|390×844|20,587,350,180|540×277.714|',
'','- 4・6枚目の画像は2026年10月20日保存、テストデータの表示である。現在の動作確認済みとは扱わない。',
'- 4枚目のWorkerとAdminは別のスタッフ・別の勤務。同期や操作前後の証拠ではない。',
'- 6枚目の左右は同一保存画像の別領域。静止画デモであり、操作録画ではない。',
'- 表紙の端末画像はコンセプトビジュアル。実機画面や運用件数の証拠には使わない。',
'- 添付の横長ロゴ画像は使用せず、OpsCue表記を編集可能な文字として配置した。',
'','## 技術説明の根拠と未検証事項','',
'- 単一応募のソース：通信エラーをunknown/retryableとして返す。UIはretryableの場合に同じ操作キーを保持する。SQLは利用者とキーで要求・結果を記録し、同じ要求の保存結果を再利用する。',
'- 5枚目はこの設計・ソース実装を説明する。実環境での復旧成功、DBへの適用、同時実行、セキュリティ検証の完了を主張しない。',
'- コンポーネント内でのキー保持と、ブラウザ再読込・再ログインをまたぐ永続的な復旧は別。後者を確認したとは述べない。',
'- 一括応募の1〜10件、全件成功または新規0件、結果照会・再送は設計中。単一応募を繰り返して原子的一括処理を実装済みとみなさない。',
'- 応募受付と、採用・配置確定は別。',
'- Auth/RLS等はPhase Aでソースを静的に確認したが、今回の35秒の技術スライドは通信結果不明への対応に絞っている。',
'','## 原稿と時間','','原稿893字。読み上げ推定168秒、切替・間12秒、発表枠合計180秒。実測は未実施。推定値は編集上の配分であり、通し読み・Zoom共有の実測を代替しない。','','## 参照ファイルのSHA-256','']
used=list(dict.fromkeys(p for s in data['slides'] for p in s['sources']))
used.append('C:/Users/user/Documents/OpsCue_8AE8B2B1E49C93E7B9BBE3B983E3A483%89.pptx')
for p in used: sources += [f'- {link(p)}',f'  - SHA-256: `{sha(p)}`']
(out/'OpsCue_GeekTen2026_Sources.md').write_text('\n'.join(sources)+'\n',encoding='utf-8')

# Independently check every requested original PNG is embedded byte-for-byte.
embedded={m['sha256'] for m in content['media']}
image_keys=['key','worker','admin','detail']
assert all(sha(data['src'][k]) in embedded for k in image_keys)
preview_sizes={}
for i in range(1,8):
    with Image.open(out/f'previews/slide-{i}.png') as im: preview_sizes[str(i)]=im.size
assert all(size==(1920,1080) for size in preview_sizes.values())

review=['# OpsCue 技育展2026予選スライド 最終確認','','作成日：2026年10月26日（JST）','','## 成果物','','- '+link(out/'OpsCue_GeekTen2026_Preliminary.pptx'),'- '+link(notes_target),'- '+link(out/'OpsCue_GeekTen2026_Sources.md'),'- '+link(out/'OpsCue_GeekTen2026_Review.md'),'','## 確認結果','','|項目|結果|確認範囲|','|---|---|---|',
'|7枚・16:9|確認済み|7枚、1280×720相当（13.3333×7.5インチ）|',
'|編集可能性|確認済み|全87個のネイティブ図形・テキスト。5枚目の図解・矢印・注記も編集可能。UIとキービジュアルは埋め込み画像|',
'|全ページの画像出力|確認済み|最終PPTXを再インポートし、7枚すべて1920×1080 PNGで再レンダリング|',
'|目視確認|確認済み|全7枚を個別に確認。スライド文字の切れ・意図しない重なり・画像歪みは見当たらない|',
'|UI可読性|確認済み・制限あり|勤務先・集合時刻・確認済み・未提出を判読可能。元画像の解像度により拡大部分にはぼけが残る|',
'|画像の保持|確認済み|埋め込まれた4種類のPNGは元ファイルとSHA-256一致。5個の画像オブジェクト、6枚目は同一画像を2回使用|',
'|文字と配色|確認済み|Noto Sans JP、ネイビー#071D3B、ブルー#0865EF、ホワイト。主要見出し33pt、本文おおむね22.5〜29.25pt、注記16.5pt以上。表紙・締めは大きく強調|',
'|実装状態|確認済み|単一応募＝設計・ソース実装あり／実環境での復旧未検証。一括応募＝設計中。保存画面の日時・テストデータ注記あり|',
'|ノート欄|確認済み|7枚すべてに対応原稿・推定秒数・発表枠・実測未実施・進行メモ・出典あり。PPTX XMLで原稿本文の一致を確認|',
'|180秒構成|計画値として確認済み|15/25/30/35/35/25/15秒＝180秒。原稿推定168秒、切替・間12秒。発話実測は未実施|',
'|PPTX構造・レイアウト|確認済み|パッケージ整合性、図形境界、見出し適合、書体ポリシーの自動検査で指摘0・警告0。最終ファイルの再インポート成功|',
'|既存ファイル保全|確認済み|既存リポジトリ691ファイルのSHA-256、元PowerPoint・添付画像・Git HEAD/index/config計6ファイルのSHA-256が制作前後で一致|',
'|機密候補ファイル|限定確認|3ファイルは内容を読まずサイズ・最終更新時刻のみ一致確認。秘密値の取得・出力なし|',
'|Git状態|確認済み|新規成果物フォルダを除いたstatusが制作前と一致。既存next.config.tsの変更等を保持。commit/push/ブランチ作成/設定変更なし|',
'|DB・AWS・外部設定|本制作から操作なし|DB接続・SQL・AWS・デプロイ・外部サービス設定変更なし。外部システム自体の状態をライブ監査した意味ではない|',
'','## 各スライドのプレビュー','']
for i,s in enumerate(data['slides'],1): review += [f'### {i}. {s["title"]}',f'![スライド{i}]({(out/f"previews/slide-{i}.png").as_posix()})','']
review += ['## 残る確認事項','','1. **読み上げ時間の実測**：発表者本人が切替を含めて通し読みし、原稿160〜170秒・全体180秒以内を確認する。実測値を推定値として混同しない。','2. **本番のPowerPoint・Zoom表示**：今回の画像確認はArtifact Toolレンダラー。Microsoft PowerPoint本体の表示とZoom共有先での見え方・フォント代替は未検証。Noto Sans JPは制作環境に存在するが、PPTXに書体ファイルは埋め込んでいない。','3. **保存画面の解像度**：Worker原画像は390×844。内容改変やAIによる補完はしておらず、拡大時のぼけは元画像由来で残る。重要UIは読めるよう切り出した。','4. **技術動作の未検証**：資料制作でDB接続・操作テストは行っていない。スライドの未検証・設計中表示を維持する。','','## 検証方法の補足','','最終化ツールはWindows環境でハードリンク公開に失敗したため、タスク専用スクリプト内で、その新規成果物1件だけを排他的コピー（既存ファイル上書き不可）へ切り替えた。全バリデーターを維持し、検証済みバイト列と完成ファイルのSHA-256一致も確認した。スキル・ランタイムのファイルは変更していない。','','## 最終ファイル識別','',f'- PPTX SHA-256: `{validation["finalSha256"]}`',f'- PPTX サイズ: {validation["byteCount"]:,} bytes','- 自動検証詳細は専用作業フォルダ `.build/final-validation.json`、ノート・画像検査は `.build/content-validation.json`、保全比較は `.build/preservation-check.json` に保存。','']
assert sum(x['nativeShapes'] for x in content['slides'])==87
(out/'OpsCue_GeekTen2026_Review.md').write_text('\n'.join(review),encoding='utf-8')
print(json.dumps({'preservation':preservation,'deliveredFiles':[p.name for p in out.iterdir() if p.is_file()],'previews':len(preview_sizes)},ensure_ascii=False))
