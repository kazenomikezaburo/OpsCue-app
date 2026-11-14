# OpsCue UIスクリーンショット一覧

## 概要

保存済みのAdmin 54枚・Worker 27枚、合計81枚を確認するためのカタログです。ローカルWebアプリの表示確認であり、全機能の動作、DB/RLS、外部連携、本番環境の安全性を保証するものではありません。HTTP成功だけでPASSにはしていません。

| 項目 | 内容 |
| --- | --- |
| 対象ブランチ | main |
| 対象コミット | e1fd3ec989f00a71aba9490f88e3740d197f1900 |
| ベースURL | http://localhost:3000 |
| Admin | Chrome・Viewport 1440×900px・54枚 |
| Worker | Brave・Viewport 390×844px・27枚 |
| Admin撮影期間（JST） | 2026-10-20 18:53:55〜18:57:11 |
| Worker撮影期間（JST） | 2026-10-20 19:46:52〜19:49:01 |
| 形式 | 全81枚PNG。Adminは全体画像等を含み寸法可変、Workerは全27枚390×844px |
| 認証 | Admin：TEST Manager A、Worker：TEST Worker A |
| ブラウザーバージョン | 未取得（製品名・接続環境のみ確認） |

撮影期間は保存済みPNGの作成・最終更新時刻をJSTに換算した範囲です。シャッター時刻の独立ログはありません。画像保存時のローカル証拠を記録しており、後日の表示や状態を保証しません。撮影後の画像確認とPNG形式確認は実施済みです。

## 画面確認結果

PASS：表示と主要UIを確認。FAIL：表示不具合を確認。BLOCKED：認証・権限・データ・安全条件により確認不可。NOT_TESTED：未実施。PASSは全操作の成功や撮影範囲外の見た目を保証しません。FAIL・BLOCKEDの画像が保存されていてもPASSへ変更しません。

### 調査対象ルートの集計（転送専用4ルートを含む）

| 対象 | ルート数 | PASS | FAIL | BLOCKED | NOT_TESTED |
| --- | ---: | ---: | ---: | ---: | ---: |
| Admin | 28 | 23 | 3 | 2 | 0 |
| Worker | 13 | 11 | 0 | 2 | 0 |
| 合計 | 41 | 34 | 3 | 4 | 0 |

同一ルートのタブ・編集・ドロワー・データ状態は追加表示状態であり、ルート数に加算しません。Adminは追加表示状態の不整合を親ルートにもFAILとして反映しています。

### 独立画面の集計（旧URL転送4件を除外）

| 対象 | 独立画面数 | PASS | FAIL | BLOCKED | NOT_TESTED |
| --- | ---: | ---: | ---: | ---: | ---: |
| Admin | 24 | 19 | 3 | 2 | 0 |
| Worker | 13 | 11 | 0 | 2 | 0 |
| 合計 | 37 | 30 | 3 | 4 | 0 |

### 旧URLからのリダイレクト（独立画面ではない）

4件とも転送結果はPASS。転送元固有の画像は作成せず、転送先画面を参照します。以下の `P`・`J` は後述の実在テストIDです。

| 転送元 | 実際の最終到達先 |
| --- | --- |
| `/admin/pre-shift` | `/admin/shifts/pre-shift?date=2026-10-21` |
| `/admin/day-of` | `/admin/shifts/day-of?date=2026-10-20` |
| `/admin/projects/[P]/jobs/[J]/shifts/new` | `/admin/shifts/new?projectId=[P]&jobId=[J]` |
| `/admin/projects/[P]/jobs/[J]/shifts/bulk-new` | `/admin/shifts/new?projectId=[P]&jobId=[J]` |

## スクリーンショット一覧

画像は下記の相対リンクから開けます。ルートはベースURLからの相対URLです。クエリも撮影状態の一部です。架空IDによる表示成功判定はしていません。

