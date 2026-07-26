import type { Metadata } from "next";
import "./globals.css";

const description =
  "黑土地绿色食品产业园区供给、订单、冷链履约与经营结果协同展示。";

export const metadata: Metadata = {
  title: "黑土寻味·产销闭环",
  description,
  icons: {
    icon: "./favicon.svg",
    shortcut: "./favicon.svg",
  },
  openGraph: {
    title: "黑土寻味·产销闭环",
    description,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "黑土寻味·产销闭环",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
