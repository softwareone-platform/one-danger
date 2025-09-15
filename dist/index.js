import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ACTION_ROOT = join(__dirname, "..");
const WORKSPACE   = process.env.GITHUB_WORKSPACE || process.cwd();

const CENTRAL_DANGERFILE = join(ACTION_ROOT, "dangerfile.js");
const DANGER_BIN = join(
  ACTION_ROOT,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "danger.cmd" : "danger"
);

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("close", (code) => resolve(code ?? 1));
  });
}

async function ensureActionDeps() {
  if (existsSync(DANGER_BIN)) return;

  const hasPkg  = existsSync(join(ACTION_ROOT, "package.json"));
  const hasLock = existsSync(join(ACTION_ROOT, "package-lock.json"));
  if (!hasPkg) {
    console.error("❌ Action package.json not found — cannot install danger.");
    process.exit(1);
  }

  console.log("🔧 Installing action dependencies (npm ci in action folder)...");
  const code = await run(
    process.platform === "win32" ? "npm.cmd" : "npm",
    hasLock ? ["ci", "--ignore-scripts", "--no-audit"] : ["install", "--no-audit", "--no-fund"],
    { cwd: ACTION_ROOT }
  );
  if (code !== 0) {
    console.error("❌ Failed to install action dependencies.");
    process.exit(code);
  }
}

async function main() {
  const token = process.env["INPUT_TOKEN"];
  if (!token) {
    console.error("❌ INPUT_TOKEN is required (with pull-requests: write).");
    process.exit(1);
  }

  await ensureActionDeps();

  if (!existsSync(CENTRAL_DANGERFILE)) {
    console.error(`❌ Central dangerfile not found at: ${CENTRAL_DANGERFILE}`);
    process.exit(1);
  }
  if (!existsSync(DANGER_BIN)) {
    console.error(`❌ Danger binary not found at: ${DANGER_BIN}`);
    process.exit(1);
  }

  console.log("▶️ Running Danger with central dangerfile...");
  const code = await run(
    DANGER_BIN,
    ["ci", "--dangerfile", CENTRAL_DANGERFILE],
    {
      cwd: WORKSPACE,
      env: { ...process.env, DANGER_GITHUB_API_TOKEN: token }
    }
  );

  if (code !== 0) {
    console.error(`❌ Danger exited with code ${code}`);
    process.exit(code);
  }
  console.log("✅ Danger completed successfully.");
}

main().catch((err) => {
  console.error("❌ Unhandled error:", err);
  process.exit(1);
});
