/// <reference types="vite/client" />

// Vite supplies '/' in the existing dev server and '/xianBellTower/' in the static build.
export function publicAsset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
