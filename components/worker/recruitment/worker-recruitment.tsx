import Link from "next/link";
import { ShiftDetailLink } from "./shift-detail-link";
import { WorkerRecruitmentApplicationControls } from "@/components/worker/recruitment/worker-recruitment-application-controls";
import type { RecruitmentShift } from "@/lib/worker/recruitment/get-worker-recruitment";

const date = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short" });
const time = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false });
const status: Record<RecruitmentShift["state"], string> = { available: "応募できます", available_with_warning: "確認して応募できます", not_eligible: "現在は応募できません", applied: "応募済み", accepted_waiting_assignment: "採用済み・配置待ち", rejected: "今回は見送り", withdrawn: "取下げ済み", capacity_full: "定員に達しました", deadline_passed: "応募期限を過ぎました" };
const reason: Record<string, string> = { required_conditions_not_met: "必要な資格・スキルを満たしていません", other_scheduled_shift_overlaps: "ほかの予定勤務と時間が重なっています", availability_unavailable: "この時間は勤務不可として登録されています", availability_needs_confirmation: "勤務可否の確認が必要です", preference_not_matched: "登録した希望条件とは一致しません" };

function pay(item: RecruitmentShift) { const values = [item.hourlyWage == null ? null : `時給 ${item.hourlyWage.toLocaleString("ja-JP")}円`, item.transportationFeeCap == null ? null : `交通費 上限${item.transportationFeeCap.toLocaleString("ja-JP")}円`].filter(Boolean); return values.join(" / ") || "条件は詳細で確認"; }
function safeUrl(value: string | null) { if (!value) return null; try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null; } catch { return null; } }

const card = "min-w-0 rounded-card border border-border bg-surface p-4 sm:p-5";
const link = "inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-link underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-focus-ring";
const layout = "mx-auto max-w-3xl space-y-4 px-4 py-6 text-foreground sm:px-6";

function schedule(item: RecruitmentShift) {
  const start = new Date(item.startsAt);
  const end = new Date(item.endsAt);
  const endDate = date.format(start) === date.format(end) ? "" : date.format(end) + " ";
  return `${date.format(start)} ${time.format(start)}〜${endDate}${time.format(end)}`;
}

function ShiftStatus({ item }: { item: RecruitmentShift }) {
  return (
    <div className="space-y-1 text-sm">
      <span className="inline-block rounded-pill bg-surface-muted px-3 py-1 font-semibold">{status[item.state]}</span>
      {item.eligibility.safeReasons.filter((code) => Object.hasOwn(reason, code)).map((code) => (
        <p key={code} className="text-warning-foreground">{reason[code]}</p>
      ))}
    </div>
  );
}

function RecruitmentTerms({ item }: { item: RecruitmentShift }) {
  const deadline = new Date(item.applicationDeadline);
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <Item label="残り枠">{item.remainingCapacity}人</Item>
      <Item label="応募期限">{date.format(deadline)} {time.format(deadline)}</Item>
    </dl>
  );
}

export function WorkerRecruitmentList({ items, hasMore, page }: { items: RecruitmentShift[]; hasMore: boolean; page: number }) {
  return (
    <main className={layout}>
      <h1 className="text-2xl font-semibold">勤務を探す</h1>
      {items.length === 0 && <p role="status" className={card}>現在募集中の勤務はありません。</p>}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.shiftId}>
            <article className={card}>
              <p className="break-words text-xs text-foreground-muted">{item.projectName}</p>
              <h2 className="break-words text-lg font-semibold">
                <ShiftDetailLink shiftId={item.shiftId} page={page} className={link}>{item.jobName}</ShiftDetailLink>
              </h2>
              <div className="space-y-3 text-sm text-foreground-secondary">
                <p className="font-semibold text-foreground">{schedule(item)}</p>
                <p>{item.workplaceName}{item.meetingAt && ` / 集合 ${time.format(new Date(item.meetingAt))}`}</p>
                <p>{pay(item)}</p>
                <RecruitmentTerms item={item} />
                <ShiftStatus item={item} />
              </div>
            </article>
          </li>
        ))}
      </ul>
      {(page > 0 || hasMore) && (
        <nav aria-label="ページ送り" className="flex gap-4">
          {page > 0 && <Link href={`/worker/recruitment?page=${page - 1}`} className={link}>前へ</Link>}
          {hasMore && <Link href={`/worker/recruitment?page=${page + 1}`} className={link}>次へ</Link>}
        </nav>
      )}
    </main>
  );
}

export function WorkerRecruitmentDetail({ item, page = 0 }: { item: RecruitmentShift; page?: number }) {
  const manual = safeUrl(item.manualUrl);
  const map = safeUrl(item.mapUrl);
  return (
    <main className={layout}>
      <Link href={`/worker/recruitment${page ? `?page=${page}` : ""}#shift-${item.shiftId}`} className={link}>募集中の勤務へ戻る</Link>
      <header className="space-y-1">
        <p className="break-words text-sm text-foreground-muted">{item.projectName}</p>
        <h1 className="break-words text-2xl font-semibold">{item.jobName}</h1>
        <p>{schedule(item)}</p>
      </header>
      <section className={card}>
        <h2 className="mb-3 text-base font-semibold">応募状況</h2>
        <div className="space-y-4">
          <ShiftStatus item={item} />
          <RecruitmentTerms item={item} />
        </div>
        <WorkerRecruitmentApplicationControls shiftId={item.shiftId} state={item.state} />
      </section>
      <section className={card}>
        <h2 className="text-lg font-semibold">勤務情報</h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <Item label="勤務地">{item.workplaceName}<br />{item.workplaceAddress}</Item>
          {item.meetingAt && <Item label="集合時刻">{date.format(new Date(item.meetingAt))} {time.format(new Date(item.meetingAt))}</Item>}
          {item.meetingNote && <Item label="集合案内">{item.meetingNote}</Item>}
          {item.accessNote && <Item label="アクセス">{item.accessNote}</Item>}
          {item.description && <Item label="仕事内容">{item.description}</Item>}
          {item.clothingNote && <Item label="服装">{item.clothingNote}</Item>}
          {item.belongingsNote && <Item label="持ち物">{item.belongingsNote}</Item>}
          {item.mealNotes && <Item label="食事">{item.mealNotes}</Item>}
          {item.recruitmentNotes && <Item label="募集補足">{item.recruitmentNotes}</Item>}
          {manual && <Item label="業務資料"><a className="text-link underline" href={manual} target="_blank" rel="noreferrer">業務資料を開く</a></Item>}
          {map && <Item label="地図"><a className="text-link underline" href={map} target="_blank" rel="noreferrer">地図を開く</a></Item>}
        </dl>
      </section>
      <section className={card}>
        <h2 className="text-lg font-semibold">条件・報酬</h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <Item label="時給">{item.hourlyWage == null ? "未設定" : `${item.hourlyWage.toLocaleString("ja-JP")}円`}</Item>
          <Item label="交通費">{item.transportationFeeCap == null ? "未設定" : `上限${item.transportationFeeCap.toLocaleString("ja-JP")}円`}</Item>
          {item.requirementsText && <Item label="応募条件">{item.requirementsText}</Item>}
          {item.requirements.length > 0 && <Item label="必要な資格・スキル">{item.requirements.map((r) => r.name).join("、")}</Item>}
        </dl>
      </section>
    </main>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-foreground-muted">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-foreground">{children}</dd>
    </div>
  );
}
