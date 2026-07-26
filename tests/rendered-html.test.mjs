import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the black-soil dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>黑土寻味·产销闭环<\/title>/);
  assert.match(html, /aria-label="黑土寻味·产销闭环大屏"/);
  assert.match(html, /未来 72 小时需求/);
  assert.match(html, /运输履约进度/);
  assert.match(html, /数据链路正常/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps both Sites and GitHub Pages build paths configured", async () => {
  const [layout, nextConfig, packageJson, workflow] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(
      new URL("../.github/workflows/deploy-pages.yml", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(layout, /title:\s*"黑土寻味·产销闭环"/);
  assert.match(nextConfig, /output:\s*"export"/);
  assert.match(nextConfig, /NEXT_PUBLIC_BASE_PATH/);
  assert.match(packageJson, /"build:pages":\s*"next build"/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /path:\s*\.\/out/);
});
