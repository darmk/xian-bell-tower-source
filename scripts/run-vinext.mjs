import { prepareVinextPlatform } from "./vinext-platform.mjs";

await prepareVinextPlatform();
await import(new URL("./cli.js", import.meta.resolve("vinext")).href);
