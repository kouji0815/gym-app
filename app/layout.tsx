import "./globals.css";

/**
 * 全局布局
 * 所有页面都会被这个 layout 包裹
 */
export const metadata = {
  title: "健身记录",
  description: "基于 Next.js + SQLite 的健身记录应用",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
