"use client";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, RotateCcw, Settings as SettingsIcon, Type } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  useAppStore,
  FONT_SCALE_MIN,
  FONT_SCALE_MAX,
  FONT_SCALE_STEP,
} from "@/store/useAppStore";

export default function SettingsPage() {
  const fontScale = useAppStore((s) => s.fontScale);
  const increase = useAppStore((s) => s.increaseFontScale);
  const decrease = useAppStore((s) => s.decreaseFontScale);
  const reset = useAppStore((s) => s.resetFontScale);

  const pct = Math.round(fontScale * 100);
  const atMin = fontScale <= FONT_SCALE_MIN + 0.001;
  const atMax = fontScale >= FONT_SCALE_MAX - 0.001;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-5">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors w-fit">
          <ArrowLeft size={12} />
          Home
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon size={20} className="text-white/60" />
            <span>
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                Settings
              </span>
            </span>
          </h1>
          <p className="text-sm text-white/30 mt-1">
            Preferences are saved locally and apply across all pages.
          </p>
        </div>

        {/* Font size card */}
        <section
          className="rounded-2xl border p-5 flex flex-col gap-4"
          style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)" }}>
              <Type size={18} className="text-purple-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-white">Font size</h2>
              <p className="text-xs text-white/50 leading-relaxed mt-0.5">
                Scale text and UI everywhere in the app. Useful on phones or smaller
                screens. Range {Math.round(FONT_SCALE_MIN * 100)}% – {Math.round(FONT_SCALE_MAX * 100)}%.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={decrease}
              disabled={atMin}
              aria-label="Decrease font size"
              title="Decrease font size"
              className="w-11 h-11 rounded-xl border flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/30 hover:bg-white/[0.04]"
              style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <Minus size={18} className="text-white/80" />
            </button>

            <div
              className="flex-1 flex flex-col items-center justify-center py-3 rounded-xl border"
              style={{
                background: "rgba(168,85,247,0.08)",
                borderColor: "rgba(168,85,247,0.3)",
              }}>
              <span className="text-3xl font-extrabold tabular-nums leading-none text-purple-300">
                {pct}%
              </span>
              <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1.5 font-semibold">
                Current scale
              </span>
            </div>

            <button
              type="button"
              onClick={increase}
              disabled={atMax}
              aria-label="Increase font size"
              title="Increase font size"
              className="w-11 h-11 rounded-xl border flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/30 hover:bg-white/[0.04]"
              style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <Plus size={18} className="text-white/80" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
              <div
                className="h-full transition-all duration-200"
                style={{
                  width: `${((fontScale - FONT_SCALE_MIN) / (FONT_SCALE_MAX - FONT_SCALE_MIN)) * 100}%`,
                  background: "linear-gradient(90deg, #a855f7, #3b82f6)",
                }}
              />
            </div>
            <button
              type="button"
              onClick={reset}
              disabled={fontScale === 1}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-all disabled:opacity-30">
              <RotateCcw size={11} />
              Reset
            </button>
          </div>

          {/* Live preview so the user can see the effect */}
          <div
            className="mt-1 p-3 rounded-xl border"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-1.5">
              Preview
            </p>
            <p className="text-sm text-white/85">
              Caitlin Clark scored 22 points on 8/16 shooting in the Indiana Fever&apos;s
              78&ndash;71 win over the Las Vegas Aces.
            </p>
            <p className="text-xs text-white/45 mt-1">
              Q3 · 4:21 left · ESPN · 2h ago
            </p>
          </div>
        </section>

        <p className="text-[11px] text-white/30 text-center">
          Step size: {Math.round(FONT_SCALE_STEP * 100)}%. Settings are stored on this device only.
        </p>
      </main>
    </div>
  );
}
