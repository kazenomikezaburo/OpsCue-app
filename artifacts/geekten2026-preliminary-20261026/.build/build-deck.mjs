import fs from 'node:fs/promises';

export const root = 'C:/Users/user/OpsCue/OpsCue-team-main';
export const output = `${root}/artifacts/geekten2026-preliminary-20261026`;
export const font = 'Noto Sans JP';
export const colors = { navy:'#071D3B', blue:'#0865EF', cyan:'#42C7FF', ink:'#11253F', muted:'#50647A', pale:'#EFF5FF', white:'#FFFFFF', rule:'#C9DAEC' };
const src = {
  key:'C:/Users/user/Pictures/95fd3106-53b5-4d06-b849-cbea5271f02c.png',
  worker:`${root}/docs/ui-screenshots/worker/home.png`,
  admin:`${root}/docs/ui-screenshots/admin/shifts-pre-shift-detail.png`,
  detail:`${root}/docs/ui-screenshots/worker/assignments-detail.png`,
  master:`${root}/docs/ui_仕様書/OpsCue_Master_Specification_v1.3_2026-10-23.md`,
  backend:`${root}/docs/ui_仕様書/OpsCue_Backend_%E9%96%8B%E7%99%BA%E6%89%8B%E9%A0%86%E6%9B%B8_20261023_%E6%94%B9%E8%A8%82%E7%89%88.md`,
  catalog:`${root}/docs/ui-screenshots/README.md`,
  action:`${root}/app/actions/worker-shift-applications.ts`,
  control:`${root}/components/worker/recruitment/worker-recruitment-application-controls.tsx`,
  sql:`${root}/supabase/migrations/20260926175812_ocv1_worker_application_commands.sql`,
};
export const slides = [
  {title:'OpsCue｜募集から、現場が無事に終わるまで。',slot:15,speech:14,
   script:'「明日の集合場所、どこだっけ。」私自身、現場スタッフとして、必要な情報を探し直す不便さを感じていました。その経験から生まれたのが、OpsCueです。',
   cue:'冒頭の問いの後に短く間を取る。0:15までに次へ。',sources:[src.master,src.key],criteria:'作品の価値：現場体験から生まれた動機',
   note:'表紙の端末画像は提供されたコンセプトビジュアル。実装・動作確認の証拠ではない。'},
  {title:'勤務前に、情報を探し直していた',slot:25,speech:23,
   script:'集合案内はLINE、注意事項は別の資料。勤務前に、いくつもの場所を探していました。管理者の方からも、前日や当日朝の連絡を分かりやすくしたい、という声がありました。同じ勤務を支えるのに、スタッフも管理者も、確認に手間がかかっている。これが開発の出発点です。',
   cue:'最初の30秒以内に「情報が分散している不便」を伝える。0:40までに次へ。',sources:[src.master],criteria:'作品の価値：当事者の課題と双方の負担',
   note:'Master Specification A.1/A.2。現場経験・会話に基づく課題仮説。正式な導入依頼・導入決定・定量効果を示さない。'},
  {title:'一つの勤務に、情報と行動をまとめる',slot:30,speech:28,
   script:'OpsCueは、募集から勤務完了までの情報を、一つの勤務を軸につなぐサービスです。スタッフには、次の勤務と、今やること。管理者には、確認が必要な人や現場を示します。こだわったのは、両者がそれぞれの立場で、次の行動を判断できることです。連絡を集めるだけでなく、現場で動くための入口をそろえます。',
   cue:'上の業務フローから、下のWorker/Adminへ視線を移す。1:10までに次へ。',sources:[src.master],criteria:'作品の価値：一つの勤務を軸に役割別の行動を支える設計',
   note:'図は目指す業務フロー。全工程の実装・連携・動作検証済みを示す図ではない。'},
  {title:'スタッフは準備を、管理者は未確認を把握',slot:35,speech:33,
   script:'こちらは、テストデータを使った保存画面です。左はスタッフ向け。次の勤務の日時と勤務先を確認し、詳細へ進む入口があります。右は管理者向け。前日確認の回答が、まだ提出されていないことを表示しています。スタッフは、自分の準備を確認する。管理者は、連絡が必要な人を確認する。それぞれの立場で必要な情報を見せています。二つの画面は、別の勤務の表示例です。',
   cue:'左の日時・勤務先、右の未提出表示を順に指す。画像の同期・状態更新を演じない。1:45までに次へ。',sources:[src.worker,src.admin,src.catalog],criteria:'完成度：保存済み実画面と役割別の情報設計',
   note:'2026-10-20のテストデータによる保存画面。WorkerはTEST Worker A、AdminはTEST Worker Bの別勤務。現在の動作確認や同一勤務の同期を示さない。原画像からネイティブ画像トリミングのみ。'},
  {title:'通信が途切れたときの応募処理',slot:35,speech:33,
   script:'応募したあと、通信が切れて結果が分からなくなったら。同じ受付キーで再試行し、保存済みの結果を確認します。同じ応募を重複登録しない、冪等性という考え方です。単一応募には、この設計とソース実装があります。ただし、実環境での復旧動作は未検証です。別の挑戦として、同じ案件の一から十シフトを、全件成功か、新規登録ゼロにする一括応募を設計中です。',
   cue:'左の4段階を上から下へ示す。右の「未検証」「設計中」を説明と合わせる。2:20までに次へ。',sources:[src.action,src.control,src.sql,src.backend],criteria:'技術レベル：結果不明・同一キー再試行・冪等性と一括処理の原子性',
   note:'単一応募のコードはunknownを返し、retryable時にコンポーネント内のキーを保持する。SQLは要求内容を検査し、同じactor/keyの保存結果を返す。成功・キー保持の実環境検証は未実施。画面再読込や再ログインをまたぐキー永続化を保証しない。応募受付は採用・配置確定と別。一括応募の1〜10件、原子性、結果照会は設計段階。'},
  {title:'勤務詳細で、集合と準備を確認',slot:25,speech:23,
   script:'勤務詳細を、保存した画面で紹介します。集合・準備の欄に勤務先と集合時刻、その下に前日確認の状態があります。ここでは同じ画面の二か所を拡大しています。勤務前に見直したい情報を、一か所で確認できる構成です。現在の動作を示すライブデモではなく、テストデータによる保存画面の紹介です。',
   cue:'左は集合・準備、右は前日確認。同一画像の切り出しであり操作前後ではない。クリック・スクロール不要。2:45までに次へ。',sources:[src.detail,src.catalog],criteria:'完成度：勤務前の確認に必要なUIを大きく提示',
   note:'静止画デモ。2026-10-20時点のテストデータ。左右は同一保存画像の別領域で、遷移や更新の実行証拠ではない。映像は使用しない。'},
  {title:'現場で働く人に、次の一手を',slot:15,speech:14,
   script:'今後は一括応募の検証と、現場の声をもとにした改善を進めます。現場で働く人に、次の一手を。OpsCue。募集から、現場が無事に終わるまで。',
   cue:'最後のキャッチコピーの前に短く間を取る。3:00までに終了。',sources:[src.master,src.backend],criteria:'作品の価値：可能性／技術レベル：次の検証課題',
   note:'今後の提案・展望。導入実績や現場検証済みの効果は主張しない。'},
];

