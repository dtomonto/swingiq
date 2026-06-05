#!/usr/bin/env node
/**
 * SwingVantage Custom Security Check Script
 *
 * Scans the source directory for common security anti-patterns:
 *   1. NEXT_PUBLIC_ env vars that look like secrets
 *   2. dangerouslySetInnerHTML without a sanitization comment
 *   3. eval() usage
 *   4. console.log in production API routes (warning only)
 *   5. Hardcoded API key prefixes (sk-proj-, sk-ant-, AIza)
 *
 * Exits with code 1 if any CRITICAL findings are present.
 * Writes results to security-reports/custom-check-results.txt
 */

import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from "fs";
import { join, relative } from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const SRC_DIRS = ["apps/web/src", "packages", "server/src"].filter((d) => {
  try {
    statSync(join(ROOT, d));
    return true;
  } catch {
    return false;
  }
});
const REPORT_DIR = join(ROOT, "security-reports");
const REPORT_FILE = join(REPORT_DIR, "custom-check-results.txt");

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

// Patterns that indicate a file is inside an API route
const API_ROUTE_PATTERN = /[/\\]api[/\\]/;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Recursively collect all source files */
function collectFiles(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    // Skip common non-source directories
    if (["node_modules", ".next", ".turbo", "dist", "build", ".git"].includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, files);
    } else if (EXTENSIONS.has(full.slice(full.lastIndexOf(".")))) {
      files.push(full);
    }
  }
  return files;
}

/** Return relative path from project root for display */
function rel(p) {
  return relative(ROOT, p).replace(/\\/g, "/");
}

// ─── Check Functions ──────────────────────────────────────────────────────────

/**
 * Check 1 — NEXT_PUBLIC_ vars that look like secrets.
 * These are embedded in the browser bundle and are NOT secret.
 */
// Supabase anon key is explicitly designed to be public — it is safe in NEXT_PUBLIC_.
// Supabase Row Level Security protects data, not the anon key itself.
const PUBLIC_KEY_ALLOWLIST = new Set([
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
]);

function checkPublicSecrets(filePath, lines, findings) {
  const pattern = /NEXT_PUBLIC_\w*(KEY|SECRET|TOKEN|PASSWORD|PRIVATE)\w*/gi;
  lines.forEach((line, i) => {
    const matches = line.match(pattern);
    if (matches) {
      const isComment = line.trimStart().startsWith("//") || line.trimStart().startsWith("*");
      if (!isComment) {
        const realMatches = matches.filter((m) => !PUBLIC_KEY_ALLOWLIST.has(m.toUpperCase()));
        if (realMatches.length > 0) {
          findings.push({
            severity: "CRITICAL",
            file: rel(filePath),
            line: i + 1,
            rule: "PUBLIC_SECRET_VAR",
            message: `NEXT_PUBLIC_ variable with secret-like name: ${realMatches.join(", ")}. These are exposed in the browser bundle.`,
          });
        }
      }
    }
  });
}

/**
 * Check 2 — dangerouslySetInnerHTML without a sanitization comment nearby.
 * A sanitization comment must appear within 5 lines before the usage.
 */
function checkDangerousHtml(filePath, lines, findings) {
  lines.forEach((line, i) => {
    if (line.includes("dangerouslySetInnerHTML")) {
      // Look for a sanitize/safe comment within 5 lines before this line
      const windowStart = Math.max(0, i - 5);
      const context = lines.slice(windowStart, i + 1).join("\n").toLowerCase();
      const hasSanitizeComment =
        context.includes("sanitize") ||
        context.includes("dompurify") ||
        context.includes("safe html") ||
        context.includes("xss") ||
        context.includes("trusted") ||
        // JSON-LD structured data is a standard Next.js SEO pattern —
        // content is always a static object, never user input.
        context.includes("ld+json") ||
        context.includes("json.stringify") ||
        context.includes("structured data") ||
        context.includes("application/ld");
      if (!hasSanitizeComment) {
        findings.push({
          severity: "CRITICAL",
          file: rel(filePath),
          line: i + 1,
          rule: "DANGEROUS_HTML_NO_SANITIZE",
          message:
            "dangerouslySetInnerHTML used without a nearby sanitization comment. Add a comment explaining the content is safe (e.g., // sanitized with DOMPurify).",
        });
      }
    }
  });
}

/**
 * Check 3 — eval() usage (never acceptable in production code).
 */
