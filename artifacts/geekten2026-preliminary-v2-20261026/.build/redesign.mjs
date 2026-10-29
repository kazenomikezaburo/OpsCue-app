import fs from 'node:fs/promises';
export const root='C:/Users/user/OpsCue/OpsCue-team-main';
export const base=`${root}/artifacts/geekten2026-preliminary-v2-20261026`;
export const v1=`${root}/artifacts/geekten2026-preliminary-20261026`;
const old=JSON.parse(await fs.readFile(`${v1}/.build/content.json`,'utf8'));
export const src=old.src;
export const font='Noto Sans JP';
export const C={navy:'#071D3B',blue:'#0865EF',cyan:'#58CAFF',ink:'#142A44',muted:'#4C6279',pale:'#EFF5FC',white:'#FFFFFF',line:'#CCDAEA',darkCard:'#132F52',amber:'#946110',amberBg:'#FFF5DD'};
export const data=structuredClone(old.slides);
data[3].title='立場に合わせて、必要な情報が見える';
data[3].script='こちらは、テストデータを使った保存画面です。左はスタッフ向け。次の勤務の日時と勤務先を確認し、詳細へ進む入口があります。右は管理者向け。前日確認がまだ提出されていないことを表示しています。スタッフは自分の勤務を、管理者は確認が必要な人を把握する。それぞれの立場で必要な情報を見せる設計です。二つは別の勤務の表示例で、現在の動作を示すものではありません。';
data[3].cue='全体像を示してから、左の「次の勤務」と右の「未提出」の拡大部分を指す。同期・操作前後とは説明しない。1:45までに次へ。';
data[4].title='応募できたか分からない。その再試行を安全に';
data[4].script='応募したあと、通信が切れると、届いたのか分からなくなります。そこで単一応募では、同じ受付キーで再試行し、結果が記録済みなら再利用する設計にしています。同じ応募を重複登録しないための、冪等性という考え方です。ソース実装はありますが、実環境での復旧は未検証です。同じ案件の一から十シフトを、全件成功か新規登録ゼロにする一括応募は、別途設計中です。';
data[4].cue='上段の問題、中央の同じキーによる再試行、下段の実装・未検証・設計中の順に説明。2:20までに次へ。';
data[4].note+=' v2の4段階目は「記録済みなら結果を再利用」と条件を明示する。全要求が記録済みだとは主張しない。';
data[5].title='勤務前の確認が、この画面にまとまる';
data[5].script='勤務前に、この画面で何を確認できるでしょうか。まず勤務先と住所、次に集合時刻、そして仕事内容。下には前日確認の回答があります。どこへ、何時に、どんな仕事へ向かうのかを、勤務ごとに見直せる構成です。今回は、同じ保存画面の必要な部分を拡大した静止画デモです。';
data[5].cue='全体画面を入口として、右の「どこへ」「何時に」「どんな仕事」「回答できているか」を上から順に指す。クリック不要。2:45までに次へ。';
data[5].note='静止画デモ。2026-10-20時点のテストデータ。左は保存画面全体、右は同じ画像の4領域の拡大。配置・確認番号・線はスライド側の説明。準備情報は元画面にある勤務先・住所・集合時刻・仕事内容まで。持ち物、地図、チェックリスト等を創作しない。現在の動作や操作前後ではない。';
data[6].title='「どこだっけ」を減らし、次の行動へ';
data[6].script='「集合場所、どこだっけ」を減らし、安心して次の行動を選べる現場を目指します。今後は一括応募の検証と改善を進めます。OpsCue。募集から、現場が無事に終わるまで。';
data[6].cue='冒頭の問いに戻り、目指す価値として述べる。最後のコピーに短く間を置く。3:00までに終了。';

