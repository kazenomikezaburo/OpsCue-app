import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { Children, createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
function loadComponent(path, mocks = {}) {
  const source = readFileSync(new URL("../../" + path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, require: (name) => mocks[name] ?? require(name) });
  return exports;
}

const componentRoot = "components/worker/recruitment/";
const controls = loadComponent(componentRoot + "worker-recruitment-application-controls.tsx", {
  "next/navigation": { useRouter: () => ({}) },
  "@/app/actions/worker-shift-applications": {},
});
const views = loadComponent(componentRoot + "worker-recruitment.tsx", {
  "./shift-detail-link": loadComponent(componentRoot + "shift-detail-link.tsx"),
  "@/components/worker/recruitment/worker-recruitment-application-controls": controls,
});
const item = {
  shiftId: "10000000-0000-4000-8000-000000000001", projectName: "同名案件", jobName: "受付",
  startsAt: "2026-11-28T09:00:00+09:00", endsAt: "2026-11-28T18:00:00+09:00",
  applicationDeadline: "2026-11-27T18:00:00+09:00", workplaceName: "第一会場",
  hourlyWage: 1500, remainingCapacity: 2, description: "入場案内", requirements: [],
  eligibility: { safeReasons: [] }, state: "available",
};
const render = (component, props) => renderToStaticMarkup(createElement(component, props));

test("one card and detail link per shift despite identical project names", () => {
  const other = { ...item, shiftId: "10000000-0000-4000-8000-000000000002", jobName: "誘導" };
  const html = render(views.WorkerRecruitmentList, { items: [item, other], page: 1, hasMore: true });
  assert.equal(html.match(/<article/g)?.length, 2);
  for (const shift of [item, other]) {
    assert.ok(html.includes('href="/worker/recruitment/' + shift.shiftId + '?page=1"'));
    const detail = render(views.WorkerRecruitmentDetail, { item: shift, page: 1 });
    assert.ok(detail.includes('href="/worker/recruitment?page=1#shift-' + shift.shiftId + '"'));
  }
  for (const page of [0, 2]) assert.ok(html.includes('/worker/recruitment?page=' + page));
  assert.doesNotMatch(render(views.WorkerRecruitmentList, { items: [], page: 0, hasMore: false }), /ページ送り/);
});

for (const [state, label, action] of [
  ["available", "応募できます", "応募する"], ["available_with_warning", "確認して応募できます", "応募する"],
  ["applied", "応募済み", "応募を取り下げる"], ["accepted_waiting_assignment", "採用済み・配置待ち"],
  ["rejected", "今回は見送り"], ["withdrawn", "取下げ済み"], ["capacity_full", "定員に達しました"],
  ["deadline_passed", "応募期限を過ぎました"], ["not_eligible", "現在は応募できません"],
]) {
  test("detail renders facts and permitted operation for " + state, () => {
    const html = render(views.WorkerRecruitmentDetail, { item: { ...item, state } });
    for (const fact of [label, "第一会場", "1,500円", "入場案内", "仕事内容", "応募期限", "2人", "09:00"]) assert.ok(html.includes(fact), fact);
    if (action) assert.ok(html.includes(action));
    else assert.doesNotMatch(html, /<button/);
  });
}

test("empty, loading and failed reads have distinct accessible states", () => {
  const mocks = { "@/components/worker/recruitment/recruitment-state": loadComponent(componentRoot + "recruitment-state.tsx") };
  const empty = render(views.WorkerRecruitmentList, { items: [], hasMore: false, page: 0 });
  const loading = render(loadComponent("app/worker/recruitment/loading.tsx", mocks).default);
  const error = render(loadComponent("app/worker/recruitment/error.tsx", mocks).default, { retry() {} });
  assert.match(empty, /現在募集中の勤務はありません/);
  assert.match(loading, /確認しています/);
  assert.match(error, /role="alert"/);
  assert.match(error, /再確認/);
  assert.doesNotMatch(error, /未応募|募集中の勤務はありません/);
});

test("Next supplies retry and the recruitment recheck button refreshes then calls reset", () => {
  // Next 16.4.2 supports both props; retry is the documented recovery operation
  // and invokes refresh + reset. Run the installed boundary, not a re-created
  // implementation or a retry mock that assumes this contract.
  const { ErrorBoundaryHandler } = require("next/dist/client/components/error-boundary");
  const RecruitmentError = loadComponent("app/worker/recruitment/error.tsx", {
    "@/components/worker/recruitment/recruitment-state": loadComponent(componentRoot + "recruitment-state.tsx"),
  }).default;
  const recovered = createElement("p", null, "Recovered recruitment view");
  const boundary = new ErrorBoundaryHandler({
    pathname: "/worker/recruitment", errorComponent: RecruitmentError, children: recovered,
  });
  const error = new Error("Private diagnostic must not be exposed");
  boundary.state = { ...boundary.state, ...ErrorBoundaryHandler.getDerivedStateFromError(error) };

  // Only the router transport and React's mounted setState delivery are stubbed.
  // No actual router, Server Action, Auth, DB or network connection is used.
  const calls = [];
  boundary.context = { refresh() { calls.push("refresh"); } };
  boundary.setState = (update) => { boundary.state = { ...boundary.state, ...update }; };
  const reset = boundary.reset;
  boundary.reset = () => { calls.push("reset"); reset(); };
  const fallback = Children.toArray(boundary.render().props.children)
    .find((child) => isValidElement(child) && child.type === RecruitmentError);
  assert.ok(fallback, "Next must render the actual recruitment error component");
  assert.equal(fallback.props.retry, boundary.retry);
  assert.equal(fallback.props.reset, boundary.reset);
  const html = renderToStaticMarkup(fallback);
  assert.match(html, /role="alert"/);
  assert.match(html, /<button[^>]*>再確認<\/button>/);
  assert.doesNotMatch(html, /Private diagnostic|未応募|募集中の勤務はありません/);

  // Traverse the actual route and actual RecruitmentState JSX to click its
  // rendered button. Do not call the recovery prop directly from the test.
  const main = fallback.type(fallback.props);
  const state = main.props.children;
  const panel = state.type(state.props);
  const button = Children.toArray(panel.props.children)
    .find((child) => isValidElement(child) && child.type === "button");
  assert.ok(button, "The retry prop supplied by Next must make the button visible");
  assert.equal(button.props.children, "再確認");
  assert.deepEqual(calls, [], "Rendering must not initiate recovery");
  button.props.onClick();
  assert.deepEqual(calls, ["refresh", "reset"]);
  assert.equal(boundary.state.error, null);
  assert.equal(boundary.render(), recovered);
});