| テストIDの略記 | 実値 |
| --- | --- |
| P：TEST Project N1 | `e0000000-0000-0000-0000-000000000001` |
| J：TEST Job N1 | `10000000-0000-0000-0000-000000000001` |
| S：2099-01-15のシフト | `20000000-0000-0000-0000-000000000001` |
| W：TEST Worker A（スタッフID） | `c0000000-0000-0000-0000-000000000001` |
| A：TEST Worker Bの配置 | `40000000-0000-0000-0000-000000000002` |

### Admin（54枚）

#### ホーム・要対応

| 画面名・画像リンク | 対応するルート | 表示状態 | 注意事項 |
| --- | --- | --- | --- |
| [ホーム](admin/home.png) | `/admin` | 今日の空状態・サマリー | — |
| [要対応](admin/attention.png) | `/admin/attention` | 未対応0件 | — |

#### 案件・業務・勤務先

| 画面名・画像リンク | 対応するルート | 表示状態 | 注意事項 |
| --- | --- | --- | --- |
| [案件一覧](admin/projects.png) | `/admin/projects` | テスト案件5件 | — |
| [新規案件セットアップ](admin/projects-new.png) | `/admin/projects/new` | 未入力フォーム | 固定フッター重なり |
| [案件詳細](admin/projects-detail.png) | `/admin/projects/e0000000-0000-0000-0000-000000000001` | TEST Project N1・概要 | — |
| [案件内シフト](admin/projects-detail-shifts.png) | `/admin/projects/e0000000-0000-0000-0000-000000000001?tab=shifts` | 778件の一覧先頭 | 1440×900の範囲のみ |
| [案件履歴](admin/projects-detail-history.png) | `/admin/projects/e0000000-0000-0000-0000-000000000001?tab=history` | 変更履歴の先頭ページ | — |
| [案件編集](admin/projects-edit.png) | `/admin/projects/e0000000-0000-0000-0000-000000000001?edit=1` | 既存案件の編集フォーム | 保存未実施・固定フッター重なり |
| [業務・勤務先追加](admin/project-jobs-new.png) | `/admin/projects/e0000000-0000-0000-0000-000000000001/jobs/new` | 独立した追加フォーム | 送信未実施 |
| [業務追加ドロワー](admin/project-jobs-new-drawer.png) | `/admin/projects/e0000000-0000-0000-0000-000000000001` | 業務・勤務先を追加を開いた状態 | 下部未収録 |
| [業務編集ドロワー](admin/project-jobs-edit-drawer.png) | `/admin/projects/e0000000-0000-0000-0000-000000000001` | TEST Job N1を編集する表示 | 下部未収録・保存未実施 |
| [案件内勤務先追加](admin/project-workplaces-new-drawer.png) | `/admin/projects/e0000000-0000-0000-0000-000000000001?edit=1` | 新しい勤務先・会場を登録を開いた状態 | 下部未収録 |
| [案件内勤務先編集](admin/project-workplaces-edit-drawer.png) | `/admin/projects/e0000000-0000-0000-0000-000000000001?edit=1` | TEST Nagoya Workplaceの編集表示 | 下部未収録・保存未実施 |

#### シフト

