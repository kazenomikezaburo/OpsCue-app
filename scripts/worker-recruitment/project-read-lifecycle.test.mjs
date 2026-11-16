import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../../components/worker/recruitment/use-project-recruitment-read.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });

// Run the actual hook with a minimal hook scheduler, as in pr-a-controls.
// This verifies async ownership/cleanup; browser behavior is checked separately.
function harness(initialRead) {
  const slots = [], pending = [];
  let cursor = 0, read = initialRead, output, writes = 0;
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], (value) => { writes++; slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || deps.some((dep, i) => !Object.is(dep, previous.deps[i]))) {
        pending.push(() => {
          previous?.cleanup?.();
          slots[index] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const exports = {};
  vm.runInNewContext(outputText, { exports, require(name) {
    assert.equal(name, "react"); return hooks;
  } });
  function render() {
    cursor = 0;
    output = exports.useProjectRecruitmentRead(read);
    while (pending.length) pending.shift()();
    return output;
  }
  render();
  return {
    render,
    setReader(next) { read = next; return render(); },
    retry() { output.retry(); return render(); },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
    get writes() { return writes; },
  };
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test("a late project/filter response cannot replace the current result", async () => {
  const old = deferred(), current = deferred();
  const view = harness(() => old.promise);
  assert.equal(view.render().result, null);
  assert.equal(view.setReader(() => current.promise).result, null);
  current.resolve("current project"); await current.promise;
  assert.equal(view.render().result, "current project");
  old.resolve("old project"); await old.promise;
  assert.equal(view.render().result, "current project");
});

test("retry hides the preceding result immediately and reloads the same query", async () => {
  const retried = deferred();
  let calls = 0;
  const view = harness(() => ++calls === 1 ? Promise.resolve("error") : retried.promise);
  await Promise.resolve();
  assert.equal(view.render().result, "error");
  assert.equal(view.retry().result, null);
  retried.resolve("ready"); await retried.promise;
  assert.equal(view.render().result, "ready");
  assert.equal(calls, 2);
});

test("changing query hides previously loaded data while the new query loads", async () => {
  const next = deferred();
  const view = harness(() => Promise.resolve("first date"));
  await Promise.resolve();
  assert.equal(view.render().result, "first date");
  assert.equal(view.setReader(() => next.promise).result, null);
  next.resolve("next date"); await next.promise;
  assert.equal(view.render().result, "next date");
});

test("unmounted reads cannot write component state", async () => {
  const pending = deferred();
  const view = harness(() => pending.promise);
  view.unmount();
  const writes = view.writes;
  pending.resolve("late"); await pending.promise;
  assert.equal(view.writes, writes);
});