function text(slide, value, x,y,w,h,size=32,color=colors.ink,bold=false,align='left',fill='none') {
 const shape=slide.shapes.add({geometry:'textbox',name:value.replace(/\n/g,' ').slice(0,60),position:{left:x,top:y,width:w,height:h},fill,line:{fill:'none',width:0}});
 shape.text=value;
 shape.text.style={typeface:font,fontSize:size,color,bold,alignment:align,verticalAlignment:'middle',autoFit:'none',wrap:'none',insets:0};
 return shape;
}
function rect(slide,x,y,w,h,fill,line='none',geometry='rect') {
 return slide.shapes.add({geometry,position:{left:x,top:y,width:w,height:h},fill,line:{fill:line,width:line==='none'?0:1.5}});
}
async function picture(slide,file,box,cropBox,sourceSize,alt) {
 const [x,y,w,h]=box;
 const opts={path:file,contentType:'image/png',alt,fit:'contain',position:{left:x,top:y,width:w,height:h}};
 if(cropBox){ const [cx,cy,cw,ch]=cropBox;const [sw,sh]=sourceSize;opts.crop={left:cx/sw,top:cy/sh,right:(sw-cx-cw)/sw,bottom:(sh-cy-ch)/sh}; }
 const img=slide.images.add(opts);img.lockAspectRatio=true;return img;
}
function header(slide,title,num){
 text(slide,title,64,58,1152,80,44,colors.navy,true);
 text(slide,'OpsCue',64,21,200,28,22,colors.blue,true);
 text(slide,`${num} / 7`,1152,22,64,26,20,colors.muted,false,'right');
}
const screenNote='2026年10月20日保存・テストデータ／現在の動作は未検証';

