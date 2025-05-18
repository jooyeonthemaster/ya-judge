import type { Metadata } from "next";
import "./globals.css";
import { Gavel } from "lucide-react";

export const metadata: Metadata = {
  title: "야 판사야! - AI 갈등 해결 서비스",
  description: "커플, 친구들의 갈등을 AI가 판결해드립니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="antialiased h-full">
        <header className="sticky top-0 bg-white border-b z-50 flex-shrink-0">
          <div className="container max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
            <a href="/main" className="flex items-center gap-2 font-bold text-xl text-gray-900">
              <Gavel className="h-5 w-5 text-indigo-600" />
              야 판사야!
            </a>
          </div>
        </header>
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
