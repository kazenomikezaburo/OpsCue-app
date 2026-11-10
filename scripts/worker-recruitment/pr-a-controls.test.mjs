import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const sourceUrl = new URL("../../components/worker/recruitment/worker-recruitment-application-controls.tsx", import.meta.url);
const source = readFileSync(sourceUrl, "utf8");
const compiled = ts.transpileModule(source, {
  fileName: sourceUrl.pathname,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  reportDiagnostics: true,
});
assert.equal(compiled.diagnostics?.length ?? 0, 0, "The actual TSX must transpile without syntax diagnostics");
console.log("Actual controls TSX SHA-256:", createHash("sha256").update(source).digest("hex"));

const SHIFT = "10000000-0000-4000-8000-000000000030";
const OTHER_SHIFT = "10000000-0000-4000-8000-000000000031";
const reply = (overrides = {}) => ({
  ok: false, outcome: "unavailable", message: "Unavailable", retryable: false,
  applicationState: null, replayed: false, ...overrides,
});
const unknown = () => reply({ outcome: "unknown", retryable: true });
const accepted = (operation, overrides = {}) => reply({
  ok: true, outcome: operation === "apply" ? "applied" : "withdrawn",
  applicationState: operation === "apply" ? "applied" : "withdrawn", ...overrides,
});