export async function build(presentation){
 if(presentation.slides.items.length) throw new Error('Refusing to overwrite a non-empty deck.');
 presentation.theme.defaultFont=font;
 for(let i=0;i<slides.length;i++){
  const slide=presentation.slides.add({width:1280,height:720});
  slide.background.fill=(i===0||i===6)?colors.navy:colors.white;
  const d=slides[i];let elapsed=slides.slice(0,i).reduce((n,x)=>n+x.slot,0);
  slide.speakerNotes.text=`スライド ${i+1}/7：${d.title}\n発表枠：${d.slot}秒（累計 ${elapsed}〜${elapsed+d.slot}秒）\n読み上げ推定：${d.speech}秒。実測：未実施。推定は約900字の全体原稿と画面説明の間を考慮した配分であり、時間保証ではありません。\n\n【読み上げ原稿】\n${d.script}\n\n【進行メモ・読み上げない】\n${d.cue}\n\n【状態・根拠の注記・読み上げない】\n${d.note}\n${d.criteria}\n\n【出典】\n${d.sources.join('\n')}\n発表条件はユーザー提示の2026-10-31 Zoom・180秒・審査基準。公式サイトの独立照合は未実施。`;
  if(i===0){
   await picture(slide,src.key,[606,66,674,571.637],[720,20,1014,860],[1734,907],'提供されたOpsCueコンセプトビジュアルの端末部分。実画面の検証証拠ではない。');
   text(slide,'技育展2026 オンライン予選',64,62,620,45,27,'#B8D7FF');
   text(slide,'OpsCue',64,176,540,130,104,colors.white,true);
   text(slide,'募集から、\n現場が無事に終わるまで。',64,333,570,130,42,colors.white,true);
   text(slide,'スタッフと管理者をつなぐ\n現場運営プラットフォーム',64,490,570,96,30,'#D3E6FF');
   text(slide,'2026.10.31',64,638,330,36,25,'#B8D7FF');
   text(slide,'端末画像はコンセプトビジュアル',780,647,436,52,22,'#C4D8F0',false,'right');
  }
  if(i===1){
   header(slide,d.title,2);
   text(slide,'「集合場所、どこだっけ？」',64,181,1152,95,62,colors.navy,true);
   text(slide,'集合案内はLINE。\n注意事項は別の資料。',64,320,640,140,43,colors.blue,true);
   text(slide,'スタッフ',805,314,390,46,29,colors.muted,true);
   text(slide,'必要な情報を探す',805,363,390,58,34,colors.navy,true);
   text(slide,'管理者',805,454,390,46,29,colors.muted,true);
   text(slide,'未確認の人を探す',805,503,390,58,34,colors.navy,true);
   text(slide,'自分の現場経験と、管理者・スタッフの声が出発点',64,617,1152,52,30,colors.muted);
  }
  if(i===2){
   header(slide,d.title,3);
   text(slide,'One Shift, One Timeline.',64,166,1152,72,49,colors.blue,true);
   const labels=['募集','応募','前日確認','出発','到着','勤務','完了'];
   labels.forEach((label,j)=>{const x=64+j*166;rect(slide,x,288,142,82,colors.navy);text(slide,label,x,288,142,82,29,colors.white,true,'center');if(j<6)rect(slide,x+146,319,16,20,colors.blue,'none','rightArrow');});
   text(slide,'Worker',64,451,500,48,32,colors.blue,true);
   text(slide,'次の勤務と、今やること',64,510,550,64,36,colors.navy,true);
   text(slide,'Admin',690,451,500,48,32,colors.blue,true);
   text(slide,'対応が必要な人・現場',690,510,526,64,36,colors.navy,true);
   text(slide,'目指す業務フロー。全工程の動作確認済みを示すものではありません。',64,652,1152,34,22,colors.muted);
  }
  if(i===3){
   header(slide,d.title,4);
   text(slide,'Worker / スタッフ',64,187,550,55,34,colors.blue,true);
   text(slide,'Admin / 管理者',676,187,540,55,34,colors.blue,true);
   await picture(slide,src.worker,[64,278,540,313.2],[20,303,350,203],[390,844],'Workerホームの次の勤務カードを拡大。別勤務の役割例。');
   await picture(slide,src.admin,[676,336,540,156.522],[696,306,345,100],[1440,905],'Admin前日確認の未提出表示を拡大。Worker側とは対象者・勤務日が異なる。');
   text(slide,'自分の勤務を確認',64,603,550,50,32,colors.navy,true);
   text(slide,'連絡が必要な人を確認',676,603,540,50,32,colors.navy,true);
   text(slide,'役割別の画面例（別の勤務）',676,524,540,40,24,colors.muted);
   text(slide,screenNote,64,670,1152,32,22,colors.muted);
  }
  if(i===4){
   header(slide,d.title,5);
   const labels=['応募操作','通信結果が不明','同じ受付キーで再試行','保存済みの結果を確認'];
   labels.forEach((label,j)=>{const y=181+j*116;rect(slide,64,y,520,76,j===1?colors.navy:colors.pale,j===1?'none':colors.rule);text(slide,label,84,y,480,76,32,j===1?colors.white:colors.navy,true,'center');if(j<3)rect(slide,309,y+85,30,23,colors.blue,'none','downArrow');});
   text(slide,'単一応募',682,180,534,48,32,colors.blue,true);
   text(slide,'同じ応募を\n重複登録しないために',682,241,534,115,39,colors.navy,true);
   text(slide,'設計・ソース実装あり',682,367,534,47,29,colors.navy,true);
   text(slide,'実環境での復旧動作は未検証',682,418,534,47,27,colors.muted,true);
   rect(slide,658,500,558,143,colors.pale);
   text(slide,'設計中',682,514,510,35,27,colors.blue,true);
   text(slide,'同一案件の1〜10シフト一括応募',682,557,510,37,27,colors.navy,true);
   text(slide,'全件成功 または 新規登録0件',682,601,510,31,25,colors.navy);
  }
  if(i===5){
   header(slide,d.title,6);
   text(slide,'集合・準備',64,167,540,46,31,colors.blue,true);
   text(slide,'前日確認',676,167,540,46,31,colors.blue,true);
   await picture(slide,src.detail,[64,224,540,441.257],[20,277,350,286],[390,844],'同一の勤務詳細画面から集合・準備欄を切り出した静止画。');
   await picture(slide,src.detail,[676,246,540,277.714],[20,587,350,180],[390,844],'同一の勤務詳細画面から前日確認欄を切り出した静止画。');
   text(slide,'勤務前に見直したい情報を\n一か所に',676,549,540,100,32,colors.navy,true);
   text(slide,screenNote,64,675,1152,31,22,colors.muted);
  }
  if(i===6){
   text(slide,'現場で働く人に、次の一手を',64,79,1152,100,60,colors.white,true);
   text(slide,'次は、一括応募の検証と\n現場の声をもとにした改善',64,228,1152,130,39,'#B8D7FF');
   text(slide,'OpsCue',64,414,1152,116,90,colors.white,true);
   text(slide,'募集から、現場が無事に終わるまで。',64,567,1152,75,44,colors.white,true);
  }
 }
 return {count:presentation.slides.items.length,notes:slides.map((s,i)=>({slide:i+1,characters:s.script.length,estimatedSeconds:s.speech,slotSeconds:s.slot})),font};
}