| 画面名・画像リンク | 対応するルート | 表示状態 | 注意事項 |
| --- | --- | --- | --- |
| [シフト一覧](admin/shifts.png) | `/admin/shifts` | 今後のシフト26件 | — |
| [シフト週表示](admin/shifts-week.png) | `/admin/shifts?view=week&period=upcoming&status=all&staffing=all&date=2026-10-20` | 2026年10月19日〜25日・0件 | — |
| [シフト月表示](admin/shifts-calendar.png) | `/admin/shifts?view=calendar&period=upcoming&status=all&staffing=all&month=2026-10` | 2026年10月 | — |
| [シフト作成入口](admin/shifts-new.png) | `/admin/shifts/new` | 案件・業務未選択 | — |
| [シフト作成フォーム](admin/shifts-new-form.png) | `/admin/shifts/new?projectId=e0000000-0000-0000-0000-000000000001&jobId=10000000-0000-0000-0000-000000000001` | TEST Project N1 / TEST Job N1選択済み | 作成未実施・固定フッター重なり |
| [シフト概要](admin/shifts-detail.png) | `/admin/shifts/20000000-0000-0000-0000-000000000001` | 2099年1月15日・必要3名／配置1名 | 親ルートの総合判定はFAIL（当日確認の不整合） |
| [シフト応募](admin/shifts-detail-applications.png) | `/admin/shifts/20000000-0000-0000-0000-000000000001?tab=applications` | 応募2名 | 配置・承認未実施 |
| [シフト配置](admin/shifts-detail-placement.png) | `/admin/shifts/20000000-0000-0000-0000-000000000001?tab=placement` | ポジション未設定・対象スタッフ1名 | — |
| [シフト前日確認](admin/shifts-detail-confirmation-pre.png) | `/admin/shifts/20000000-0000-0000-0000-000000000001?tab=confirmation&phase=pre` | TEST Worker B・未確認 | 当日確認との不整合あり |
| [シフト当日確認](admin/shifts-detail-confirmation-day.png) | `/admin/shifts/20000000-0000-0000-0000-000000000001?tab=confirmation&phase=day` | TEST Worker B・提出済み表示 | FAIL：前日確認との不整合 |
| [シフト編集](admin/shifts-edit.png) | `/admin/shifts/20000000-0000-0000-0000-000000000001?edit=1` | 既存シフトの編集表示 | 保存未実施・固定フッター重なり |
| [配置候補選択](admin/shifts-candidates.png) | `/admin/shifts/20000000-0000-0000-0000-000000000001?tab=placement&candidate=picker` | 候補者5名のドロワー | 選択・確定未実施・内部スクロール下部未収録 |
| [配置追加](admin/shifts-placement-new.png) | `/admin/shifts/20000000-0000-0000-0000-000000000001?tab=placement&placement=create` | 配置エディタを開いた状態 | 保存未実施 |
| [配置編集](admin/shifts-placement-edit.png) | `/admin/shifts/20000000-0000-0000-0000-000000000001?tab=placement&assignmentId=40000000-0000-0000-0000-000000000002` | TEST Worker Bの配置編集表示 | 保存未実施 |
| [シフト前日確認詳細](admin/shifts-confirmation-pre-detail.png) | `/admin/shifts/20000000-0000-0000-0000-000000000001?tab=confirmation&phase=pre&assignmentId=40000000-0000-0000-0000-000000000002` | まだ提出されていません | 当日詳細との不整合あり |
| [シフト当日確認詳細](admin/shifts-confirmation-day-detail.png) | `/admin/shifts/20000000-0000-0000-0000-000000000001?tab=confirmation&phase=day&assignmentId=40000000-0000-0000-0000-000000000002` | 提出済み・勤務可能 | FAIL：前日詳細との不整合 |

#### 横断運用・勤怠

