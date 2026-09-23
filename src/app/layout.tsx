import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘의 비트코인 | ALEPH T04",
  description: "Coinbase BTC/USD 공개 데이터를 사용하는 ALEPH T04 정보판",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
