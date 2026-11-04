import type { Metadata } from "next";
import "@fontsource-variable/noto-sans-jp";
import "katex/dist/katex.min.css";
import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";
import { Shell } from "@/components/shell";
export const metadata: Metadata = {
  title: "IAMT — 数学を、探究する。",
  description: "自由な数学の探究を支える学習ワークスペース。操作できるV3デモ。",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <DemoProvider>
          <Shell>{children}</Shell>
        </DemoProvider>
      </body>
    </html>
  );
}