| 画面名・画像リンク | 対応するルート | 表示状態 | 注意事項 |
| --- | --- | --- | --- |
| [配置・休憩回し](admin/placement.png) | `/admin/placement?date=2099-01-15` | 実在テスト勤務日・1シフト | — |
| [配置・休憩編集](admin/placement-detail.png) | `/admin/placement?date=2099-01-15&shift=20000000-0000-0000-0000-000000000001` | シフト選択・編集ドロワー | 応募0名表示は要調査・保存未実施 |
| [前日確認](admin/shifts-pre-shift.png) | `/admin/shifts/pre-shift?date=2099-01-15` | 1名・未確認 | — |
| [前日確認詳細](admin/shifts-pre-shift-detail.png) | `/admin/shifts/pre-shift?date=2099-01-15&assignment=40000000-0000-0000-0000-000000000002` | まだ提出されていません | — |
| [当日確認](admin/shifts-day-of.png) | `/admin/shifts/day-of?date=2099-01-15` | 1名・前日確認は提出済み表示 | FAIL：状態不整合 |
| [当日確認詳細](admin/shifts-day-of-detail.png) | `/admin/shifts/day-of?date=2099-01-15&assignment=40000000-0000-0000-0000-000000000002` | 提出済み・勤務可能 | FAIL：状態不整合 |
| [勤怠一覧](admin/attendance.png) | `/admin/attendance?date=2099-01-15` | TEST Worker B・1件 | 欠勤操作未実施 |
| [勤怠詳細エラー](admin/attendance-detail-error.png) | `/admin/attendance/40000000-0000-0000-0000-000000000002` | 勤怠詳細を取得できませんでした | FAIL：display_nameのnull参照 |

#### スタッフ

| 画面名・画像リンク | 対応するルート | 表示状態 | 注意事項 |
| --- | --- | --- | --- |
| [スタッフ一覧](admin/workers.png) | `/admin/workers` | 5名 | — |
| [スタッフ概要](admin/workers-detail.png) | `/admin/workers/c0000000-0000-0000-0000-000000000001` | TEST Worker A | — |
| [スタッフ資格](admin/workers-detail-credentials.png) | `/admin/workers/c0000000-0000-0000-0000-000000000001?tab=credentials` | スキル・資格なし | — |
| [スタッフ勤務条件](admin/workers-detail-conditions.png) | `/admin/workers/c0000000-0000-0000-0000-000000000001?tab=conditions` | 登録なし・閲覧専用 | — |
| [スタッフ勤務履歴](admin/workers-detail-history.png) | `/admin/workers/c0000000-0000-0000-0000-000000000001?tab=history` | 200件・先頭ページ | — |
| [スタッフ基本情報](admin/workers-detail-profile.png) | `/admin/workers/c0000000-0000-0000-0000-000000000001?tab=profile` | テストプロフィール・Auth連携済み | — |

#### 連絡・マスタ・設定

| 画面名・画像リンク | 対応するルート | 表示状態 | 注意事項 |
| --- | --- | --- | --- |
| [ヘルプリクエスト](admin/incidents.png) | `/admin/incidents` | 未解決データなし | — |
| [お知らせ一覧](admin/announcements.png) | `/admin/announcements` | データなし | — |
| [お知らせ作成](admin/announcements-new.png) | `/admin/announcements/new` | 空の下書きフォーム・プレビュー | 保存未実施 |
| [取引先一覧](admin/clients.png) | `/admin/clients` | 3件 | — |
| [取引先追加](admin/clients-new.png) | `/admin/clients` | 追加ドロワー | 保存未実施 |
| [取引先編集](admin/clients-edit.png) | `/admin/clients` | TEST Nagoya Clientの編集ドロワー | 保存未実施 |
| [勤務先一覧](admin/workplaces.png) | `/admin/workplaces` | 3件 | — |
| [勤務先追加](admin/workplaces-new.png) | `/admin/workplaces` | 追加ドロワー | 内部スクロール下部未収録 |
| [勤務先編集](admin/workplaces-edit.png) | `/admin/workplaces` | TEST Nagoya Workplaceの編集ドロワー | 下部未収録・保存未実施 |
| [スキル・資格の権限制限](admin/staff-credentials-blocked.png) | `/admin/staff-credentials` | System Adminのみ管理可能 | BLOCKED・正常画面のPASSではない |
| [設定](admin/settings.png) | `/admin/settings` | 準備中 | 設定機能の動作確認ではない |

### Worker（27枚）

#### ホーム・募集