function tx(s,t,x,y,w,h,sz=32,col=C.ink,bold=false,align='left'){
 const q=s.shapes.add({geometry:'textbox',name:t.replace(/\n/g,' ').slice(0,70),position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 q.text=t;q.text.style={typeface:font,fontSize:sz,color:col,bold,alignment:align,verticalAlignment:'middle',insets:0,wrap:'none',autoFit:'none'};return q;
}
function box(s,x,y,w,h,fill,line='none',radius=0){return s.shapes.add({geometry:radius?'roundRect':'rect',name:'Presentation panel / annotation',position:{left:x,top:y,width:w,height:h},fill,line:{fill:line,width:line==='none'?0:1.4},...(radius?{borderRadius:radius}:{})});}
function arrow(s,x,y,w,h,dir='right',color=C.blue){return s.shapes.add({geometry:dir==='right'?'rightArrow':'downArrow',position:{left:x,top:y,width:w,height:h},fill:color,line:{fill:'none',width:0}});}
function img(s,file,x,y,w,h,crop,sz,alt){
 const o={path:file,alt,fit:'contain',position:{left:x,top:y,width:w,height:h}};
 if(crop){let [a,b,c,d]=crop,[sw,sh]=sz;o.crop={left:a/sw,top:b/sh,right:(sw-a-c)/sw,bottom:(sh-b-d)/sh};}
 const z=s.images.add(o);z.lockAspectRatio=true;return z;
}
function head(s,n,t,dark=false){
 tx(s,'OpsCue',56,22,200,30,23,dark?C.cyan:C.blue,true);
 tx(s,`${n} / 7`,1154,24,70,26,20,dark?'#A9C4DF':C.muted,false,'right');
 tx(s,t,56,69,1168,72,n===5?40:43,dark?C.white:C.navy,true);
}
function screenNote(s){tx(s,'2026年10月20日保存・テストデータ／現在の動作は未検証',56,674,1168,30,21,C.muted);}
function brand(s){
 tx(s,'OpsCue',56,441,590,100,84,C.white,true);
 tx(s,'募集から、\n現場が無事に終わるまで。',56,558,610,115,38,C.white,true);
}

export async function redesign(presentation){
 if(presentation.slides.items.length!==7)throw new Error('Expected the existing seven-slide deck.');
 presentation.theme.defaultFont=font;
 for(let i=0;i<7;i++){
  let s=presentation.slides.items[i];s.shapes.deleteAll();
  for(const image of [...s.images.items]) image.delete();
  s.background.fill=[0,2,6].includes(i)?C.navy:C.white;
  let d=data[i],start=data.slice(0,i).reduce((a,b)=>a+b.slot,0);
  s.speakerNotes.text=`スライド ${i+1}/7：${d.title}\n発表枠：${d.slot}秒（累計${start}〜${start+d.slot}秒）\n読み上げ推定：${d.speech}秒／実測：未実施。全体原稿168秒＋切替・間12秒を計画。人による通し読み前の編集上の推定。\n\n【読み上げ原稿】\n${d.script}\n\n【進行メモ・読み上げない】\n${d.cue}\n\n【状態・根拠・読み上げない】\n${d.note}\n${d.criteria}\n\n【出典】\n${d.sources.join('\n')}\n基準資料：${v1}/output/OpsCue_GeekTen2026_Preliminary.pptx\n出典一覧：${v1}/output/OpsCue_GeekTen2026_Sources.md\nv2では保存素材と承認済み調査結果を使用。アプリや外部環境への接続・動作確認は行っていない。`;
  if(i===0){
   tx(s,'技育展2026 オンライン予選',56,43,730,45,27,'#A8CAEF');
   tx(s,'「集合場所、\n  どこだっけ？」',56,151,590,158,54,C.white,true);
   box(s,56,342,66,4,C.cyan);
   tx(s,'現場で感じた不便から、生まれた。',56,365,600,48,28,'#BED8F3');
   brand(s);
   img(s,src.key,690,44,590,500.395,[720,20,1014,860],[1734,907],'提供されたコンセプトビジュアル。実装確認の証拠ではない。');
   tx(s,'スタッフと管理者をつなぐ\n現場運営プラットフォーム',710,570,514,90,30,'#BED8F3');
   tx(s,'端末画像はコンセプトビジュアル',710,670,514,28,20,'#A8CAEF');
  }
  if(i===1){
   s.background.fill=C.pale;head(s,2,d.title);
   tx(s,'集合案内はLINE。\n注意事項は別の資料。',56,200,680,158,48,C.navy,true);
   tx(s,'一つの勤務の情報が、\n複数の場所に分かれている。',56,386,660,106,32,C.muted);
   box(s,780,184,444,193,C.white,C.line,16);
   tx(s,'スタッフ',810,207,384,42,27,C.blue,true);
   tx(s,'必要な情報を\n探し直す',810,259,384,94,37,C.navy,true);
   box(s,780,405,444,193,C.navy,'none',16);
   tx(s,'管理者',810,428,384,42,27,C.cyan,true);
   tx(s,'未確認の人を\n確認し直す',810,480,384,94,37,C.white,true);
   box(s,56,587,658,60,'#DCEBFC','none',8);
   tx(s,'自分の現場経験と、管理者・スタッフの声',76,593,618,48,27,C.navy,true);
  }
  if(i===2){
   head(s,3,d.title,true);
   tx(s,'One Shift, One Timeline.',56,163,1168,72,48,C.cyan,true);
   const labels=['募集','応募','前日確認','出発','到着','勤務','完了'];
   labels.forEach((v,j)=>{let x=56+j*169;box(s,x,292,151,82,j===2?C.blue:C.darkCard,j===2?'none':'#355675',10);tx(s,v,x,292,151,82,29,C.white,true,'center');if(j<6)arrow(s,x+153,323,13,20,'right',C.cyan);});
   box(s,56,449,566,154,C.white,'none',14);box(s,650,449,574,154,'#DDEEFF','none',14);
   tx(s,'Worker',82,465,510,42,29,C.blue,true);tx(s,'次の勤務と、今やること',82,518,510,58,34,C.navy,true);
   tx(s,'Admin',676,465,520,42,29,C.blue,true);tx(s,'対応が必要な人・現場',676,518,520,58,34,C.navy,true);
   tx(s,'目指す業務フロー。全工程の動作確認済みを示すものではありません。',56,659,1168,36,21,'#BED2E7');
  }
  if(i===3){
   s.background.fill=C.pale;head(s,4,d.title);
   box(s,48,168,578,480,C.white,C.line,16);box(s,650,168,582,480,C.white,C.line,16);
   tx(s,'Worker',72,183,530,45,33,C.blue,true);tx(s,'スタッフ / 自分の勤務を確認',72,229,530,37,25,C.navy,true);
   tx(s,'Admin',674,183,534,45,33,C.blue,true);tx(s,'管理者 / 未提出の人を確認',674,229,534,37,25,C.navy,true);
   box(s,72,285,156,337.6,C.white,C.line,6);
   img(s,src.worker,75,288,150,324.615,null,null,'Workerホームの保存画面全体。文字を読む主領域は右の拡大。');
   tx(s,'次の勤務を拡大',273,291,325,38,24,C.blue,true);
   box(s,156,339,450,267,C.white,'#84B4EF',9);
   img(s,src.worker,160,343,442,256.36,[20,303,350,203],[390,844],'同じWorkerホームの次の勤務カード。拡大画像。');
   img(s,src.admin,674,280,534,335.604,null,null,'Admin前日確認の保存画面全体。Workerとは別のスタッフ・勤務。');
   box(s,726,448,482,175,C.white,'#84B4EF',9);
   tx(s,'前日確認を拡大',742,453,450,36,24,C.blue,true);
   img(s,src.admin,738,493,458,119.478,[696,306,345,90],[1440,905],'同じAdmin保存画面の未提出表示を拡大。');
   tx(s,'役割別の画面例（別の勤務）',56,644,1168,30,20,C.muted);
   screenNote(s);
  }
  if(i===4){
   head(s,5,d.title);
   box(s,56,169,1168,91,C.navy,'none',12);
   tx(s,'問題',80,188,100,44,26,C.cyan,true);
   tx(s,'応答を受け取れず、受付済みか分からない',206,183,988,60,35,C.white,true);
   const xx=[56,354,652,950];
   const main=['応募操作','通信結果が不明','同じキーで再試行','保存結果を再利用'];
   const sub=['受付キーを付与','失敗とは断定しない','キーを変えずに送る','結果が記録済みの場合'];
   main.forEach((v,j)=>{box(s,xx[j],310,274,155,j===2?C.blue:C.pale,j===2?'none':C.line,12);tx(s,`0${j+1}`,xx[j]+20,320,234,32,22,j===2?'#CBE8FF':C.blue,true);tx(s,v,xx[j]+12,362,250,46,27,j===2?C.white:C.navy,true,'center');tx(s,sub[j],xx[j]+12,416,250,32,21,j===2?C.white:C.muted,false,'center');if(j<3)arrow(s,xx[j]+279,375,14,25);});
   tx(s,'単一応募',56,487,1168,34,25,C.blue,true);
   box(s,56,534,567,76,'#EAF3FF','none',9);tx(s,'設計・ソース実装あり',79,544,521,55,29,C.navy,true);
   box(s,650,534,574,76,C.amberBg,'none',9);tx(s,'実環境での復旧は未検証',673,544,528,55,29,C.amber,true);
   box(s,56,643,1168,2,C.line);
   tx(s,'設計中',56,658,130,40,25,C.blue,true);
   tx(s,'同一案件1〜10シフト一括応募：全件成功 または 新規0件',204,658,1020,40,25,C.navy);
  }
  if(i===5){
   head(s,6,d.title);
   box(s,55,159,242,505,C.pale,C.line,12);
   img(s,src.detail,60,164,232,502.072,null,null,'勤務詳細の保存画面全体。右は同じ画像の4つの領域。');
   const rows=[
    {y:181,n:'01',q:'どこへ',a:'勤務先・住所',crop:[35,365,320,50],h:80},
    {y:304,n:'02',q:'何時に',a:'集合時刻',crop:[35,433,320,49],h:78.4},
    {y:421,n:'03',q:'どんな仕事',a:'仕事内容',crop:[35,517,320,29],h:46.4},
    {y:541,n:'04',q:'回答できているか',a:'前日確認',crop:[35,600,320,45],h:72},
   ];
   rows.forEach((r,j)=>{tx(s,r.n,332,r.y,55,34,25,C.blue,true);tx(s,r.q,397,r.y,243,36,j===3?24:29,C.navy,true);tx(s,r.a,397,r.y+43,243,33,23,C.muted);img(s,src.detail,690,r.y-1,512,r.h,r.crop,[390,844],`勤務詳細の${r.a}部分を拡大。番号はスライドの説明でありアプリUIではない。`);if(j<3)box(s,332,r.y+106,870,1,C.line);});
   screenNote(s);
  }
  if(i===6){
   tx(s,'「集合場所、どこだっけ？」',56,43,1168,48,29,'#A8CAEF');
   tx(s,'探し直す不安を減らし、\n安心して、次の行動へ。',56,153,1168,160,57,C.white,true);
   box(s,56,342,66,4,C.cyan);
   tx(s,'現場で働く人のために、目指す体験',56,365,1168,48,29,'#BED8F3');
   brand(s);
   box(s,777,456,447,173,C.darkCard,'#355675',14);
   tx(s,'次のステップ',803,472,395,40,26,C.cyan,true);
   tx(s,'一括応募の検証\n現場の声をもとに改善',803,530,395,82,29,C.white,true);
  }
 }
 await fs.writeFile(`${base}/.build/content-v2.json`,JSON.stringify({slides:data,src,font,colors:C},null,2),'utf8');
 let sec=0,lines=['# OpsCue 技育展2026予選 発表原稿 v2','','7枚構成。発表枠180秒、原稿推定168秒、切替・間12秒。実測は未実施。','推定は文字数・説明・間を考慮した編集上の配分。発表者の通し読みで原稿160〜170秒、全体180秒以内を確認する。','スライドは手動切替。自動送り・アニメーション・ライブ操作に依存しない。','','|枚|発表枠|累計枠|原稿推定|実測|','|---|---:|---|---:|---|'];
 data.forEach((s,i)=>{lines.push(`|${i+1}|${s.slot}秒|${sec}〜${sec+s.slot}秒|${s.speech}秒|未実施|`);sec+=s.slot;});
 lines.push('|合計|180秒|0〜180秒|168秒|未実施|','');
 data.forEach((s,i)=>lines.push(`## ${i+1}. ${s.title}`,'',`原稿推定${s.speech}秒／発表枠${s.slot}秒／実測未実施`,'',s.script,'',`進行メモ：${s.cue}`,'',`表現上の境界：${s.note}`,''));
 lines.push('## リハーサル','','1. 切替を含めて通し読みし、実測値を記録する。','2. 1:45で技術、2:20で勤務詳細、2:45で締めへ移る。','3. 遅れた場合は3枚目末尾や4枚目の言い換えを短縮する。未検証・設計中の説明は省略しない。','4. 本番環境のPowerPointとZoom共有で文字とフォントを確認し、ノート欄を共有しない。','');
 await fs.writeFile(`${base}/output/OpsCue_GeekTen2026_SpeakerNotes_v2.md`,lines.join('\n'),'utf8');
 return {slides:7,speechSeconds:168,slotsSeconds:180,characters:data.reduce((n,s)=>n+s.script.length,0)};
}
