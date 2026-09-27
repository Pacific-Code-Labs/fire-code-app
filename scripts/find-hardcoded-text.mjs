#!/usr/bin/env node
// Finds user-visible text hard-coded in the client instead of coming from translations/content.
// Parses every .ts/.tsx file with the TypeScript compiler API. Exits 1 when anything is found.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "src");
// Brand names / symbols that are the same in every language.
const ALLOW = new Set(["Sóköl", "CR", "NFPA", "PayPal", "EN", "ES", "es", "en", "∞", "…", "404", "kW", "kVA", "A", "V", "m²", "m", "Hz"]);
const SKIP_DIRS = new Set(["translations", "content", "test"]);
const SKIP_FILES = new Set([]);
const USER_ATTRS = new Set(["title", "placeholder", "aria-label", "alt", "label"]);
const USER_PROPS = new Set(["title", "description", "message", "label"]);
const SPANISH = /[áéíóúñÁÉÍÓÚÑ¿¡]/;

const hasWords = (s) => /[A-Za-zÀ-ÿ]{2,}/.test(s);
const findings = [];

function report(file, node, sf, kind, text) {
  const value = text.replace(/\s+/g, " ").trim();
  if (!value || ALLOW.has(value) || !hasWords(value)) return;
  if (/^[A-Z]{2,3}$/.test(value)) return; // avatar initials (e.g. testimonials)
  const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  findings.push(`${path.relative(root, file)}:${line + 1}  [${kind}] ${value.slice(0, 90)}`);
}

function isInsideConsoleCall(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (ts.isCallExpression(p)) {
      const callee = p.expression.getText();
      if (/^console\./.test(callee)) return true;
    }
  }
  return false;
}

function scan(file) {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  (function visit(node) {
    if (ts.isJsxText(node)) report(file, node, sf, "jsx-text", node.getText(sf));
    else if (ts.isJsxAttribute(node) && USER_ATTRS.has(node.name.getText(sf)) && node.initializer && ts.isStringLiteral(node.initializer))
      report(file, node, sf, `attr ${node.name.getText(sf)}`, node.initializer.text);
    else if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && !isInsideConsoleCall(node)) {
      const parent = node.parent;
      if (SPANISH.test(node.text)) report(file, node, sf, "spanish-literal", node.text);
      else if (parent && ts.isPropertyAssignment(parent) && parent.initializer === node && USER_PROPS.has(parent.name.getText(sf))
        && /\s/.test(node.text) && /^[A-Z¡¿]/.test(node.text))
        report(file, node, sf, `prop ${parent.name.getText(sf)}`, node.text);
      else if (parent && ts.isConditionalExpression(parent) && /^[A-Z¡¿]/.test(node.text) && /[a-z]{3,}/.test(node.text)
        && !ts.isJsxAttribute(parent.parent ?? parent) && hasWords(node.text) && /\s|^[A-Z][a-z]+$/.test(node.text))
        report(file, node, sf, "ternary", node.text);
    }
    ts.forEachChild(node, visit);
  })(sf);
}

(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (!SKIP_DIRS.has(entry.name)) walk(p); continue; }
    if (/\.(tsx?)$/.test(entry.name) && !SKIP_FILES.has(entry.name) && !entry.name.endsWith(".d.ts")) scan(p);
  }
})(root);

if (findings.length) {
  console.error(`Hard-coded user-visible text (${findings.length}) — move it to src/translations (chrome) or src/content (editable copy):\n  ` + findings.join("\n  "));
  process.exit(1);
}
console.log("No hard-coded user-visible text found.");
