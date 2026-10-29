from pathlib import Path
import hashlib, json, subprocess, zipfile, posixpath, io
import xml.etree.ElementTree as E
from PIL import Image

root=Path('C:/Users/user/OpsCue/OpsCue-team-main')
base=root/'artifacts/geekten2026-preliminary-v2-20261026'
out=base/'output'
v1=root/'artifacts/geekten2026-preliminary-20261026/output'
data=json.loads((base/'.build/content-v2.json').read_text(encoding='utf-8'))
baseline=json.loads((base/'.build/baseline.json').read_text(encoding='utf-8'))
validation=json.loads((base/'.build/final-validation.json').read_text(encoding='utf-8'))
pptx=out/'OpsCue_GeekTen2026_Preliminary_v2.pptx'
ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def link(p,label=None):
    p=Path(p)
    return f'[{label or p.name}](<{p.as_posix()}>)'

content={'slides':[],'media':[]}
with zipfile.ZipFile(pptx) as z:
    p=E.fromstring(z.read('ppt/presentation.xml'))
    assert len(p.find('p:sldIdLst',ns))==7
    size=p.find('p:sldSz',ns)
    assert (int(size.get('cx')),int(size.get('cy')))==(12192000,6858000)
    for name in z.namelist():
        if name.startswith('ppt/media/'):
            raw=z.read(name)
            with Image.open(io.BytesIO(raw)) as im: dims=im.size
            content['media'].append({'name':name,'sha256':hashlib.sha256(raw).hexdigest(),'dimensions':dims})
    all_sizes=[]
    for i,d in enumerate(data['slides'],1):
        xml=E.fromstring(z.read(f'ppt/slides/slide{i}.xml'))
        notes=E.fromstring(z.read(f'ppt/notesSlides/notesSlide{i}.xml'))
        text=''.join(notes.itertext())
        assert d['script'] in text,(i,'script mismatch')
        for expected in [f'読み上げ推定：{d["speech"]}秒','実測：未実施',f'発表枠：{d["slot"]}秒']:
            assert expected in text,(i,expected)
        assert xml.find('p:timing',ns) is None
        rels=E.fromstring(z.read(f'ppt/slides/_rels/slide{i}.xml.rels'))
        rmap={r.get('Id'):posixpath.normpath(posixpath.join('ppt/slides',r.get('Target'))).lstrip('/') for r in rels}
        ratios=[]
        for pic in xml.findall('.//p:pic',ns):
            blip=pic.find('.//a:blip',ns)
            imname=rmap[blip.get('{'+ns['r']+'}embed')]
            with Image.open(io.BytesIO(z.read(imname))) as im: sw,sh=im.size
            crop=pic.find('.//a:srcRect',ns)
            c={k:(int(crop.get(k,'0'))/100000 if crop is not None else 0) for k in ('l','t','r','b')}
            dim=pic.find('.//a:xfrm/a:ext',ns)
            display=int(dim.get('cx'))/int(dim.get('cy'))
            source=sw*(1-c['l']-c['r'])/(sh*(1-c['t']-c['b']))
            error=abs(display/source-1)
            assert error<0.002,(i,error)
            ratios.append(error)
        for r in xml.findall('.//a:rPr',ns):
            if r.get('sz'):all_sizes.append(int(r.get('sz'))/100)
        content['slides'].append({'number':i,'nativeShapes':len(xml.findall('.//p:sp',ns)),'images':len(ratios),'imageAspectRatioMaxError':max(ratios,default=0),'notesScriptMatches':True,'speechEstimate':d['speech'],'slot':d['slot'],'measured':None})
    content['fontSizePtRange']=[min(all_sizes),max(all_sizes)]
embedded={m['sha256'] for m in content['media']}
assert all(sha(data['src'][k]) in embedded for k in ['key','worker','admin','detail'])
content['allFourOriginalImagesEmbeddedUnchanged']=True
content['characters']=sum(len(d['script']) for d in data['slides'])
assert sum(d['speech'] for d in data['slides'])==168
assert sum(d['slot'] for d in data['slides'])==180
assert sha(pptx)==validation['finalSha256']
(base/'.build/content-validation.json').write_text(json.dumps(content,ensure_ascii=False,indent=2),encoding='utf-8')

