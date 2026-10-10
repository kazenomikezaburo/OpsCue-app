import type { Metadata } from "next";

import "./globals.css";


export const metadata: Metadata = {
  title: "OpsCue",
  description: "募集から、現場が無事に終わるまで。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
