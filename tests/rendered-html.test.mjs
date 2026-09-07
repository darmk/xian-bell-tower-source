import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test, { before, after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';

let server, baseUrl;
const prefix = '/xianBellTower/';
before(async () => {
  const started = await preview({
    configFile: fileURLToPath(new URL('../vite.static.config.ts', import.meta.url)),
    preview: { host: '127.0.0.1', port: 0, open: false },
  });
  server = started.httpServer;
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('serves dist/index.html and JavaScript/CSS under the deployment prefix', async () => {
  const response = await fetch(`${baseUrl}${prefix}`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(html, await readFile(new URL('../dist/index.html', import.meta.url), 'utf8'));
  assert.match(html, /西安钟楼/);
  assert.ok(html.includes('<div id="root"></div>'));
  const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
  assert.ok(assets.some(asset => asset.endsWith('.js')));
  assert.ok(assets.some(asset => asset.endsWith('.css')));
  for (const asset of assets) {
    assert.ok(asset.startsWith(prefix), asset);
    const resource = await fetch(`${baseUrl}${asset}`);
    assert.equal(resource.status, 200, asset);
    assert.ok(!resource.headers.get('content-type').includes('text/html'), asset);
    await resource.arrayBuffer();
  }
});

test('serves every split module, including the dynamically imported Three.js viewer', async () => {
  const entries = await readdir(new URL('../dist/assets/', import.meta.url));
  assert.ok(entries.some(name => name.startsWith('viewer-') && name.endsWith('.js')));
  for (const name of entries.filter(name => name.endsWith('.js'))) {
    const response = await fetch(`${baseUrl}${prefix}assets/${name}`);
    assert.equal(response.status, 200, name);
    assert.match(response.headers.get('content-type'), /javascript/, name);
    assert.equal(await response.text(), await readFile(new URL(`../dist/assets/${name}`, import.meta.url), 'utf8'));
  }
});

test('serves the complete model, thumbnails and page images from the deployment prefix', async () => {
  const views = await readdir(new URL('../public/model/views/', import.meta.url));
  for (const asset of ['model/xian-bell-tower.glb', 'model/model-notes.json', 'images/tower-sketch.png', 'favicon.svg', ...views.filter(name => name.endsWith('.jpg')).map(name => `model/views/${name}`)]) {
    const response = await fetch(`${baseUrl}${prefix}${asset}`);
    assert.equal(response.status, 200, asset);
    const actual = Buffer.from(await response.arrayBuffer());
    const expected = await readFile(new URL(`../public/${asset}`, import.meta.url));
    assert.ok(actual.equals(expected), `${asset} must match the source file`);
  }
});
