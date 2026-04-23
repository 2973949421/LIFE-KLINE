import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '人生 K 线图 | Life-Kline',
  description: '将玄学定性叙事转成结构化的 K 线与指标视图',
  keywords: ['八字', '命理', 'K线', '运势', '合盘'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}