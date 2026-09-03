import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
let ts;
try {
  ts = require("typescript");
} catch {
  const globalTs = path.resolve(path.dirname(process.execPath), "../lib/node_modules/typescript/lib/typescript.js");
  ts = (await import(pathToFileURL(globalTs).href)).default;
}

const root = process.cwd();
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && entry.name !== "next-env.d.ts") files.push(full);
  }
}
walk(root);
let failed = false;
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const result = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      isolatedModules: true,
    },
  });
  for (const diag of result.diagnostics || []) {
    if (diag.category !== ts.DiagnosticCategory.Error) continue;
    failed = true;
    const pos = diag.file && diag.start != null ? diag.file.getLineAndCharacterOfPosition(diag.start) : null;
    console.error(`${path.relative(root, file)}${pos ? `:${pos.line + 1}:${pos.character + 1}` : ""}: ${ts.flattenDiagnosticMessageText(diag.messageText, " ")}`);
  }
}
if (failed) process.exit(1);
console.log(`SOURCE_PARSE_PASS ${files.length} TS/TSX files`);