function checkEval(filePath, lines, findings) {
  lines.forEach((line, i) => {
    // Match eval( but not things like "medieval(" or property names like ".evaluate("
    if (/(?<![.\w])eval\s*\(/.test(line)) {
      const isComment = line.trimStart().startsWith("//") || line.trimStart().startsWith("*");
      if (!isComment) {
        findings.push({
          severity: "CRITICAL",
          file: rel(filePath),
          line: i + 1,
          rule: "EVAL_USAGE",
          message: "eval() is a critical security risk. Remove it.",
        });
      }
    }
  });
}

/**
 * Check 4 — console.log in API routes (warning only, not a hard fail).
 */
function checkConsoleLog(filePath, lines, findings) {
  if (!API_ROUTE_PATTERN.test(filePath)) return;
  lines.forEach((line, i) => {
    if (/console\s*\.\s*log\s*\(/.test(line)) {
      const isComment = line.trimStart().startsWith("//") || line.trimStart().startsWith("*");
      if (!isComment) {
        findings.push({
          severity: "WARNING",
          file: rel(filePath),
          line: i + 1,
          rule: "CONSOLE_LOG_IN_API_ROUTE",
          message:
            "console.log() in an API route may leak sensitive data to server logs. Use a structured logger or remove.",
        });
      }
    }
  });
}

/**
 * Check 5 — Hardcoded API key prefixes.
 * These prefixes are the start of real secret keys.
 */
function checkHardcodedKeys(filePath, lines, findings) {
  // Match actual key-looking strings (quoted), not variable names or comments that explain them
  const patterns = [
    { pattern: /["'`]sk-proj-[A-Za-z0-9_-]{10,}/, label: "OpenAI project key (sk-proj-)" },
    { pattern: /["'`]sk-ant-[A-Za-z0-9_-]{10,}/, label: "Anthropic key (sk-ant-)" },
    { pattern: /["'`]AIza[A-Za-z0-9_-]{10,}/, label: "Google API key (AIza)" },
  ];
  lines.forEach((line, i) => {
    const isComment = line.trimStart().startsWith("//") || line.trimStart().startsWith("*");
    if (isComment) return;
    for (const { pattern, label } of patterns) {
      if (pattern.test(line)) {
        findings.push({
          severity: "CRITICAL",
          file: rel(filePath),
          line: i + 1,
          rule: "HARDCODED_API_KEY",
          message: `Possible hardcoded ${label} found. Rotate this key immediately and move it to environment variables.`,
        });
      }
    }
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const allFindings = [];

for (const srcDir of SRC_DIRS) {
  const files = collectFiles(join(ROOT, srcDir));
  for (const file of files) {
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const lines = content.split("\n");
    checkPublicSecrets(file, lines, allFindings);
    checkDangerousHtml(file, lines, allFindings);
    checkEval(file, lines, allFindings);
    checkConsoleLog(file, lines, allFindings);
    checkHardcodedKeys(file, lines, allFindings);
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

const criticals = allFindings.filter((f) => f.severity === "CRITICAL");
const warnings = allFindings.filter((f) => f.severity === "WARNING");

const lines = [
  "SwingVantage Custom Security Check Results",
  `Run at: ${new Date().toISOString()}`,
  `Scanned directories: ${SRC_DIRS.join(", ")}`,
  "",
  `Total findings: ${allFindings.length} (${criticals.length} critical, ${warnings.length} warnings)`,
  "",
];

if (criticals.length > 0) {
  lines.push("=== CRITICAL FINDINGS ===");
  for (const f of criticals) {
    lines.push(`[${f.severity}] ${f.file}:${f.line} — ${f.rule}`);
    lines.push(`  ${f.message}`);
    lines.push("");
  }
}

if (warnings.length > 0) {
  lines.push("=== WARNINGS ===");
  for (const f of warnings) {
    lines.push(`[${f.severity}] ${f.file}:${f.line} — ${f.rule}`);
    lines.push(`  ${f.message}`);
    lines.push("");
  }
}

if (allFindings.length === 0) {
  lines.push("No security issues found.");
}

const report = lines.join("\n");

// Always print to stdout so CI logs show the results
console.log(report);

// Write to file
mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(REPORT_FILE, report, "utf8");
console.log(`\nReport saved to: security-reports/custom-check-results.txt`);

// Exit 1 if any critical findings
if (criticals.length > 0) {
  console.error(`\nFAILED: ${criticals.length} critical security issue(s) found. Fix before merging.`);
  process.exit(1);
} else {
  console.log("\nPASSED: No critical security issues found.");
  process.exit(0);
}
