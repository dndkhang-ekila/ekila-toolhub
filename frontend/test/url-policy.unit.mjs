import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(
  new URL(
    "../src/features/url-policy/lib/check-url-policy.ts",
    import.meta.url,
  ),
  "utf8",
);
const testModule = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  { module: testModule, exports: testModule.exports, URL },
);
const { checkUrlPolicy } = testModule.exports;
const check = (input) =>
  checkUrlPolicy(input, ["toolhub.example", "localhost"]);

test("rejects a ToolHub domain and its subdomains regardless of case, port or final dot", () => {
  for (const url of [
    "https://toolhub.example/a",
    "https://go.toolhub.example/a",
    "https://TOOLHUB.EXAMPLE.:8443/a",
    "http://localhost:3000/a",
  ]) {
    assert.equal(check(url).kind, "blocked-toolhub");
  }
});
test("rejects known shorteners and their subdomains", () => {
  for (const url of [
    "https://bit.ly/a",
    "http://news.bit.ly/a",
    "https://BIT.LY./a",
    "https://tinyurl.com/a",
  ]) {
    assert.equal(check(url).kind, "blocked-shortener");
  }
});
test("checks the parsed hostname, allowing text in paths and query strings", () => {
  for (const url of [
    "https://bit.ly.example.com/a",
    "https://notbit.ly/a",
    "https://example.com/bit.ly",
    "https://example.com/?next=https://toolhub.example",
    "https://example.com/#bit.ly",
  ]) {
    assert.equal(check(url).kind, "allowed");
  }
});
test("rejects invalid protocols, embedded credentials and control characters", () => {
  for (const url of [
    "",
    "example.com",
    "javascript:alert(1)",
    "ftp://example.com",
    "https://bit.ly@example.com",
    "https://example.com/with space",
    "https://bi\nt.ly/a",
    "https:\\bit.ly\\a",
    "https://example.com/" + "a".repeat(2048),
  ]) {
    assert.equal(check(url).kind, "invalid");
  }
});
test("accepts trimmed http/https links and ignores invalid configuration entries", () => {
  assert.equal(check("  https://example.com/a  ").kind, "allowed");
  assert.equal(check("http://example.com/a").kind, "allowed");
  assert.equal(
    checkUrlPolicy("https://example.com/a", ["", "not a domain"]).kind,
    "allowed",
  );
});