| 画面名・画像リンク | 対応するルート | 表示状態 | 注意事項 |
| --- | --- | --- | --- |
| [ホーム](worker/home.png) | `/worker` | TEST Worker A・次の勤務 | — |
| [募集一覧](worker/recruitment.png) | `/worker/recruitment` | 一覧先頭 | 全体撮影の固定ナビ重なりによりViewport採用 |
| [応募可能な募集詳細](worker/recruitment-detail.png) | `/worker/recruitment/ecdc8574-aca1-4c91-8889-3559ad43faf6` | 確認して応募できます | 応募未実施 |
| [取下げ済みの募集詳細](worker/recruitment-detail-withdrawn.png) | `/worker/recruitment/1707a247-059b-49df-95cc-f893ecf17eb7` | 取下げ済み | — |
| [応募済みの募集詳細](worker/recruitment-detail-applied.png) | `/worker/recruitment/fa5a1a7f-7c2c-47b8-b4a5-98d2071493d8` | 応募済み | 取下げ未実施 |
| [見送りの募集詳細](worker/recruitment-detail-rejected.png) | `/worker/recruitment/7942aea0-66ec-4c21-b342-fbfdbe018518` | 今回は見送り | — |
| [採用済みの募集詳細](worker/recruitment-detail-accepted.png) | `/worker/recruitment/7a0ad3ab-9de0-46af-8f69-99af443f03b4` | 採用済み・配置待ち | — |
| [応募不可の募集詳細](worker/recruitment-detail-unavailable.png) | `/worker/recruitment/d832bd42-2bd1-47ce-a1cf-ca034ca9816f` | 現在は応募できません | — |

#### 勤務・ヘルプ

| 画面名・画像リンク | 対応するルート | 表示状態 | 注意事項 |
| --- | --- | --- | --- |
| [My Shifts](worker/shifts.png) | `/worker/shifts` | これからの勤務・一覧先頭 | 全体撮影の固定ナビ重なりによりViewport採用 |
| [次回勤務詳細](worker/assignments-detail.png) | `/worker/assignments/40000000-0000-0000-0000-000000000005` | 前日確認済みの勤務・画面上部 | テストの体調回答を含む・タイムライン下部未収録 |
| [未確認の勤務詳細](worker/assignments-detail-unconfirmed.png) | `/worker/assignments/994ecf83-b68e-482f-ad32-dd5f198f91f9` | 未確認・受付終了 | — |
| [勤務中データの詳細](worker/assignments-detail-working.png) | `/worker/assignments/8eaa635a-9d85-4f09-9df6-3730bdac1606` | 勤務中データの画面上部 | 勤務中・勤務完了の表示箇所は撮影範囲外 |
| [勤務終了の詳細](worker/assignments-detail-ended.png) | `/worker/assignments/a9cc14e1-c45b-44f5-8202-3f06c20b5f4c` | スクロール後・勤務終了タイムライン | — |
| [会社取消の詳細](worker/assignments-detail-company-cancelled.png) | `/worker/assignments/56ec4cd9-36d5-4a67-8ef4-171e1d428680` | スクロール後・取消 | 詳細は共通の取消表示 |
| [本人取消の詳細](worker/assignments-detail-self-cancelled.png) | `/worker/assignments/900afeb1-dd49-4ce1-b660-ef78767bb6d2` | スクロール後・取消 | 詳細は共通の取消表示 |
| [無断欠勤の詳細](worker/assignments-detail-no-show.png) | `/worker/assignments/1424b956-78e8-4dd6-b4c8-3e9d80e7560c` | スクロール後・取消 | 一覧では無断欠勤、詳細は取消 |
| [欠勤の詳細](worker/assignments-detail-absent.png) | `/worker/assignments/aa1ac3f8-8ee7-42c8-a8d9-97e4ae8e9d8f` | スクロール後・取消 | 一覧では欠勤、詳細は取消 |
| [助けを求める](worker/assignments-help-modal.png) | `/worker/assignments/40000000-0000-0000-0000-000000000005` | 空のヘルプモーダルを開いた状態 | 送信未実施・モーダル下部未収録 |