changed=[p for p,h in baseline['files'].items() if not (root/p).is_file() or sha(root/p)!=h]
external_changed=[p for p,h in baseline['external'].items() if not Path(p).is_file() or sha(p)!=h]
metadata_changed=[p for p,v in baseline['metadataOnly'].items() if not (root/p).is_file() or [(root/p).stat().st_size,(root/p).stat().st_mtime_ns]!=v]
status=subprocess.check_output(['git','--no-optional-locks','status','--porcelain=v1','-uall'],cwd=root).decode()
filtered=''.join(line+'\n' for line in status.splitlines() if not line.startswith('?? artifacts/geekten2026-preliminary-v2-20261026/'))
head=subprocess.check_output(['git','--no-optional-locks','rev-parse','HEAD'],cwd=root).decode().strip()
preservation={'repositoryFilesChecked':len(baseline['files']),'changed':changed,'externalAndGitChecked':len(baseline['external']),'externalAndGitChanged':external_changed,'metadataOnlyChecked':len(baseline['metadataOnly']),'metadataChanged':metadata_changed,'gitStatusExcludingNewOutputUnchanged':filtered==baseline['status'],'headUnchanged':head==baseline['head'],'v1PptxSha256':sha(v1/'OpsCue_GeekTen2026_Preliminary.pptx')}
assert not changed and not external_changed and not metadata_changed and preservation['gitStatusExcludingNewOutputUnchanged'] and preservation['headUnchanged'],preservation
(base/'.build/preservation-check.json').write_text(json.dumps(preservation,ensure_ascii=False,indent=2),encoding='utf-8')
for i in range(1,8):
    with Image.open(out/f'previews/slide-{i}.png') as im: assert im.size==(1920,1080)

total_shapes=sum(s['nativeShapes'] for s in content['slides'])
total_images=sum(s['images'] for s in content['slides'])
review=['# OpsCue 技育展2026予選スライド v2 制作・確認レポート','','作成日：2026年10月26日（JST）。承認済みv1と制作レポートを基準に、発表資料のみを改善。','','## 成果物','',
'- '+link(pptx),'- '+link(out/'OpsCue_GeekTen2026_SpeakerNotes_v2.md'),'- '+link(out/'OpsCue_GeekTen2026_Review_v2.md'),'',
'## 改善内容','','|枚|改善点|審査で伝える軸|','|---|---|---|',
'|1|問いを大きく配置。ネイビー背景、シアンの線、OpsCue表記とキャッチコピーを7枚目と統一|作品の価値：現場体験|',
'|2|情報が分散する課題と、スタッフ・管理者それぞれの負担を大小のカードで整理|作品の価値：課題の具体性|',
'|3|ネイビー背景に業務フロー。前日確認を強調し、Worker/Adminを対比|作品の価値：一つの勤務を軸にした設計|',
'|4|実画面の全体像を残し、次の勤務・前日確認の未提出状態を拡大。二つは別勤務と注記|完成度：役割別UI|',
'|5|結果不明という問題、同じキーでの再試行、記録済み結果の再利用を4段階で図解。実装と未検証を別表示|技術レベル：冪等性と復旧を考えた設計|',
'|6|勤務詳細の全体像から、勤務先・住所、集合時刻、仕事内容、前日確認へ視線を誘導|完成度：勤務前の情報設計|',
'|7|冒頭の問いを回収し、目指す体験を大きく提示。表紙とブランド表現を統一|作品の価値・可能性|','',
'## 確認結果','','|項目|結果・範囲|','|---|---|',
'|枚数・画面比率|7枚、16:9（1280×720相当）|',
f'|編集可能性|{total_shapes}個のネイティブ図形・テキスト。図解、矢印、カード、注記も編集可能。{total_images}個の画像オブジェクトは独立して配置・トリミング可能|',
'|レンダリング|完成PPTXを再インポートし、7枚を1920×1080 PNGへ再出力|',
'|目視|全7枚を個別確認。6枚目の切り出し上端を修正。スライド文字の切れ、意図しない重なり、画像の縦横歪みは見当たらない|',
'|UI可読性|拡大した勤務情報・確認状態は判読可能。小さな全体像は文脈用。元画像の低解像度によるぼけは残る|',
'|配色・文字|ネイビー#071D3B、ブルー#0865EF、ホワイトを主に使用。Noto Sans JPで統一。見出し30〜32.25pt、主要本文・役割説明は18.75〜36pt程度。注記は15〜15.75pt以上。表紙・締めはさらに大きく強調|',
'|余白|基本左右56px。カード間隔、画面注記の領域を確保。図形境界・見出し適合の自動検査も指摘0・警告0|',
'|画像の真正性|使用した元PNG4種類はPPTX埋め込みデータとSHA-256一致。UIの文字・状態・数値を変更していない。トリミング後の縦横比をXMLでも確認|',
'|原稿とノート|全7枚のノート欄に原稿・推定秒数・発表枠・実測未実施・進行メモ・出典を格納。原稿本文とPPTX XMLの一致を確認|',
'|時間|発表枠15/25/30/35/35/25/15秒＝180秒。原稿推定14/23/28/33/33/23/14秒＝168秒、切替・間12秒。実測は未実施|',
'|構造・書体|PPTXパッケージ、レイアウト、書体ポリシーの検査を通過。最終ファイルの再インポート成功。Microsoft PowerPoint本体による検証とは区別|',
f'|既存ファイル保全|開始時の既存リポジトリ{len(baseline["files"])}ファイル、元資料・Git HEAD/index/config等{len(baseline["external"])}ファイルのSHA-256が一致。機密候補3ファイルは内容を読まずサイズ・更新時刻の一致のみ確認|',
'|Git・アプリ|新規v2出力フォルダを除くGit status、HEADが開始時と一致。既存v1とアプリコードを保持|',
'|DB・外部サービス|DB、AWS、Supabase、Vercelその他のアプリ外部環境への接続・操作・設定変更なし。外部環境の状態をライブ監査した意味ではない|','',
'## 実装状態と表現の境界','',
'- 単一応募：承認済みの静的調査に基づく設計・ソース実装の説明。同じキーで再試行し、結果が記録済みなら再利用する。実環境での復旧動作は未検証。',
'- ブラウザ再読込・再ログインをまたぐキー保持や、必ず復旧できることは主張しない。DBへの適用や動作をv2で再確認していない。',
'- 同一案件1〜10シフト一括応募：設計中。全件成功または新規登録0件という設計を単一応募の実装と混同しない。',
'- UIは2026年10月20日保存のテストデータ。現在の動作確認済み画面として扱わない。4枚目のWorker/Adminは別勤務の表示例で、同期や操作前後の証拠ではない。',
'- 6枚目は同じ保存画面を複数回トリミングした静止画デモ。準備情報は画面上の仕事内容までとし、持ち物・地図・チェックリストを追加していない。',
'- 3枚目は目指す業務フロー、7枚目は目指す価値。全工程の完成や定量効果、導入実績は主張しない。',
'- 表紙の端末画像は既存コンセプトビジュアル。実環境の証拠ではない。図形の枠、拡大説明、番号はプレゼン側の注釈でありアプリのUIではない。','',
'## 原稿と進行','','原稿'+str(content['characters'])+'字。168秒は文字数と説明の間を考慮した編集上の推定であり、音読の実測ではない。スライドは手動切替で、アニメーションや操作デモに依存しない。',
'発表中の目安：0:15で課題、0:40で解決策、1:10で役割別UI、1:45で技術、2:20で勤務詳細、2:45で締め。180秒内に終えるため、本人の通し読みで実測値を確認する。','',
'## 使用素材・基準資料','',
'- 基準PowerPoint：'+link(v1/'OpsCue_GeekTen2026_Preliminary.pptx'),
'- 基準レポート：'+link(v1/'OpsCue_GeekTen2026_Review.md'),
'- 技術・課題の出典と静的調査の境界：'+link(v1/'OpsCue_GeekTen2026_Sources.md'),
'- 本大会の日時・条件はユーザー提示条件を継承。外部サイトの独立照合は実施していない。','',
'|使用箇所|原画像|寸法|切り出し x,y,w,h（px）|','|---|---|---|---|',
f'|1|{link(data["src"]["key"])}|1734×907|720,20,1014,860|',
f'|4 Worker|{link(data["src"]["worker"])}|390×844|全体＋20,303,350,203|',
f'|4 Admin|{link(data["src"]["admin"])}|1440×905|全体＋696,306,345,90|',
f'|6|{link(data["src"]["detail"])}|390×844|全体＋勤務先35,365,320,50／時刻35,433,320,49／仕事内容35,517,320,29／確認35,600,320,45|','',
'元画像は上書き・画素編集していない。PowerPointの画像トリミングで表示範囲を指定し、縦横比を維持して配置。AI生成・補完・新しい画面撮影・録画は使用していない。','',
'## 各スライドのプレビュー','']
for i,d in enumerate(data['slides'],1):
    review.extend([f'### {i}. {d["title"]}',f'![スライド{i}]({(out/f"previews/slide-{i}.png").as_posix()})',''])