export async function writeNotes(){
 let cumulative=0;
 const lines=['# OpsCue 技育展2026オンライン予選 発表原稿','','- 発表日：2026年10月31日（土）／Zoom画面共有','- 発表枠：180秒。読み上げ推定：168秒。切替・間：12秒。','- 実測値：未実施。人による通し読みで測定し、160〜170秒へ調整する。','- 推定方法：文字数を目安に、技術用語・指示・間を考慮して配分した編集上の推定。音声計測ではない。','- 180秒以内を支える進行目安であり、発話時間を保証するものではない。','- スライドは手動切替。自動送り、アニメーション、ライブ操作に依存しない。','','|枚|発表枠|累計枠|原稿推定|実測|余裕|','|---|---:|---|---:|---|---:|'];
 slides.forEach((s,i)=>{lines.push(`|${i+1}|${s.slot}秒|${cumulative}〜${cumulative+s.slot}秒|${s.speech}秒|未実施|${s.slot-s.speech}秒|`);cumulative+=s.slot;});
 lines.push('|合計|180秒|0〜180秒|168秒|未実施|12秒|','');
 slides.forEach((s,i)=>{lines.push(`## ${i+1}. ${s.title}`,``,`原稿推定 ${s.speech}秒／発表枠 ${s.slot}秒／実測 未実施`,``,s.script,``,`進行メモ：${s.cue}`,``,`状態の注意：${s.note}`,``);});
 lines.push('## 本番前のリハーサル','','1. 原稿だけでなくスライド切替を含めて人が通し読みする。','2. 原稿160〜170秒、全体180秒以内を実測する。','3. 1:45で技術、2:20で静止画、2:45で締めへ移る。','4. 遅れた場合は3枚目の最後の一文、4枚目の役割の言い換えを短縮する。未検証・設計中の注記は省略しない。','5. Zoomの共有対象をスライドショーに設定し、発表者ノートを共有しない。','');
 await fs.writeFile(`${output}/OpsCue_GeekTen2026_SpeakerNotes.md`,lines.join('\n'),'utf8');
 await fs.writeFile(`${output}/.build/content.json`,JSON.stringify({slides,src,font,colors},null,2),'utf8');
}
