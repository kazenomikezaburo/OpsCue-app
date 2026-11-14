import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectRecruitmentList } from "../../components/worker/recruitment/project-recruitment-list";
import { ProjectRecruitmentDetail, type ProjectRecruitmentDetailProps } from "../../components/worker/recruitment/project-recruitment-detail";
import { RecruitmentProjectCard } from "../../components/worker/recruitment/recruitment-project-card";
import { createSyntheticProjectRecruitmentReader } from "../../lib/worker/recruitment/__fixtures__/project-recruitment-reader.fixture";
import { syntheticDemoDetails } from "../../lib/worker/recruitment/__fixtures__/project-recruitment.fixture";
import { readProjectRecruitmentList } from "../../lib/worker/recruitment/project-recruitment-reader";

const noop = () => {};
const detailProps: ProjectRecruitmentDetailProps = {
  detail: syntheticDemoDetails[0]!, status: "ready", selection: [], onSelectionChange: noop,
  onBack: noop, onConfirm: noop, onRetry: noop,
};
const renderDetail = (props: Partial<ProjectRecruitmentDetailProps>) => renderToStaticMarkup(createElement(ProjectRecruitmentDetail, { ...detailProps, ...props }));

test("same-name project cards open their own IDs", async () => {
  const list = await readProjectRecruitmentList(createSyntheticProjectRecruitmentReader(), null);
  assert.equal(list.status, "ready");
  if (list.status !== "ready") return;
  const opened: string[] = [];
  for (const item of list.data.items) {
    const card = RecruitmentProjectCard({ item, source: "synthetic", onOpenDetail: (id) => opened.push(id) });
    // Invoke the actual card title callback, independently of identical labels.
    card.props.children[0].props.children.props.onClick();
  }
  assert.deepEqual(opened, list.data.items.map((item) => item.project.projectId));
  assert.equal(new Set(opened).size, 2);
  const html = renderToStaticMarkup(createElement(ProjectRecruitmentList, {
    items: list.data.items, source: "synthetic", status: "ready",
    dateFilter: { value: null, dates: list.data.dates, onDateChange: noop }, onOpenDetail: noop,
  }));
  assert.equal(html.match(/<article/g)?.length, 2);
  assert.match(html, /表示中 2案件/);
  assert.doesNotMatch(html, /もっと見る|ページ送り/);
});

test("list loading, empty and failed reads remain separate and actionable", () => {
  const renderList = (status: "ready" | "error" | "loading") => renderToStaticMarkup(createElement(ProjectRecruitmentList, {
    items: [], source: "synthetic", status, dateFilter: { value: null, dates: [], onDateChange: noop }, onOpenDetail: noop, onRetry: noop,
  }));
  assert.match(renderList("ready"), /現在表示できる募集はありません/);
  assert.match(renderList("loading"), /aria-busy="true"/);
  assert.match(renderList("loading"), /読み込んでいます/);
  assert.doesNotMatch(renderList("loading"), /募集はありません/);
  assert.match(renderList("error"), /role="alert"/);
  assert.match(renderList("error"), /再読み込み/);
  assert.doesNotMatch(renderList("error"), /募集はありません/);
});

test("detail renders belonging shifts and distinct loading, empty, error and 404 states", () => {
  const ready = renderDetail({});
  for (const shift of syntheticDemoDetails[0]!.shifts) assert.ok(ready.includes(shift.jobName));
  const loading = renderDetail({ status: "loading", detail: null });
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /案件情報を読み込んでいます/);
  const empty = renderDetail({ detail: { ...syntheticDemoDetails[0]!, shifts: [] } });
  assert.match(empty, /現在表示できる公開シフトはありません/);
  const error = renderDetail({ status: "error", detail: null });
  assert.match(error, /取得できませんでした/);
  assert.match(error, /再読み込み/);
  const missing = renderDetail({ status: "not_found", detail: null });
  assert.match(missing, /404：案件を表示できません/);
  assert.match(missing, /募集一覧/);
  assert.doesNotMatch(missing, /取得できませんでした|公開シフトはありません|再読み込み/);
});

test("a retained selection cannot proceed during unavailable reads", () => {
  const first = syntheticDemoDetails[0]!.shifts[0]!;
  for (const status of ["loading", "error", "not_found"] as const) {
    const html = renderDetail({ status, detail: null, selection: [{ projectId: first.projectId, shiftId: first.shiftId }] });
    assert.match(html, /disabled=""/);
    assert.match(html, /案件情報を確認できません/);
  }
});
