"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Network,
  ChartNoAxesCombined,
  PenLine,
  Settings,
  ArrowUpRight,
  FlaskConical,
  Infinity as InfinityIcon,
} from "lucide-react";
import { useDemo } from "./demo-provider";
const nav = [
  { href: "/learn", label: "学習ワークスペース", en: "Learn", icon: BookOpen },
  { href: "/exercise", label: "演習", en: "Practice", icon: PenLine },
  { href: "/knowledge", label: "Knowledge Map", en: "Explore", icon: Network },
  {
    href: "/progress",
    label: "Learning Progress",
    en: "Reflect",
    icon: ChartNoAxesCombined,
  },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { ready, storageError } = useDemo();
  return (
    <div className="app-shell">
      <a className="skip" href="#main">
        本文へ移動
      </a>
      <aside className="sidebar">
        <Link href="/learn" className="brand">
          <span className="brand-icon">
            <InfinityIcon size={27} />
          </span>
          <span>
            IAMT<small>INTEGRATED AI MATH TUTOR</small>
          </span>
        </Link>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="メインナビゲーション">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-item ${path === n.href ? "active" : ""}`}
              aria-current={path === n.href ? "page" : undefined}
            >
              <n.icon size={19} />
              <span>
                {n.label}
                <small>{n.en}</small>
              </span>
              {path === n.href && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="eyebrow">LEARN WITHOUT LIMITS</span>
          <p>
            答えの先にある、
            <br />
            「なぜ」を探そう。
          </p>
          <Link href="/knowledge">
            つながりを見つける <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <Link
            href="/settings"
            className={`nav-item ${path === "/settings" ? "active" : ""}`}
          >
            <Settings size={19} />
            <span>設定</span>
          </Link>
          <div className="profile">
            <span className="avatar">D</span>
            <span>
              デモワークスペース<small>このブラウザだけに保存</small>
            </span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span>{" "}
            <strong>
              {nav.find((n) => n.href === path)?.en ?? "Settings"}
            </strong>
          </span>
          <span className="demo-tag">
            <FlaskConical size={14} /> V3 インタラクティブデモ
          </span>
        </header>
        <div className="demo-banner">
          <span className="status-dot" />
          固定データで体験するドラフトです。実AI・アカウント・クラウド保存は未接続です。
        </div>
        {storageError && (
          <p role="alert" className="storage-warning">
            ブラウザ保存が利用できません。現在の記録はこの画面を閉じると失われます。
          </p>
        )}
        <main id="main">
          {ready ? children : <p className="muted">ワークスペースを準備中…</p>}
        </main>
        <footer>
          IAMT <span>数学を、あなたの問いから。</span>
          <span>PROTOTYPE · V0.1</span>
        </footer>
      </div>
    </div>
  );
}
