"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LocaleProvider, useLocale } from "./locale";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Network,
  ChartNoAxesCombined,
  PenLine,
  Settings,
  FlaskConical,
  Infinity as InfinityIcon,
} from "lucide-react";
import { useDemo } from "./demo-provider";
const nav = [
  { href: "/learn", label: "学習ワークスペース", en: "Learn", icon: BookOpen },
  { href: "/exercise", label: "演習", en: "Practice", icon: PenLine },
  {
    href: "/knowledge",
    label: "Knowledge Map",
    en: "Knowledge Map",
    icon: Network,
  },
  {
    href: "/progress",
    label: "Learning Progress",
    en: "Progress",
    icon: ChartNoAxesCombined,
  },
];
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <Frame>{children}</Frame>
    </LocaleProvider>
  );
}
function Frame({ children }: { children: React.ReactNode }) {
  const { en, setEn, t } = useLocale();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("iamt-sidebar") === "collapsed");
    } catch {}
  }, []);
  const path = usePathname();
  const personal = path === "/workspaces";
  const { ready, storageError } = useDemo();
  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <a className="skip" href="#main">
        {t("本文へ移動", "Skip to content")}
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
        <nav aria-label={t("メインナビゲーション", "Main navigation")}>
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-label={en ? n.en : n.label}
              title={en ? n.en : n.label}
              className={`nav-item ${path === n.href ? "active" : ""}`}
              aria-current={path === n.href ? "page" : undefined}
            >
              <n.icon size={19} />
              <span>{en ? n.en : n.label}</span>
              {path === n.href && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link
            className="nav-item"
            href="/workspaces"
            aria-label={t("個人ワークスペース", "Personal workspace")}
          >
            <BookOpen size={19} />
            <span>{t("個人ワークスペース", "Personal workspace")}</span>
          </Link>
          <Link
            href="/settings"
            aria-label={t("設定", "Settings")}
            className={`nav-item ${path === "/settings" ? "active" : ""}`}
          >
            <Settings size={19} />
            <span>{t("設定", "Settings")}</span>
          </Link>
          {!personal && (
            <div className="profile">
              <span className="avatar">D</span>
              <span>
                {t("デモワークスペース", "Demo workspace")}
                <small>
                  {t("このブラウザだけに保存", "Stored in this browser")}
                </small>
              </span>
            </div>
          )}
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            aria-label={t("サイドバー切替", "Toggle sidebar")}
            aria-expanded={!collapsed}
            onClick={() => {
              setCollapsed(!collapsed);
              try {
                localStorage.setItem(
                  "iamt-sidebar",
                  !collapsed ? "collapsed" : "expanded",
                );
              } catch {}
            }}
          >
            ☰
          </button>
          <select
            aria-label="Language"
            value={en ? "en" : "ja"}
            onChange={(e) => setEn(e.target.value === "en")}
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
          <span>
            Workspace <span className="slash">/</span>{" "}
            <strong>
              {personal
                ? t("個人ワークスペース", "Personal workspace")
                : (nav.find((n) => n.href === path)?.en ?? "Settings")}
            </strong>
          </span>
          {!personal && (
            <span className="demo-tag">
              <FlaskConical size={14} /> V4 Demo
            </span>
          )}
        </header>
        {!personal && (
          <div className="demo-banner">
            <span className="status-dot" />
            {t(
              "デモ：AI・アカウント・クラウド保存は未接続です。",
              "Demo: AI, accounts and cloud storage are not connected.",
            )}
          </div>
        )}
        {!personal && storageError && (
          <p role="alert" className="storage-warning">
            {t(
              "ブラウザ保存が利用できません。現在の記録はこの画面を閉じると失われます。",
              "Browser storage is unavailable. Records may be lost when you close this page.",
            )}
          </p>
        )}
        <main id="main">
          {ready ? (
            children
          ) : (
            <p className="muted">
              {t("ワークスペースを準備中…", "Loading workspace…")}
            </p>
          )}
        </main>
        <footer>
          IAMT <span></span>
          <span>PROTOTYPE · V0.1</span>
        </footer>
      </div>
    </div>
  );
}
