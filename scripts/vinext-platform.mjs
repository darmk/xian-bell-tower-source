// vinext 0.0.50 stores Windows filesystem separators in its static URL cache.
// Normalize cache keys before serving; keep the workaround outside node_modules
// so npm ci does not erase it. Recheck this adapter when upgrading vinext.
export async function prepareVinextPlatform() {
  if (process.platform !== "win32") return;
  const moduleUrl = new URL("./server/static-file-cache.js", import.meta.resolve("vinext"));
  const { StaticFileCache } = await import(moduleUrl.href);
  const create = StaticFileCache.create;
  StaticFileCache.create = async function (...args) {
    const cache = await create.apply(this, args);
    cache.entries = new Map(
      [...cache.entries].map(([pathname, entry]) => [pathname.replaceAll("\\", "/"), entry]),
    );
    return cache;
  };
}
