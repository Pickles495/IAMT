import type { Metadata } from "next";
import "@fontsource-variable/noto-sans-jp";
import "katex/dist/katex.min.css";
import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";
import { Shell } from "@/components/shell";
export const metadata: Metadata = {
  title: "IAMT — Integrated AI Math Tutor",
  description: "Integrated AI Math Tutor — V4 workspace demo.",
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
