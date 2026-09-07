import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "西安钟楼 · 三维建筑",
  description: "西安钟楼1:1建筑研究模型，查看三重檐、木构与内部空间，查看完整PBR材质效果。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
