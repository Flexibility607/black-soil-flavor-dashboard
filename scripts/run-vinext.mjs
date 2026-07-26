import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = path.join(
  projectRoot,
  "node_modules",
  "vinext",
  "dist",
  "cli.js",
);
const command = process.argv[2];

if (!["dev", "build", "start"].includes(command)) {
  console.error("Expected one of: dev, build, start");
  process.exit(2);
}

const result = spawnSync(process.execPath, [cliPath, command], {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
  },
});

process.exit(result.status ?? 1);
