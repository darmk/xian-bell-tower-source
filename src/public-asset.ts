/// <reference types="vite/client" />

// Vite supplies the configured /xianBellTower/ deployment prefix.
export function publicAsset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
