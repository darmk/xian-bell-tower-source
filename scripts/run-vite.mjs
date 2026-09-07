import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const rawArgs = process.argv.slice(2);
const useVinext = ["start", "build"].includes(rawArgs[0]);
// Execute JavaScript with Node directly: Windows cannot spawn .cmd with shell:false.
const entry = fileURLToPath(new URL(
  useVinext ? "./run-vinext.mjs" : "../node_modules/vite/bin/vite.js",
  import.meta.url,
));
const child = spawn(process.execPath, [entry, ...rawArgs], {
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  stdio: "inherit",
  shell: false,
  env: {
    ...process.env,
    WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
  },
});

child.on("error", (error) => {
  console.error(`无法启动 Vite：${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