#### 条件・サポート・連絡・設定

| 画面名・画像リンク | 対応するルート | 表示状態 | 注意事項 |
| --- | --- | --- | --- |
| [勤務可能時間・希望条件](worker/availability.png) | `/worker/availability` | 登録なし・フォーム上部 | 希望条件欄は撮影範囲外・保存未実施 |
| [勤務可否・希望条件：改善版上部](worker/availability-v2-top.png) | `/worker/availability` | 勤務可能時間・フォーム上部 | 改善版3枚を組み合わせて確認 |
| [勤務可否・希望条件：改善版中間](worker/availability-v2-middle.png) | `/worker/availability` | 現在の登録・希望曜日・希望時刻 | 改善版3枚を組み合わせて確認 |
| [勤務可否・希望条件：改善版下部](worker/availability-v2-bottom.png) | `/worker/availability` | 希望時刻・参考条件・保存領域 | 改善版3枚を組み合わせて確認 |
| [サポート](worker/support.png) | `/worker/support` | 案内とリンク | — |
| [お知らせ一覧](worker/announcements.png) | `/worker/announcements` | 公開中のお知らせなし | — |
| [通知一覧](worker/notifications.png) | `/worker/notifications` | 未読67件・一覧先頭 | 既読化なし・全体撮影の固定ナビ重なりによりViewport採用 |
| [マイページ](worker/mypage.png) | `/worker/mypage` | TEST Worker A・設定入口 | ログアウト未実施 |
| [LINE連携](worker/settings-line.png) | `/worker/settings/line` | 未連携・リマインダーOFF | 連携・設定変更未実施・下部の一部は範囲外 |

## 不具合・確認事項

### Admin：確認済みのエラー・表示不整合

- **勤怠詳細の取得エラー（FAIL）**：`/admin/attendance/40000000-0000-0000-0000-000000000002`で「勤怠詳細を取得できませんでした。」を表示。コンソールに `Failed to load attendance detail`、`TypeError: Cannot read properties of null (reading 'display_name')` を確認。スタックは `getAttendanceDetail`。根本原因・修正方法は未調査。
- **前日確認の状態不整合（FAIL）**：同じ配置A・勤務日2099-01-15について、前日確認一覧・詳細は「未確認」「まだ提出されていません。」、当日確認一覧・詳細は「提出済み」「提出済み・勤務可能」。シフト内タブと横断モニターの双方で観測。どちらの状態が正しいかは未確認。
- FAIL 3ルートは `/admin/attendance/[assignmentId]`、`/admin/shifts/[shiftId]`、`/admin/shifts/day-of`。前日確認の同じ不整合が2ルートに影響しており、3件の独立した根本原因が確定したという意味ではない。

### Admin：未調査の疑義・BLOCKED

- **応募人数の表示差（疑義）**：同じシフトSの概要・応募タブは2名、`/admin/placement?date=2099-01-15&shift=20000000-0000-0000-0000-000000000001`のコンテキストは0名。集計定義の差か不具合かは未確定。
- **BLOCKED**：`/admin/staff-credentials`はSystem Admin権限が必要。現在のManagerでは権限不足。
- **BLOCKED**：`/admin/announcements/[announcementId]`は実在のお知らせデータなし。詳細・下書き編集は未確認。ヘルプリクエスト詳細も対象データなし（追加状態であり別ルート数には加算しない）。

### Worker：確認済みの表示差・未調査の疑義

