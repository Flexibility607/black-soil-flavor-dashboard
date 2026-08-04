import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the redesigned collaboration dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>黑土寻味·产销闭环<\/title>/);
  assert.match(html, /aria-label="黑土寻味产销协同大屏"/);
  assert.match(html, /园区有效预订单/);
  assert.match(html, /不同单位独立展示/);
  assert.match(html, /第三空间销售排行/);
  assert.match(html, /开始语音提问/);
  assert.match(html, /演示数据/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("bundles the Northeast map and all dashboard runtime dependencies locally", async () => {
  const [mapText, dashboard, charts, styles, globals, packageJson] = await Promise.all([
    readFile(new URL("../public/maps/northeast-china.geo.json", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard-v3.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard-charts.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard-v3.css", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const map = JSON.parse(mapText);
  assert.equal(map.type, "FeatureCollection");
  assert.ok(map.features.length >= 30);
  assert.deepEqual(new Set(map.features.map((feature) => feature.properties.province)), new Set(["黑龙江省", "吉林省", "辽宁省"]));
  assert.match(charts, /fetch\("\/maps\/northeast-china\.geo\.json"\)/);
  assert.match(styles, /\/images\/northeast-winter-corn\.png/);
  assert.doesNotMatch(`${styles}\n${globals}`, /fonts\.googleapis|https?:\/\/.*\.(?:css|woff|json)/i);
  assert.match(packageJson, /"echarts"/);
  assert.match(dashboard, /fetch\(`\/api\/public\/dashboard\/snapshot/);
});

test("keeps channel charts, demo fallback, and voice-only assistant controls", async () => {
  const [dashboard, charts, types, worker] = await Promise.all([
    readFile(new URL("../app/dashboard-v3.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard-charts.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard-types.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);
  assert.equal((dashboard.match(/<DonutChart/g) ?? []).length, 2);
  assert.match(dashboard, /makeDemoSnapshot\(\)/);
  assert.match(dashboard, /MAX_RECORDING_MS = 30_000/);
  assert.match(dashboard, /MAX_AUDIO_BYTES = 5 \* 1024 \* 1024/);
  assert.match(dashboard, /navigator\.mediaDevices\?\.getUserMedia/);
  assert.match(dashboard, /MediaRecorder\.isTypeSupported/);
  assert.doesNotMatch(dashboard, /<input|<textarea/i);
  assert.match(types, /"donut" \| "bar" \| "line"/);
  assert.match(worker, /BACKEND_API_BASE_URL/);
  assert.match(worker, /X-Dashboard-Token/);
  assert.match(worker, /\/api\/v1\$\{url\.pathname\.slice\(4\)\}/);
  assert.doesNotMatch(`${dashboard}\n${charts}\n${worker}`, /localhost/i);
});

test("keeps both Sites and GitHub Pages build paths configured", async () => {
  const [layout, nextConfig, packageJson, pagesBuild, workflow] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../scripts/run-pages-build.mjs", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/deploy-pages.yml", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /title:\s*"黑土寻味·产销闭环"/);
  assert.match(nextConfig, /output:\s*"export"/);
  assert.match(nextConfig, /NEXT_PUBLIC_BASE_PATH/);
  assert.match(packageJson, /"build:pages":\s*"node scripts\/run-pages-build\.mjs"/);
  assert.match(pagesBuild, /GITHUB_PAGES:\s*"true"/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /path:\s*\.\/out/);
});
