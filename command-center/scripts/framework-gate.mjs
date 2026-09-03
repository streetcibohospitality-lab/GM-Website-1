import fs from "node:fs";
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const version = String(pkg.dependencies?.next || "0.0.0").replace(/^[^0-9]*/, "");
const nums = version.split(".").slice(0,3).map((n) => Number.parseInt(n,10) || 0);
const value = nums[0] * 1_000_000 + nums[1] * 1_000 + nums[2];
const minimumInclusive = 16 * 1_000_000 + 3 * 1_000 + 3;
if (value < minimumInclusive) {
  console.error(`PRODUCTION BLOCKED: Next.js ${version} is below the August 2026 security baseline 16.3.3.`);
  process.exit(1);
}
console.log(`FRAMEWORK_GATE_PASS Next.js ${version}`);
