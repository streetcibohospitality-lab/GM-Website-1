import { spawnSync } from "node:child_process";

const isProduction = process.env.VERCEL_ENV === "production";
if (isProduction) {
  const gate = spawnSync(process.execPath, ["scripts/framework-gate.mjs"], { stdio: "inherit" });
  if (gate.status !== 0) process.exit(gate.status ?? 1);
}
const nextBin = process.platform === "win32" ? "node_modules/.bin/next.cmd" : "node_modules/.bin/next";
const build = spawnSync(nextBin, ["build"], { stdio: "inherit" });
process.exit(build.status ?? 1);
