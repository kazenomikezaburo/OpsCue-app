import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(relative, resolve, browser) {
  const source = readFileSync(new URL("../../" + relative, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, require: resolve, window: browser });
  return exports;
}

// Exercise the actual composition, hook, reader and synthetic data together.
// Only React scheduling/JSX, the dialog and leaf views are simulated.
function harness() {
  const slots = [], effects = [];
  let cursor = 0, tree;
  const listeners = new Set();
  const entries = [{ __NA: true, tree: "next-metadata" }];
  let entryIndex = 0;
  function travel(delta) {
    const nextIndex = entryIndex + delta;
    if (nextIndex < 0 || nextIndex >= entries.length) return;
    entryIndex = nextIndex;
    for (const listener of listeners) listener({ state: entries[entryIndex] });
  }
  const browser = {
    history: {
      get state() { return entries[entryIndex]; },
      replaceState(state) { entries[entryIndex] = state; },
      pushState(state) { entries.splice(++entryIndex, entries.length, state); },
      back() { travel(-1); },
      forward() { travel(1); },
    },
    addEventListener(name, listener) { assert.equal(name, "popstate"); listeners.add(listener); },
    removeEventListener(name, listener) { assert.equal(name, "popstate"); listeners.delete(listener); },
  };
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
      return [slots[i], (next) => { slots[i] = typeof next === "function" ? next(slots[i]) : next; }];
    },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
    useId() { cursor++; return "demo-test"; },
    useMemo(make, deps) {
      const i = cursor++;
      if (!slots[i] || deps.some((dep, j) => !Object.is(dep, slots[i].deps[j]))) slots[i] = { deps, value: make() };
      return slots[i].value;
    },
    useCallback(fn, deps) { return hooks.useMemo(() => fn, deps); },
    useEffect(effect, deps) {
      const i = cursor++;
      const previous = slots[i];
      if (!previous || deps.some((dep, j) => !Object.is(dep, previous.deps[j]))) effects.push(() => {
        previous?.cleanup?.(); slots[i] = { deps, cleanup: effect() };
      });
    },
  };
  const components = ["ProjectRecruitmentList", "ProjectRecruitmentDetail", "RecruitmentApplicationSheet", "RecruitmentBatchResult", "RecruitmentState"];
  const resolve = (name) => {
    if (name === "react") return hooks;
    if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (name.startsWith("@/lib/")) return require("../../" + name.slice(2));
    if (name === "./use-project-recruitment-read") return load("components/worker/recruitment/use-project-recruitment-read.ts", resolve, browser);
    if (name === "./recruitment-shift-row") return { getRecruitmentShiftHoldReason: (shift) => shift.applicationAvailability === "allowed" && shift.hasActiveApplication === false ? null : "hold" };
    if (name.startsWith("./")) return Object.fromEntries(components.map((component) => [component, component]));
    throw new Error("Unexpected demo boundary: " + name);
  };
  const { RecruitmentDemo } = load("components/worker/recruitment/recruitment-demo.tsx", resolve, browser);
  function render() {
    cursor = 0; tree = RecruitmentDemo({ isDemo: true });
    while (effects.length) effects.shift()();
  }
  function flatten(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(flatten);
    return [node, ...flatten(node.props?.children)];
  }
  function find(type) { const found = flatten(tree).find((node) => node.type === type); assert.ok(found, type); return found.props; }
  return {
    find,
    browser,
    async settle() {
      // Reader + validation + state delivery span multiple microtasks.
      for (let i = 0; i < 8; i++) { await Promise.resolve(); render(); }
    },
    render,
    display(value) { find("select").onChange({ currentTarget: { value } }); render(); },
  };
}