- **勤務完了と勤務中の表示差（疑義）**：`/worker/assignments/8eaa635a-9d85-4f09-9df6-3730bdac1606`のタイムラインは「勤務完了」、勤怠欄は「勤務中」。異なる業務状態の投影である可能性があり、不具合とは未確定。該当箇所は保存画像の範囲外で、巡回時のDOM確認に基づく記録。
- **取消理由の共通表示（観測事実・妥当性未調査）**：一覧では会社取消・本人取消・無断欠勤・欠勤と分かれるが、詳細タイムラインは共通して「取消」。根本原因や仕様違反は未確定。
- **BLOCKED**：`/worker/announcements/[announcementId]`は本人に公開された実在データなし。
- **BLOCKED**：`/worker/notifications/[notificationId]`は安全な実在URLと、呼出先RPCの副作用を確定できず未アクセス。権限回避や内部状態からのID取得は行っていない。
- 通知一覧の「開く」は既読化を伴うためクリックしていない。未読67件の一覧表示のみ確認・撮影し、通知モーダルは未確認。画像のために既読化・通知作成は行っていない。
- 読み取り巡回時のコンソールerror／warnは取得範囲で0件。全機能や将来のエラー不在を保証しない。

## 撮影品質・制限

- Adminの一部全体画像では固定フッターが画像途中のコンテンツに重なる。固定要素を含む全体撮影の見え方であり、すべてをアプリの実表示不具合と断定しない。
- Adminの一部ドロワーは内部スクロール下部が未収録。特に案件内の業務追加・編集、勤務先追加・編集、および長い候補・勤務先フォーム。全体画像だけで全項目を網羅したとは扱わない。
- Adminの全体画像はページに応じて高さが変わり、一部はスクロールバーを除いた幅1424px。Viewport自体は1440×900pxを実測。案件シフトタブは長大なため1440×900pxの先頭範囲を保存。
- WorkerはChromeではなく、ユーザー承認によりBraveの独立したWorkerセッションで撮影。Chromeとの一致は未検証。
- WorkerのNext.js開発用表示が左下のホームナビに重なる。設定変更・非表示化・画像加工による隠蔽はしていない。
- Workerの募集一覧・My Shifts・通知一覧は全体撮影時の固定下部ナビの重なりを確認したため、保存はViewport画像を優先。ほかのWorker画像も390×844pxで、長い画面全体の収録ではない。
- Workerのヘルプモーダルは開いた状態を保存。内部スクロール下部の送信・キャンセル部分は未収録。入力・送信はしていない。
- Workerの勤務可能日・希望条件の希望条件欄、勤務詳細タイムライン・勤怠の一部、LINE画面下部などは撮影範囲外。特に勤務中ファイルは画面上部のみで、勤務中表示の証拠画像としては不十分。
- 状態別勤務の終了・取消画像はスクロール後のタイムライン範囲。全画像がページ先頭とは限らない。ファイル名だけから画面内に全状態情報が含まれると推定しない。
- 非テストの個人情報・秘密情報・健康情報を避ける確認を行い、実在テストデータのみ使用。次回撮影でも再確認が必要。テストの体調回答は次回勤務詳細画像に含まれる。
- 応募・辞退・勤務確認・ヘルプ送信・保存・削除・既読化などの更新操作は未実施。スクリーンショット用にデータや日時を変更していない。

## 今後の確認項目

以下は未実施の作業候補であり、このREADME作成による実行承認ではありません。

1. 固定フッター・内部スクロール・開発用表示を考慮した撮影品質の改善。既存PNGの上書き・追加撮影は別途承認。
2. AdminのFAIL 3ルートの原因調査。勤怠詳細のnull参照、前日・当日確認の表示経路を確認。
3. 応募人数の集計定義とWorkerの状態表示の整合性確認。
4. BLOCKED 4ルートを、適切な権限・安全な既存テストデータ・副作用確認のもとで再確認。
5. Figmaデザインとの比較（今回は未実施）。
6. Worker勤務条件・勤務中表示・モーダル下部など未収録箇所の追加確認。

## カタログ検証

本README作成時に、Admin 54件・Worker 27件の相対PNGリンクを対象として、ファイル存在・重複・掲載漏れを読み取り検証します。画像枚数とルート数は異なります。作成対象は本READMEのみで、PNG・アプリソース・DB・外部サービスは変更しません。