review.extend(['## 残る確認事項','',
'1. 発表者本人による音読・切替の実測。原稿160〜170秒、全体180秒以内を確認する。',
'2. Microsoft PowerPoint本体とZoom共有先の表示は未検証。Noto Sans JPのフォントファイルは埋め込んでいないため、本番環境で確認する。',
'3. Worker保存画面は390×844px。拡大部分には元画像由来のぼけが残る。画面の真正性を保つため補完していない。',
'4. 単一応募の復旧は実環境未検証、一括応募は設計中という注記を本番でも保持する。','',
'## 検証ファイル','',
'Windowsのハードリンク制約により、最終化スクリプト内で今回の新規PPTXだけを排他的コピーへ切り替えた。検証を省略せず、検証済みファイルと最終ファイルのSHA-256一致を確認。スキルやランタイムは変更していない。',
'- '+link(base/'.build/final-validation.json'),'- '+link(base/'.build/content-validation.json'),'- '+link(base/'.build/preservation-check.json'),
f'- v2 PPTX SHA-256: `{sha(pptx)}`',f'- v1 PPTX SHA-256（変更なし）: `{preservation["v1PptxSha256"]}`',f'- v2 PPTXサイズ: {pptx.stat().st_size:,} bytes',''])
(out/'OpsCue_GeekTen2026_Review_v2.md').write_text('\n'.join(review),encoding='utf-8')
print(json.dumps({'nativeShapes':total_shapes,'imageInstances':total_images,'notesMatched':7,'scriptCharacters':content['characters'],'fontRangePt':content['fontSizePtRange'],'preservation':preservation,'outputs':[p.name for p in out.iterdir() if p.is_file()]},ensure_ascii=False))