test("demo traverses same-name projects, resets cross-project selection and retains unknown batch result", async () => {
  const view = harness();
  view.render();
  assert.equal(view.find("ProjectRecruitmentList").status, "loading");
  await view.settle();
  let list = view.find("ProjectRecruitmentList");
  const first = list.items[0].project;
  list.loadMore.onLoadMore(); view.render();
  list = view.find("ProjectRecruitmentList");
  const second = list.items[1].project;
  assert.equal(first.projectName, second.projectName);
  assert.notEqual(first.projectId, second.projectId);
  list.onOpenDetail(first.projectId); view.render(); await view.settle();
  let detail = view.find("ProjectRecruitmentDetail");
  assert.equal(detail.detail.project.projectId, first.projectId);
  const chosen = detail.detail.shifts[0];
  detail.onSelectionChange([{ projectId: chosen.projectId, shiftId: chosen.shiftId }]); view.render();
  view.find("ProjectRecruitmentDetail").onBack(); view.render();
  view.find("ProjectRecruitmentList").onOpenDetail(second.projectId); view.render(); await view.settle();
  detail = view.find("ProjectRecruitmentDetail");
  assert.equal(detail.detail.project.projectId, second.projectId);
  assert.equal(detail.selection.length, 0);
  const shift = detail.detail.shifts[0];
  detail.onSelectionChange([{ projectId: shift.projectId, shiftId: shift.shiftId }]); view.render();
  view.find("ProjectRecruitmentDetail").onConfirm(); view.render();
  assert.equal(view.find("RecruitmentApplicationSheet").open, true);
  const sheet = view.find("RecruitmentApplicationSheet");
  sheet.onConfirm(sheet.selection); view.render();
  assert.equal(view.find("RecruitmentApplicationSheet").open, false);
  view.find("RecruitmentApplicationSheet").onAfterClose(); view.render();
  const result = view.find("RecruitmentBatchResult");
  assert.equal(result.result.status, "unknown");
  const batchKey = result.result.request.batchKey;
  result.onClose(); view.render();
  view.find("ProjectRecruitmentDetail").onConfirm(); view.render();
  assert.equal(view.find("RecruitmentBatchResult").result.request.batchKey, batchKey);
});

test("browser back/forward restores the correct project and preserves Next history metadata", async () => {
  const view = harness(); view.render(); await view.settle();
  let list = view.find("ProjectRecruitmentList");
  list.loadMore.onLoadMore(); view.render();
  list = view.find("ProjectRecruitmentList");
  const [first, second] = list.items.map((item) => item.project.projectId);
  list.onOpenDetail(first); view.render(); await view.settle();
  const shift = view.find("ProjectRecruitmentDetail").detail.shifts[0];
  view.find("ProjectRecruitmentDetail").onSelectionChange([{ projectId: shift.projectId, shiftId: shift.shiftId }]); view.render();
  view.browser.history.back(); view.render(); await view.settle();
  assert.equal(view.find("ProjectRecruitmentList").items.length, 2);
  view.browser.history.forward(); view.render(); await view.settle();
  assert.equal(view.find("ProjectRecruitmentDetail").detail.project.projectId, first);
  assert.equal(view.find("ProjectRecruitmentDetail").selection.length, 1);
  view.find("ProjectRecruitmentDetail").onBack(); view.render(); await view.settle();
  view.find("ProjectRecruitmentList").onOpenDetail(second); view.render(); await view.settle();
  assert.equal(view.find("ProjectRecruitmentDetail").detail.project.projectId, second);
  assert.equal(view.find("ProjectRecruitmentDetail").selection.length, 0);
  assert.equal(view.browser.history.state.__NA, true);
  assert.equal(view.browser.history.state.tree, "next-metadata");
});

test("demo obtains error/empty/404 through the reader and retries to ready", async () => {
  const view = harness(); view.render(); await view.settle();
  view.display("error"); await view.settle();
  assert.equal(view.find("ProjectRecruitmentList").status, "error");
  view.find("ProjectRecruitmentList").onRetry(); view.render(); await view.settle();
  assert.equal(view.find("ProjectRecruitmentList").status, "ready");
  view.display("empty"); await view.settle();
  assert.equal(view.find("ProjectRecruitmentList").items.length, 0);
  view.display("ready"); await view.settle();
  const list = view.find("ProjectRecruitmentList");
  list.onOpenDetail(list.items[0].project.projectId); view.render(); await view.settle();
  view.display("loading"); await view.settle();
  assert.equal(view.find("ProjectRecruitmentDetail").status, "loading");
  assert.equal(view.find("ProjectRecruitmentDetail").detail, null);
  view.display("not_found"); await view.settle();
  assert.equal(view.find("ProjectRecruitmentDetail").status, "not_found");
  view.find("ProjectRecruitmentDetail").onBack(); view.render(); await view.settle();
  assert.equal(view.find("ProjectRecruitmentList").status, "ready");
});