// Only the hook scheduler / JSX creation / external boundaries are simulated.
// The submit handler, acknowledgement classification and request state are
// executed from the actual controls.tsx above, never reimplemented here.
// This is a component-logic unit test, not a real React / browser scheduler test.
function harness(steps, state = "available") {
  const slots = [], jobs = [], calls = [], boundaryErrors = [];
  let cursor = 0, uuidCount = 0, refreshCount = 0;
  let props = { shiftId: SHIFT, state };
  const hooks = {
    useRef(value) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: value };
      return slots[index];
    },
    useState(value) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof value === "function" ? value() : value;
      return [slots[index], next => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
    },
    useTransition() {
      const [pending, setPending] = hooks.useState(false);
      return [pending, work => {
        setPending(true);
        let result;
        try { result = work(); } catch (error) { result = Promise.reject(error); }
        jobs.push(Promise.resolve(result).finally(() => setPending(false)));
      }];
    },
  };
  const invoke = operation => input => {
    calls.push({ operation, ...input });
    if (steps.length === 0) {
      boundaryErrors.push("Unexpected Action call: " + operation);
      throw new Error("Unexpected Action call");
    }
    const next = steps.shift();
    return typeof next === "function" ? next() : Promise.resolve(next);
  };
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  const context = vm.createContext({
    exports,
    require(name) {
      if (name === "react") return hooks;
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "next/navigation") return { useRouter: () => ({ refresh() { refreshCount++; } }) };
      if (name === "@/app/actions/worker-shift-applications") return {
        applyToOwnShift: invoke("apply"), withdrawOwnShiftApplication: invoke("withdraw"),
      };
      throw new Error("Unit-test boundary refused import: " + name);
    },
    crypto: { randomUUID() { uuidCount++; return "20000000-0000-4000-8000-" + String(uuidCount).padStart(12, "0"); } },
  }, { codeGeneration: { strings: false, wasm: false } });
  new vm.Script(compiled.outputText, { filename: "actual-application-controls.cjs" }).runInContext(context, { timeout: 1000 });
  const component = exports.WorkerRecruitmentApplicationControls;
  assert.equal(typeof component, "function");

  function render() { cursor = 0; return component(props); }
  function children(node) {
    if (node == null || node === false) return [];
    if (Array.isArray(node)) return node.flatMap(children);
    return typeof node === "object" ? [node, ...children(node.props?.children)] : [];
  }
  function text(node) {
    if (node == null || node === false) return "";
    if (Array.isArray(node)) return node.map(text).join("");
    return typeof node === "object" ? text(node.props?.children) : String(node);
  }
  function request() {
    const ref = slots.find(value => value?.current && typeof value.current === "object" && "idempotencyKey" in value.current);
    const value = ref?.current;
    return value ? { shiftId: value.shiftId, operation: value.operation, idempotencyKey: value.idempotencyKey, phase: value.phase } : null;
  }
  function captureSubmit() {
    const form = children(render()).find(node => node.type === "form");
    assert.ok(form, "Expected a form in the actual rendered component");
    return form.props.onSubmit;
  }
  function beginSubmit(handler = captureSubmit()) {
    let prevented = false;
    handler({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
  }
  async function settle() {
    while (jobs.length) await Promise.all(jobs.splice(0));
    // Assert outside production catch blocks so a swallowed mock error cannot pass.
    assert.deepEqual(boundaryErrors, []);
    render();
  }
  const api = {
    calls, request, captureSubmit, beginSubmit, settle,
    async submit() { beginSubmit(); await settle(); },
    setProps(values) { props = { ...props, ...values }; render(); },
    button() { return children(render()).find(node => node.type === "button"); },
    message() { return text(render()); },
    get uuidCount() { return uuidCount; },
    get refreshCount() { return refreshCount; },
  };
  render();
  return api;
}

function retained(h, original, operation) {
  assert.equal(h.request()?.idempotencyKey, original.idempotencyKey);
  assert.equal(h.request()?.shiftId, SHIFT);
  assert.equal(h.request()?.operation, operation);
  assert.equal(h.request()?.phase, "unknown");
  assert.match(h.message(), /未確定/);
  assert.equal(h.refreshCount, 0, "An unresolved result must not trigger refresh");
}

test("01 apply unknown -> authentication refusal retains the original key", async () => {
  const h = harness([unknown(), reply()]);
  await h.submit();
  const original = h.calls[0];
  await h.submit();
  retained(h, original, "apply");
  assert.equal(h.uuidCount, 1);
});

test("02 apply unknown -> pre-RPC throw or rejection retains the key", async t => {
  for (const mode of ["throw", "reject"]) {
    await t.test("first-call-" + mode, async () => {
      const failure = mode === "throw" ? () => { throw new Error("Before RPC"); }
        : () => Promise.reject(new Error("Before RPC"));
      const h = harness([failure, reply()]);
      await h.submit();
      const original = h.calls[0];
      retained(h, original, "apply");
      await h.submit();
      retained(h, original, "apply");
      assert.equal(h.uuidCount, 1);
    });
  }
  for (const failure of ["throw", "reject", "opaque-response"]) {
    await t.test(failure, async () => {
      const next = failure === "throw" ? () => { throw new Error("Before RPC"); }
        : failure === "reject" ? () => Promise.reject(new Error("Before RPC"))
          : reply({ outcome: "unavailable" });
      const h = harness([unknown(), next]);
      await h.submit();
      const original = h.calls[0];
      await h.submit();
      retained(h, original, "apply");
      assert.equal(h.uuidCount, 1);
    });
  }
});

test("03 withdraw unknown -> authentication refusal retains the original key", async () => {
  const h = harness([unknown(), reply()], "applied");
  await h.submit();
  const original = h.calls[0];
  await h.submit();
  retained(h, original, "withdraw");
});

test("04 explicit retry uses the same operation, shift and key", async t => {
  for (const operation of ["apply", "withdraw"]) {
    await t.test(operation, async () => {
      const h = harness([unknown(), accepted(operation, { replayed: true })], operation === "apply" ? "available" : "applied");
      await h.submit();
      h.setProps({ state: operation === "apply" ? "applied" : "available" });
      await h.submit();
      assert.deepEqual(h.calls[1], h.calls[0]);
      assert.equal(h.uuidCount, 1);
      assert.equal(h.request(), null);
      assert.equal(h.refreshCount, 1);
    });
  }
});

test("05 unknown does not automatically resend or allocate another key", async () => {
  const h = harness([unknown()]);
  await h.submit();
  const original = h.calls[0];
  h.setProps({ state: "applied" });
  h.setProps({ state: "available" });
  await h.settle();
  retained(h, original, "apply");
  assert.equal(h.calls.length, 1);
  assert.equal(h.uuidCount, 1);
});

test("06 unresolved operation cannot become its inverse or another shift", async t => {
  for (const operation of ["apply", "withdraw"]) {
    await t.test(operation, async () => {
      const h = harness([unknown(), unknown()], operation === "apply" ? "available" : "applied");
      await h.submit();
      const original = h.calls[0];
      h.setProps({ state: operation === "apply" ? "applied" : "available" });
      await h.submit();
      assert.equal(h.calls[1].operation, operation);
      assert.equal(h.calls[1].idempotencyKey, original.idempotencyKey);
      h.setProps({ shiftId: OTHER_SHIFT });
      assert.equal(h.button().props.disabled, true);
      await h.submit(); // Also exercise the handler's guard, bypassing the disabled UI.
      assert.equal(h.calls.length, 2);
      assert.equal(h.request()?.shiftId, SHIFT);
    });
  }
});

test("07 a resolved apply and subsequent withdraw use distinct keys", async () => {
  const h = harness([accepted("apply"), accepted("withdraw")]);
  await h.submit();
  assert.equal(h.request(), null);
  h.setProps({ state: "applied" });
  await h.submit();
  assert.deepEqual(h.calls.map(call => call.operation), ["apply", "withdraw"]);
  assert.notEqual(h.calls[0].idempotencyKey, h.calls[1].idempotencyKey);
  assert.equal(h.uuidCount, 2);
  assert.equal(h.request(), null);
  assert.equal(h.refreshCount, 2);
});

test("08 keys are released only on an attributable final result", async t => {
  await t.test("first explicit business refusal is final", async () => {
    const h = harness([reply({ outcome: "capacity_full" })]);
    await h.submit();
    assert.equal(h.request(), null);
    assert.equal(h.refreshCount, 1);
    assert.match(h.message(), /Unavailable/);
  });
  await t.test("unreplayed business refusal after unknown cannot settle the original", async () => {
    const h = harness([unknown(), reply({ outcome: "capacity_full" })]);
    await h.submit();
    const original = h.calls[0];
    await h.submit();
    retained(h, original, "apply");
  });
  for (const outcome of ["capacity_full", "unavailable"]) {
    await t.test("completed receipt replay resolves " + outcome, async () => {
      const h = harness([unknown(), reply({ outcome, replayed: true })]);
      await h.submit();
      await h.submit();
      assert.equal(h.request(), null);
      assert.equal(h.refreshCount, 1);
    });
  }
  await t.test("success for the wrong operation cannot settle the original", async () => {
    const h = harness([unknown(), accepted("withdraw")]);
    await h.submit();
    const original = h.calls[0];
    await h.submit();
    retained(h, original, "apply");
  });
  await t.test("a success without its application state is not authoritative", async () => {
    const h = harness([accepted("apply", { applicationState: null })]);
    await h.submit();
    retained(h, h.calls[0], "apply");
  });
});

test("09 continuing uncertainty and opaque responses retain the key", async t => {
  await t.test("repeated unknown replies", async () => {
    const h = harness([unknown(), unknown(), reply({ outcome: "unknown", retryable: false, replayed: true })]);
    await h.submit();
    const original = h.calls[0];
    await h.submit();
    await h.submit();
    retained(h, original, "apply");
    assert.equal(h.uuidCount, 1);
  });
  for (const response of [
    reply(), reply({ outcome: "IDEMPOTENCY_CONFLICT" }), reply({ outcome: "future_outcome" }),
    reply({ ok: true, outcome: "future_outcome" }), null, undefined,
  ]) {
    await t.test("opaque response " + String(response?.outcome ?? response), async () => {
      const h = harness([response]);
      await h.submit();
      retained(h, h.calls[0], "apply");
      assert.equal(h.uuidCount, 1);
    });
  }
});

test("10 normal apply / withdraw and pending double-submit protection", async t => {
  for (const operation of ["apply", "withdraw"]) {
    await t.test(operation, async () => {
      let resolve;
      const deferred = new Promise(done => { resolve = done; });
      const h = harness([() => deferred], operation === "apply" ? "available" : "applied");
      const sameRenderHandler = h.captureSubmit();
      h.beginSubmit(sameRenderHandler);
      h.beginSubmit(sameRenderHandler); // Before any render can update the pending closure.
      const active = h.request();
      assert.equal(active.operation, operation);
      assert.equal(active.phase, "pending");
      assert.equal(h.button().props.disabled, true);
      h.beginSubmit();
      assert.equal(h.calls.length, 1);
      assert.equal(h.uuidCount, 1);
      resolve(accepted(operation));
      await h.settle();
      assert.equal(h.request(), null);
      assert.equal(h.refreshCount, 1);
      assert.equal(h.button().props.disabled, false);
    });
  }
});
