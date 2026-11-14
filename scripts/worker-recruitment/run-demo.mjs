import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Dedicated local UI process, NOT an OS/network sandbox. Next still loads .env*
// and writes development artifacts. Runtime/browser validation is a separate step.
const root = fileURLToPath(new URL("../../", import.meta.url));
const require = createRequire(import.meta.url);
const host = "127.0.0.1";
const port = "3100";

function main() {
  // Do not forward caller flags, ports, hosts, preload hooks or credentials.
  if (process.argv.length !== 2) {
    console.error("DEMO_ARGUMENTS_REJECTED: this launcher accepts no arguments.");
    process.exitCode = 1;
    return;
  }

  const environment = {};
  for (const name of ["SystemRoot", "WINDIR", "TEMP", "TMP"]) {
    const entry = Object.entries(process.env).find(([key]) => key.toLowerCase() === name.toLowerCase());
    if (entry && entry[1] !== undefined) environment[name] = entry[1];
  }
  environment.PATH = path.dirname(process.execPath);
  environment.NODE_ENV = "development";
  environment.OPSCUE_PR_UI_01_DEMO_ENABLED = "1";
  // Empty strings, not deletion: Next's env loader must not fill these from .env*.
  // These are the actual names used by proxy.ts and lib/supabase/{client,server}.
  environment.NEXT_PUBLIC_SUPABASE_URL = "";
  environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "";
  environment.NEXT_TELEMETRY_DISABLED = "1";

  const nextCli = require.resolve("next/dist/bin/next");
  const child = spawn(process.execPath, [nextCli, "dev", root, "--hostname", host, "--port", port], {
    cwd: root,
    env: environment,
    shell: false,
    windowsHide: true,
    stdio: "inherit",
  });
  let stoppingSignal = null;
  let stopTimer;
  let spawnFailed = false;

  function requestStop(signal) {
    if (stoppingSignal !== null) return;
    stoppingSignal = signal;
    // Windows signal delivery differs from POSIX. This targets only our direct
    // child; descendant cleanup is NOT guaranteed without runtime verification.
    if (!child.kill(signal)) {
      console.error("DEMO_STOP_SIGNAL_FAILED: verify the demo process has stopped.");
    }
    stopTimer = setTimeout(() => {
      console.error("DEMO_STOP_TIMEOUT: forcing the direct child to stop; verify descendants separately.");
      child.kill("SIGKILL");
    }, 8000);
    stopTimer.unref();
  }
  const onInterrupt = () => requestStop("SIGINT");
  const onTerminate = () => requestStop("SIGTERM");
  const onExit = () => {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  };
  process.on("SIGINT", onInterrupt);
  process.on("SIGTERM", onTerminate);
  process.on("exit", onExit);

  child.once("error", () => {
    spawnFailed = true;
    console.error("DEMO_START_FAILED: could not start the local Next.js process.");
    process.exitCode = 1;
  });
  child.once("close", (code, signal) => {
    clearTimeout(stopTimer);
    process.off("SIGINT", onInterrupt);
    process.off("SIGTERM", onTerminate);
    process.off("exit", onExit);
    if (spawnFailed) process.exitCode = 1;
    else if (stoppingSignal === "SIGINT" || signal === "SIGINT") process.exitCode = 130;
    else if (stoppingSignal === "SIGTERM" || signal === "SIGTERM") process.exitCode = 143;
    else process.exitCode = typeof code === "number" && code >= 0 ? code : 1;
    console.log("DEMO_PROCESS_CLOSED: no descendant or network-isolation guarantee is implied.");
  });

  console.log(`Demo entry: http://${host}:${port}/ui-demo/recruitment`);
  console.log("Synthetic data only. No application is sent. Stop with Ctrl+C.");
  // No env values, command payloads, raw exceptions or credentials are logged.
}

try {
  main();
} catch {
  console.error("DEMO_LAUNCH_FAILED: verify local Node.js and Next.js dependencies.");
  process.exitCode = 1;
}
