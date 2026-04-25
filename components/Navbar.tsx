"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Shield, Zap, Clock, Radio, RefreshCw, Loader2, Check, AlertTriangle, Users } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

type RefreshStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; downloaded: number; cached: number; missing: number; players: number }
  | { kind: "error"; message: string };

export default function Navbar() {
  const { syncMode, delaySeconds } = useAppStore();
  const [refresh, setRefresh] = useState<RefreshStatus>({ kind: "idle" });
  const pathname = usePathname();
  const teamsActive = pathname?.startsWith("/teams") ?? false;

  const veilStatus = (() => {
    if (syncMode === "synced") return { label: "TV Synced", color: "#3b82f6", Icon: Radio, pulse: true };
    if (syncMode === "delay") return { label: `${delaySeconds}s Delay`, color: "#f59e0b", Icon: Clock, pulse: true };
    return { label: "Live", color: "#22c55e", Icon: Zap, pulse: false };
  })();

  async function refreshHeadshots() {
    if (refresh.kind === "loading") return;
    setRefresh({ kind: "loading" });
    try {
      const res = await fetch("/api/wnba/headshots/refresh", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setRefresh({ kind: "error", message: data.error ?? `HTTP ${res.status}` });
      } else {
        setRefresh({
          kind: "done",
          downloaded: data.downloaded ?? 0,
          cached: data.cached ?? 0,
          missing: data.missing ?? 0,
          players: data.players ?? 0,
        });
      }
    } catch (err) {
      setRefresh({ kind: "error", message: (err as Error).message });
    }
    // Auto-clear after 6 seconds so the badge doesn't linger.
    setTimeout(() => setRefresh({ kind: "idle" }), 6000);
  }

  const refreshIcon = (() => {
    if (refresh.kind === "loading") return <Loader2 size={13} className="animate-spin" />;
    if (refresh.kind === "done") return <Check size={13} />;
    if (refresh.kind === "error") return <AlertTriangle size={13} />;
    return <RefreshCw size={13} />;
  })();

  const refreshTitle = (() => {
    if (refresh.kind === "loading") return "Downloading WNBA player headshots…";
    if (refresh.kind === "done") {
      return `${refresh.downloaded} new · ${refresh.cached} cached · ${refresh.missing} missing (${refresh.players} players)`;
    }
    if (refresh.kind === "error") return `Refresh failed: ${refresh.message}`;
    return "Refresh player headshots";
  })();

  const refreshTone = (() => {
    if (refresh.kind === "done") return { color: "#22c55e", border: "rgba(34,197,94,0.4)", bg: "rgba(34,197,94,0.1)" };
    if (refresh.kind === "error") return { color: "#ef4444", border: "rgba(239,68,68,0.4)", bg: "rgba(239,68,68,0.1)" };
    if (refresh.kind === "loading") return { color: "#a855f7", border: "rgba(168,85,247,0.4)", bg: "rgba(168,85,247,0.1)" };
    return { color: "rgba(255,255,255,0.5)", border: "rgba(255,255,255,0.1)", bg: "transparent" };
  })();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06]"
      style={{ background: "rgba(10,10,15,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo + primary nav */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold"
              style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
              🏀
            </div>
            <span className="font-bold text-base text-white hidden sm:block tracking-tight">
              WNBA <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                SyncCourt
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/teams"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border",
                teamsActive
                  ? "text-white border-white/20 bg-white/[0.06]"
                  : "text-white/45 border-transparent hover:text-white/80 hover:border-white/10",
              )}>
              <Users size={13} />
              <span>Teams</span>
            </Link>
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Status pill — when refresh has feedback, show the count instead. */}
          {refresh.kind === "done" ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
              style={{ color: "#22c55e", borderColor: "rgba(34,197,94,0.4)", background: "rgba(34,197,94,0.12)" }}>
              <Check size={11} />
              <span>+{refresh.downloaded} headshots ({refresh.missing} missing)</span>
            </div>
          ) : refresh.kind === "error" ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
              style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.12)" }}>
              <AlertTriangle size={11} />
              <span className="max-w-[180px] truncate">{refresh.message}</span>
            </div>
          ) : (
            <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border")}
              style={{
                color: veilStatus.color,
                borderColor: `${veilStatus.color}40`,
                background: `${veilStatus.color}12`,
              }}>
              <span className={cn("w-1.5 h-1.5 rounded-full", veilStatus.pulse && "pulse-live")}
                style={{ background: veilStatus.color }} />
              <veilStatus.Icon size={11} />
              <span>{veilStatus.label}</span>
            </div>
          )}

          <button
            onClick={refreshHeadshots}
            disabled={refresh.kind === "loading"}
            className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors disabled:cursor-wait"
            title={refreshTitle}
            style={{
              color: refreshTone.color,
              borderColor: refreshTone.border,
              background: refreshTone.bg,
            }}>
            {refreshIcon}
          </button>

          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
            title="Spoiler Veil">
            <Shield size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
