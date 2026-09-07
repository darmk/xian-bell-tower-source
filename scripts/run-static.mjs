import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [command = 'build', ...args] = process.argv.slice(2);
const child = spawn(process.execPath, [
  fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)),
  command, '--config', 'vite.static.config.ts', ...args,
], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  stdio: 'inherit',
  shell: false,
});
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
