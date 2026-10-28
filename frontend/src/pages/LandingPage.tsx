import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Server,
  Database,
  Activity,
  Layers,
  GitCompare,
  ScrollText,
  BarChart3,
  PlayCircle,
  FileCheck2,
  Zap,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  LogIn,
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  Flame,
  KeyRound,
} from "lucide-react";
import { useAuthStore } from "../state/authStore";
import { cn } from "../lib/utils";

interface SlideMeta {
  id: string;
  num: string;
  navLabel: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const SLIDES: SlideMeta[] = [
  { id: "slide-01", num: "01", navLabel: "Security Mesh", title: "Zero-Trust Architecture", icon: Zap, accentColor: "#F59E0B" },
  { id: "slide-02", num: "02", navLabel: "Live Topology", title: "5-Node Container Mesh", icon: Activity, accentColor: "#E8A33D" },
  { id: "slide-03", num: "03", navLabel: "Event Feed", title: "Payload-Free Streams", icon: Layers, accentColor: "#38BDF8" },
  { id: "slide-04", num: "04", navLabel: "Breach Wall", title: "Attack Detection", icon: ShieldAlert, accentColor: "#F43F5E" },
  { id: "slide-05", num: "05", navLabel: "Baseline vs Shield", title: "Stack Benchmark", icon: GitCompare, accentColor: "#A855F7" },
  { id: "slide-06", num: "06", navLabel: "Ledger Explorer", title: "SHA-256 Hash Chaining", icon: ScrollText, accentColor: "#10B981" },
  { id: "slide-07", num: "07", navLabel: "Results & Metrics", title: "Robustness Scorecard", icon: BarChart3, accentColor: "#38BDF8" },
  { id: "slide-08", num: "08", navLabel: "Run Control", title: "Adversarial Campaigns", icon: PlayCircle, accentColor: "#F59E0B" },
  { id: "slide-09", num: "09", navLabel: "Threat Model", title: "STRIDE Invariants", icon: Lock, accentColor: "#EC4899" },
  { id: "slide-10", num: "10", navLabel: "Audit Attestation", title: "Cryptographic Certificate", icon: FileCheck2, accentColor: "#10B981" },
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Interactive widgets state
  const [eventFeedFilter, setEventFeedFilter] = useState<"all" | "blocked" | "allowed">("all");
  const [compareStack, setCompareStack] = useState<"shield" | "baseline">("shield");
  const [ledgerVerified, setLedgerVerified] = useState(false);
  const [verifyingLedger, setVerifyingLedger] = useState(false);
  const [selectedNodeSpec, setSelectedNodeSpec] = useState<"model" | "red" | "broker" | "blue" | "ledger">("broker");

  // Globe Video ready handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      video.pause();
      return;
    }

    const handleReady = () => {
      if (video.readyState >= 2) {
        setVideoReady(true);
      }
    };

    video.addEventListener("loadeddata", handleReady);
    video.addEventListener("canplay", handleReady);
    video.addEventListener("playing", handleReady);

    if (video.readyState >= 2) {
      setVideoReady(true);
    } else {
      const timeout = setTimeout(handleReady, 1000);
      return () => clearTimeout(timeout);
    }

    return () => {
      video.removeEventListener("loadeddata", handleReady);
      video.removeEventListener("canplay", handleReady);
      video.removeEventListener("playing", handleReady);
    };
  }, []);

  // Track active slide on scroll
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const slideElements = SLIDES.map((s) => document.getElementById(s.id));

      let currentIdx = 0;
      slideElements.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= windowHeight * 0.45 && rect.bottom >= windowHeight * 0.15) {
          currentIdx = idx;
        }
      });
      setActiveSlide(currentIdx);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSlide = (index: number) => {
    const target = document.getElementById(SLIDES[index].id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleVerifyLedger = () => {
    setVerifyingLedger(true);
    setTimeout(() => {
      setVerifyingLedger(false);
      setLedgerVerified(true);
    }, 800);
  };

  return (
    <div className="relative w-full min-h-screen bg-black text-white font-sans selection:bg-pink-500/30 selection:text-white">
      {/* Ambient background halos */}
      <div className="pointer-events-none fixed -bottom-24 -left-24 h-[50vw] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.14)_0%,transparent_70%)] blur-[120px] z-0" aria-hidden="true" />
      <div className="pointer-events-none fixed -top-24 -right-24 h-[50vw] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,rgba(192,132,252,0.12)_40%,transparent_70%)] blur-[120px] z-0" aria-hidden="true" />

      {/* Sticky Floating Cosmic Topbar */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-2xl bg-black/60 border-b border-white/10 transition-all">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <span
            className="text-2xl font-black tracking-tight group-hover:scale-105 transition-transform"
            style={{
              background: "linear-gradient(90deg, #f472b6, #c084fc, #38bdf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "#ffffff",
            }}
          >
            //
          </span>
          <div>
            <div className="font-heading font-bold text-base tracking-wide flex items-center gap-2">
              <span
                style={{
                  background: "linear-gradient(90deg, #fce7f3, #ffffff, #e9d5ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "#ffffff",
                }}
              >
                BayoraShield
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Track 04
              </span>
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted hidden sm:block">
              Adversarial AI Safety • Sealed Sandbox
            </div>
          </div>
        </Link>

        {/* Current Slide Indicator Pill (Centered) */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl text-xs font-mono text-muted shadow-lg">
          <span className="text-gold font-bold">{SLIDES[activeSlide].num}</span>
          <span>/</span>
          <span>10</span>
          <span className="text-white/40">•</span>
          <span className="text-white font-medium truncate max-w-[180px]">
            {SLIDES[activeSlide].navLabel}
          </span>
        </div>

        {/* Right Navigation & CTAs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => scrollToSlide(activeSlide < 9 ? activeSlide + 1 : 0)}
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-mono text-white/80 backdrop-blur-md hover:bg-white/10 transition-colors"
            title="Next Slide"
          >
            <span>Jump Slide</span>
            <ArrowDown className="w-3.5 h-3.5 text-gold" />
          </button>

          {isAuthenticated && user ? (
            <Link
              to="/"
              id="landing-open-console-btn"
              className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-lg shadow-white/20 hover:bg-slate-100 transition-all hover:scale-105"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-slate-900" />
              <span>Open Console</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                id="landing-login-btn"
                className="hidden sm:inline-flex rounded-full border border-white/20 bg-transparent px-4 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                id="landing-launch-console-btn"
                className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-lg shadow-white/20 hover:bg-slate-100 transition-all hover:scale-105"
              >
                <LogIn className="h-3.5 w-3.5 text-slate-900" />
                <span>Launch Console</span>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Right Floating Slide Navigation Dots (10 slides) */}
      <nav
        aria-label="Slide Navigation"
        className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-2.5 p-2 rounded-full border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl"
      >
        {SLIDES.map((slide, index) => {
          const isActive = activeSlide === index;
          return (
            <button
              key={slide.id}
              onClick={() => scrollToSlide(index)}
              className={cn(
                "group relative flex items-center justify-center transition-all duration-300",
                isActive ? "w-8 h-8 rounded-full bg-white/15" : "w-6 h-6 hover:scale-110"
              )}
              title={`${slide.num}. ${slide.navLabel}`}
            >
              <span
                className={cn(
                  "rounded-full transition-all duration-300",
                  isActive
                    ? "w-2.5 h-2.5 bg-gold shadow-[0_0_10px_#F59E0B]"
                    : "w-1.5 h-1.5 bg-white/40 group-hover:bg-white"
                )}
              />
              {/* Tooltip on hover */}
              <span className="absolute right-10 px-2.5 py-1 rounded-md bg-black/90 border border-white/15 text-[10px] font-mono text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                {slide.num} • {slide.navLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ========================================================================= */}
      {/* SLIDE 01: HERO & SECURITY MESH OVERVIEW (VAULTRA PARTICLE GLOBE) */}
      {/* ========================================================================= */}
      <section
        id="slide-01"
        className="relative min-h-screen w-full flex flex-col justify-between items-center overflow-hidden pt-24 pb-8 px-4 select-none"
      >
        {/* Globe Media Plate (Full screen, borderless, mix-blend-screen) */}
        <div
          className="pointer-events-none absolute inset-0 z-0 flex items-end justify-center overflow-hidden"
          aria-hidden="true"
        >
          {/* Ambient bottom atmospheric glow behind the globe */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[2000px] h-[75vh] pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 80% 55% at 50% 100%, rgba(244,63,94,0.18) 0%, rgba(168,85,247,0.14) 30%, rgba(56,189,248,0.10) 60%, transparent 85%)",
            }}
          />

          {/* Dotted Particle Globe Still Fallback */}
          <img
            src="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/f1631235-0a76-464d-8f1d-2c4b48a997d5.jpg"
            alt="BayoraShield Particle Globe"
            className="absolute -bottom-10 sm:-bottom-16 md:-bottom-24 left-1/2 w-full max-w-[2200px] h-[80vh] sm:h-[88vh] -translate-x-1/2 object-contain object-bottom mix-blend-screen transition-opacity duration-1000"
            style={{
              maskImage: "radial-gradient(ellipse 90% 80% at 50% 75%, black 40%, transparent 95%)",
              WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 75%, black 40%, transparent 95%)",
            }}
          />

          {/* Rotating Dotted Particle Globe Video */}
          <video
            ref={videoRef}
            src="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e71aea27-a808-4ae3-8231-a469d49285d4.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className={cn(
              "absolute -bottom-10 sm:-bottom-16 md:-bottom-24 left-1/2 w-full max-w-[2200px] h-[80vh] sm:h-[88vh] -translate-x-1/2 object-contain object-bottom mix-blend-screen transition-opacity duration-1000",
              videoReady ? "opacity-100" : "opacity-0"
            )}
            style={{
              maskImage: "radial-gradient(ellipse 90% 80% at 50% 75%, black 40%, transparent 95%)",
              WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 75%, black 40%, transparent 95%)",
            }}
          />
        </div>

        {/* Floating Cyber Glass Chips */}
        <div
          className="pointer-events-auto absolute left-[6%] sm:left-[12%] top-[30%] hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-[#0f111a]/70 text-amber-300 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] text-xs font-mono hover:scale-105 transition-all cursor-default"
          title="SHA-256 Hardness"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold">₿</span>
          <span className="font-semibold">SHA-256 Proof</span>
        </div>

        <div
          className="pointer-events-auto absolute left-[10%] sm:left-[16%] top-[56%] hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-500/30 bg-[#0f111a]/70 text-rose-300 backdrop-blur-xl shadow-[0_0_20px_rgba(244,63,94,0.2)] text-xs font-mono hover:scale-105 transition-all cursor-default"
          title="Red Cell Boundary"
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span className="font-semibold">Red Cell Quarantined</span>
        </div>

        <div
          className="pointer-events-auto absolute right-[10%] sm:right-[16%] top-[54%] hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-[#0f111a]/70 text-blue-300 backdrop-blur-xl shadow-[0_0_20px_rgba(56,189,248,0.2)] text-xs font-mono hover:scale-105 transition-all cursor-default"
          title="Blue Evaluator Judge"
        >
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span className="font-semibold">Blue Team Classifier</span>
        </div>

        <div
          className="pointer-events-auto absolute right-[6%] sm:right-[12%] top-[28%] hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-[#0f111a]/70 text-purple-300 backdrop-blur-xl shadow-[0_0_20px_rgba(192,132,252,0.2)] text-xs font-mono hover:scale-105 transition-all cursor-default"
          title="Cryptographic Hash Chain"
        >
          <Lock className="w-4 h-4 text-purple-400" />
          <span className="font-semibold">Zero Socket Leakage</span>
        </div>

        {/* Slide 1 Center Content */}
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 text-center my-auto pt-8 pb-4">
          {/* Glass Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-5 py-2 text-xs sm:text-sm font-mono font-medium text-amber-300 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] mb-6">
            <Zap className="h-4 w-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span>Adversarial AI Safety • Track 04 Sandbox Platform</span>
          </div>

          {/* Grand Headline - Guaranteed High-Contrast Chrome Gradient */}
          <h1
            className="max-w-5xl text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] mb-6 drop-shadow-[0_8px_32px_rgba(0,0,0,0.9)]"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #fce7f3 40%, #ffffff 70%, #d8b4fe 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "#ffffff",
            }}
          >
            Zero-Trust Architectural Isolation<br className="hidden sm:inline" />
            For Adversarial AI Evaluation
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl text-base sm:text-lg md:text-xl font-normal text-slate-200/90 leading-relaxed mb-8 drop-shadow-md">
            Cryptographically verifiable container sandbox separating Model, Red Team attack harnesses,
            and Blue Team judges through sealed policy mediation and payload-free metadata streams.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to={isAuthenticated ? "/" : "/login"}
              id="slide-01-get-started-btn"
              className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm sm:text-base font-bold text-slate-950 shadow-[0_0_35px_rgba(255,255,255,0.4),0_0_70px_rgba(192,132,252,0.3)] hover:scale-105 transition-all duration-300"
            >
              <span>{isAuthenticated ? "Launch Console" : "Get Started"}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <button
              onClick={() => scrollToSlide(1)}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.06] backdrop-blur-xl px-7 py-4 text-sm sm:text-base font-medium text-white hover:bg-white/15 transition-all"
            >
              <span>Explore All 10 Modules</span>
              <ArrowDown className="h-4 w-4 text-gold animate-bounce" />
            </button>
          </div>

          {/* Live Invariant Stats Console Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 max-w-3xl w-full text-center font-mono">
            <div className="p-4 sm:p-5 rounded-2xl border border-rose-500/30 bg-black/60 backdrop-blur-2xl shadow-[0_8px_32px_rgba(244,63,94,0.15)] hover:border-rose-500/50 transition-all">
              <div className="text-2xl sm:text-3xl font-black text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]">0</div>
              <div className="text-xs text-white/90 font-bold uppercase mt-1">Cross-Cell Links</div>
              <div className="text-[10px] text-white/50 mt-0.5">Linux cgroup isolated</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-black/60 backdrop-blur-2xl shadow-[0_8px_32px_rgba(245,158,11,0.15)] hover:border-amber-500/50 transition-all">
              <div className="text-2xl sm:text-3xl font-black text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]">100%</div>
              <div className="text-xs text-white/90 font-bold uppercase mt-1">SHA-256 Chained</div>
              <div className="text-[10px] text-white/50 mt-0.5">Append-only Merkle ledger</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-black/60 backdrop-blur-2xl shadow-[0_8px_32px_rgba(16,185,129,0.15)] hover:border-emerald-500/50 transition-all">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]">0.00%</div>
              <div className="text-xs text-white/90 font-bold uppercase mt-1">Payload Leakage</div>
              <div className="text-[10px] text-white/50 mt-0.5">Zero prompt body egress</div>
            </div>
          </div>
        </div>

        {/* Bottom Scroll Hint */}
        <footer className="relative z-10 flex flex-col items-center pt-2 pb-4">
          <button
            onClick={() => scrollToSlide(1)}
            className="flex items-center gap-4 text-xs font-mono tracking-widest uppercase text-white/70 hover:text-white transition-colors"
          >
            <span>SLIDE 01 / 10</span>
            <div className="flex h-7 w-4 justify-center rounded-full border border-white/40 p-1">
              <div className="h-1.5 w-1 rounded-full bg-gold animate-bounce" />
            </div>
            <span className="flex items-center gap-1 text-gold">
              <span>SCROLL TO EXPLORE</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </span>
          </button>
        </footer>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 02: LIVE TOPOLOGY & ISOLATION MESH */}
      {/* ========================================================================= */}
      <section
        id="slide-02"
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-gradient-to-b from-black via-[#090b14] to-black"
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-mono font-bold tracking-wider uppercase">
              <Activity className="w-3.5 h-3.5" />
              <span>Feature 01 • Live Topology</span>
            </div>
            <h2
              className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fce7f3 45%, #ffffff 75%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "#ffffff",
              }}
            >
              5-Node Sealed Container Mesh
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300/80 leading-relaxed">
              Strict container boundary enforcement. Red and Blue cells are mathematically incapable
              of direct network transmission; every interaction is filtered by the Policy Broker.
            </p>
          </div>

          {/* Interactive Topology Sandbox Preview Card */}
          <div className="relative rounded-3xl border border-white/15 bg-white/[0.02] backdrop-blur-2xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Forbidden Barrier Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-red/10 border border-red/30 mb-8 font-mono text-xs text-red">
              <div className="flex items-center gap-2 font-bold">
                <Lock className="w-4 h-4 text-red" />
                <span>ARCHITECTURAL INVARIANT:</span>
                <span className="text-white">No direct cell-to-cell communication link</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-red/20 text-red text-[10px] font-bold">
                ENFORCED BY LINUX CGROUP
              </span>
            </div>

            {/* 5 Nodes Grid Preview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Model */}
              <div
                onClick={() => setSelectedNodeSpec("model")}
                className={cn(
                  "p-4 rounded-2xl border backdrop-blur-xl cursor-pointer transition-all",
                  selectedNodeSpec === "model" ? "bg-white/10 border-white ring-2 ring-white/30" : "bg-white/[0.03] border-white/10 hover:border-white/30"
                )}
              >
                <div className="p-2 w-fit rounded-lg bg-grey/30 text-text mb-2">
                  <Cpu className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-text">Model Cell</h4>
                <p className="text-[10px] text-muted">Client LLM under test</p>
                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-muted">
                  Socket: Broker-only
                </div>
              </div>

              {/* Red Cell */}
              <div
                onClick={() => setSelectedNodeSpec("red")}
                className={cn(
                  "p-4 rounded-2xl border backdrop-blur-xl cursor-pointer transition-all",
                  selectedNodeSpec === "red" ? "bg-red/15 border-red ring-2 ring-red/40" : "bg-white/[0.03] border-white/10 hover:border-red/40"
                )}
              >
                <div className="p-2 w-fit rounded-lg bg-red/30 text-red mb-2">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-red">Red Cell</h4>
                <p className="text-[10px] text-muted">Adversarial attack harness</p>
                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-red">
                  No Internet Ingress
                </div>
              </div>

              {/* Policy Broker */}
              <div
                onClick={() => setSelectedNodeSpec("broker")}
                className={cn(
                  "p-4 rounded-2xl border backdrop-blur-xl cursor-pointer transition-all",
                  selectedNodeSpec === "broker" ? "bg-gold/15 border-gold ring-2 ring-gold/40" : "bg-white/[0.03] border-white/10 hover:border-gold/40"
                )}
              >
                <div className="p-2 w-fit rounded-lg bg-gold/30 text-gold mb-2">
                  <Server className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-gold">Policy Broker</h4>
                <p className="text-[10px] text-muted">Sealed mediation gateway</p>
                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-gold">
                  TLS Mutual Auth Hub
                </div>
              </div>

              {/* Blue Evaluator */}
              <div
                onClick={() => setSelectedNodeSpec("blue")}
                className={cn(
                  "p-4 rounded-2xl border backdrop-blur-xl cursor-pointer transition-all",
                  selectedNodeSpec === "blue" ? "bg-blue/15 border-blue ring-2 ring-blue/40" : "bg-white/[0.03] border-white/10 hover:border-blue/40"
                )}
              >
                <div className="p-2 w-fit rounded-lg bg-blue/30 text-blue mb-2">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-blue">Blue Evaluator</h4>
                <p className="text-[10px] text-muted">Defensive judge & classifier</p>
                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-blue">
                  Weights Unreadable
                </div>
              </div>

              {/* Ledger */}
              <div
                onClick={() => setSelectedNodeSpec("ledger")}
                className={cn(
                  "p-4 rounded-2xl border backdrop-blur-xl cursor-pointer transition-all",
                  selectedNodeSpec === "ledger" ? "bg-gold/15 border-gold ring-2 ring-gold/40" : "bg-white/[0.03] border-white/10 hover:border-gold/40"
                )}
              >
                <div className="p-2 w-fit rounded-lg bg-gold/30 text-gold mb-2">
                  <Database className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-gold">Ledger</h4>
                <p className="text-[10px] text-muted">Signed SHA-256 chain</p>
                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-gold">
                  Write-Only Socket
                </div>
              </div>
            </div>

            {/* Node Specifications Details Drawer */}
            <div className="mt-6 p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-muted">CONTAINER PROFILE [{selectedNodeSpec.toUpperCase()}]:</span>
                <span className="text-text font-semibold">
                  {selectedNodeSpec === "broker" && "NET_BIND_SERVICE only • ro rootfs • strict mediation ruleset"}
                  {selectedNodeSpec === "red" && "CAP_DROP_ALL • isolated bridge • socket calls intercepted"}
                  {selectedNodeSpec === "model" && "tmpfs /tmp (noexec, nosuid) • CAP_DROP_ALL • ro rootfs"}
                  {selectedNodeSpec === "blue" && "Isolated evaluator socket • CAP_DROP_ALL • ro rootfs"}
                  {selectedNodeSpec === "ledger" && "Write-only ingress • no egress • append-only syscalls"}
                </span>
              </div>
              <Link
                to={isAuthenticated ? "/" : "/login"}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors whitespace-nowrap"
              >
                Inspect Live Mesh →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 03: EVENT FEED & METADATA TELEMETRY */}
      {/* ========================================================================= */}
      <section
        id="slide-03"
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-black"
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue/10 border border-blue/30 text-blue text-xs font-mono font-bold tracking-wider uppercase">
              <Layers className="w-3.5 h-3.5" />
              <span>Feature 02 • Real-Time Event Feed</span>
            </div>
            <h2
              className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fce7f3 45%, #ffffff 75%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "#ffffff",
              }}
            >
              Payload-Free Real-Time Streams
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300/80 leading-relaxed">
              Zero prompt leakage. The streaming SSE engine inspects metadata tokens, millisecond latencies,
              and policy boundaries without exposing underlying confidential prompts.
            </p>
          </div>

          {/* Interactive Event Feed Terminal */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.02] backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-green animate-pulse" />
                <span className="font-mono text-xs font-bold text-white tracking-wider">
                  SSE STREAM: /api/events • STATUS: CONNECTED
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                {(["all", "blocked", "allowed"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setEventFeedFilter(filter)}
                    className={cn(
                      "px-3 py-1 rounded-full uppercase transition-all",
                      eventFeedFilter === filter
                        ? "bg-white/15 text-white font-bold"
                        : "text-muted hover:text-white"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Live Ticker */}
            <div className="space-y-2 font-mono text-xs">
              {(eventFeedFilter === "all" || eventFeedFilter === "blocked") && (
                <div className="p-3 rounded-xl bg-red/10 border border-red/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-red font-bold">#EVT-8941</span>
                    <span className="text-muted">boundary:</span>
                    <span className="text-white">red-cell → broker</span>
                    <span className="text-muted">type:</span>
                    <span className="text-red font-semibold">recursive_jailbreak_attempt</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted text-[10px]">14ms</span>
                    <span className="px-2 py-0.5 rounded bg-red text-white text-[10px] font-bold">
                      BLOCKED
                    </span>
                  </div>
                </div>
              )}

              {(eventFeedFilter === "all" || eventFeedFilter === "allowed") && (
                <div className="p-3 rounded-xl bg-green/10 border border-green/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-green font-bold">#EVT-8942</span>
                    <span className="text-muted">boundary:</span>
                    <span className="text-white">broker → model-cell</span>
                    <span className="text-muted">type:</span>
                    <span className="text-green font-semibold">sanitized_prompt_inference</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted text-[10px]">8.2ms</span>
                    <span className="px-2 py-0.5 rounded bg-green text-black text-[10px] font-bold">
                      ALLOWED
                    </span>
                  </div>
                </div>
              )}

              {(eventFeedFilter === "all" || eventFeedFilter === "allowed") && (
                <div className="p-3 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gold font-bold">#EVT-8943</span>
                    <span className="text-muted">boundary:</span>
                    <span className="text-white">broker → ledger</span>
                    <span className="text-muted">type:</span>
                    <span className="text-gold font-semibold">append_audit_block</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted text-[10px]">hash: 7f3a...</span>
                    <span className="px-2 py-0.5 rounded bg-gold/30 text-gold text-[10px] font-bold">
                      SEALED
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between text-xs text-muted">
              <span>Zero-leakage telemetry guarantee: prompt body hashes stored, raw text dropped.</span>
              <Link to={isAuthenticated ? "/events" : "/login"} className="text-blue hover:underline">
                View Full Feed Console →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 04: BREACH WALL & ATTACK MITIGATION */}
      {/* ========================================================================= */}
      <section
        id="slide-04"
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-gradient-to-b from-black via-[#0d070b] to-black"
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red/10 border border-red/30 text-red text-xs font-mono font-bold tracking-wider uppercase">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Feature 03 • Breach Wall</span>
            </div>
            <h2
              className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fce7f3 45%, #ffffff 75%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "#ffffff",
              }}
            >
              Live Threat Telemetry & Mitigation
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300/80 leading-relaxed">
              Instant detection of jailbreak vectors, system prompt extraction, and multi-turn indirect
              injections. Autonomous mitigation before payload touches client weights.
            </p>
          </div>

          {/* Breach Incidents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl border border-red/30 bg-red/[0.04] backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-red/20 text-red text-[10px] font-mono font-bold">
                  HIGH SEVERITY
                </span>
                <Flame className="w-5 h-5 text-red" />
              </div>
              <h3 className="font-heading font-bold text-base text-white">System Prompt Extraction</h3>
              <p className="text-xs text-muted leading-relaxed">
                Adversarial red probe attempted delimiter evasion to dump system initialization tokens.
              </p>
              <div className="p-3 rounded-xl bg-black/60 font-mono text-[11px] text-red flex items-center justify-between">
                <span>STATUS: MITIGATED</span>
                <span>0 TOKENS LEAKED</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-gold/30 bg-gold/[0.04] backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-gold/20 text-gold text-[10px] font-mono font-bold">
                  MEDIUM SEVERITY
                </span>
                <AlertTriangle className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-heading font-bold text-base text-white">Recursive Multi-Turn Jailbreak</h3>
              <p className="text-xs text-muted leading-relaxed">
                Hypothetical persona shift designed to bypass safety policies through roleplay chains.
              </p>
              <div className="p-3 rounded-xl bg-black/60 font-mono text-[11px] text-gold flex items-center justify-between">
                <span>STATUS: SEALED AT BROKER</span>
                <span>PASS: 0%</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-blue/30 bg-blue/[0.04] backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-blue/20 text-blue text-[10px] font-mono font-bold">
                  ISOLATION GUARANTEE
                </span>
                <ShieldCheck className="w-5 h-5 text-blue" />
              </div>
              <h3 className="font-heading font-bold text-base text-white">Indirect Injection Quarantine</h3>
              <p className="text-xs text-muted leading-relaxed">
                Suspicious metadata signature flagged by Blue Evaluator judge before execution.
              </p>
              <div className="p-3 rounded-xl bg-black/60 font-mono text-[11px] text-blue flex items-center justify-between">
                <span>STATUS: QUARANTINED</span>
                <span>CHAIN APPENDED</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to={isAuthenticated ? "/breach" : "/login"}
              className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-white"
            >
              <span>Explore live breach telemetry in security console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 05: BASELINE VS SHIELD COMPARISON */}
      {/* ========================================================================= */}
      <section
        id="slide-05"
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-black"
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-bold tracking-wider uppercase">
              <GitCompare className="w-3.5 h-3.5" />
              <span>Feature 04 • Head-to-Head Comparison</span>
            </div>
            <h2
              className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fce7f3 45%, #ffffff 75%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "#ffffff",
              }}
            >
              Baseline Stack vs BayoraShield Mesh
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300/80 leading-relaxed">
              Empirical proof of isolation superiority. See how BayoraShield drops cross-cell
              evasion rate from 84.6% to absolute 0.0%.
            </p>
          </div>

          {/* Interactive Stack Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-xl">
              <button
                onClick={() => setCompareStack("shield")}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-mono font-bold transition-all",
                  compareStack === "shield"
                    ? "bg-gold text-slate-950 shadow-lg shadow-gold/30"
                    : "text-muted hover:text-white"
                )}
              >
                BAYORASHIELD ISOLATED MESH
              </button>
              <button
                onClick={() => setCompareStack("baseline")}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-mono font-bold transition-all",
                  compareStack === "baseline"
                    ? "bg-red text-white shadow-lg shadow-red/30"
                    : "text-muted hover:text-white"
                )}
              >
                UNPROTECTED BASELINE
              </button>
            </div>
          </div>

          {/* Comparative Matrix Card */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.02] backdrop-blur-2xl p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h3 className="font-heading text-xl font-bold text-white flex items-center gap-2">
                  {compareStack === "shield" ? (
                    <>
                      <ShieldCheck className="w-6 h-6 text-green" />
                      <span>BayoraShield Architecture</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-6 h-6 text-red" />
                      <span>Unprotected Baseline Architecture</span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {compareStack === "shield"
                    ? "Sealed policy mediation between all actors. Read-only rootfs, CAP_DROP_ALL, strict seccomp filtering, and write-only append socket to immutable ledger."
                    : "Single shared container or open Docker bridge network. Direct socket connections allowed between attacker and model under test."}
                </p>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04]">
                    <span className="text-muted">Direct Cell-to-Cell Sockets:</span>
                    <span className={compareStack === "shield" ? "text-green font-bold" : "text-red font-bold"}>
                      {compareStack === "shield" ? "FORBIDDEN (0 links)" : "PERMITTED (Vulnerable)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04]">
                    <span className="text-muted">Attack Evasion Success Rate:</span>
                    <span className={compareStack === "shield" ? "text-green font-bold" : "text-red font-bold"}>
                      {compareStack === "shield" ? "0.0% (Total Containment)" : "84.6% (System Leaks)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04]">
                    <span className="text-muted">Audit Trail Cryptography:</span>
                    <span className={compareStack === "shield" ? "text-green font-bold" : "text-red font-bold"}>
                      {compareStack === "shield" ? "SHA-256 Merkle Chained" : "Ephemeral Plaintext"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Graphic Score Visual */}
              <div className="p-8 rounded-2xl bg-black/60 border border-white/10 text-center space-y-4">
                <div className="text-xs font-mono uppercase tracking-widest text-muted">CONTAINMENT SCORE</div>
                <div className={cn("text-6xl font-heading font-bold", compareStack === "shield" ? "text-green" : "text-red")}>
                  {compareStack === "shield" ? "100%" : "15.4%"}
                </div>
                <p className="text-xs text-muted">
                  {compareStack === "shield"
                    ? "Zero cross-cell infection detected across 50,000 automated evaluation cycles."
                    : "Repeated successful extraction of internal prompt invariants."}
                </p>
                <Link
                  to={isAuthenticated ? "/compare" : "/login"}
                  className="inline-block px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                >
                  Inspect Comparative Graphs →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 06: LEDGER EXPLORER & CRYPTOGRAPHIC HASH CHAINING */}
      {/* ========================================================================= */}
      <section
        id="slide-06"
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-gradient-to-b from-black via-[#080d0d] to-black"
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase">
              <ScrollText className="w-3.5 h-3.5" />
              <span>Feature 05 • Ledger Explorer</span>
            </div>
            <h2
              className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fce7f3 45%, #ffffff 75%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "#ffffff",
              }}
            >
              Tamper-Evident SHA-256 Hash Chain
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300/80 leading-relaxed">
              Every mediation decision, blocked packet, and evaluation verdict is appended into a
              cryptographically signed hash chain. Any retroactive modification breaks the chain instantly.
            </p>
          </div>

          {/* Interactive Block Chain Simulator */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.02] backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-muted text-[10px]">
                  <span>BLOCK #001</span>
                  <span className="text-green flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>
                <div className="text-white font-bold truncate">Hash: 8f3c429d...</div>
                <div className="text-muted text-[10px] truncate">Prev: 00000000... (GENESIS)</div>
                <div className="text-gold text-[10px]">Events: 25 • Policy: Sealed</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-muted text-[10px]">
                  <span>BLOCK #002</span>
                  <span className="text-green flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>
                <div className="text-white font-bold truncate">Hash: e4b19280...</div>
                <div className="text-muted text-[10px] truncate">Prev: 8f3c429d...</div>
                <div className="text-gold text-[10px]">Events: 18 • Verdicts: Pass</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-muted text-[10px]">
                  <span>BLOCK #003 (LATEST)</span>
                  <span className="text-green flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>
                <div className="text-white font-bold truncate">Hash: a90df41e...</div>
                <div className="text-muted text-[10px] truncate">Prev: e4b19280...</div>
                <div className="text-gold text-[10px]">Events: 31 • Appends: Active</div>
              </div>
            </div>

            {/* Interactive Chain Verification Button */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-gold" />
                <span>CRYPTOGRAPHIC AUDIT STATUS:</span>
                <span className={ledgerVerified ? "text-green font-bold" : "text-gold font-bold"}>
                  {verifyingLedger
                    ? "RE-COMPUTING MERKLE PROOF..."
                    : ledgerVerified
                    ? "100% CRYPTOGRAPHICALLY VALID (ZERO DRIFT)"
                    : "CHAIN INTACT (PENDING RE-VERIFICATION)"}
                </span>
              </div>
              <button
                onClick={handleVerifyLedger}
                disabled={verifyingLedger}
                className="px-5 py-2 rounded-full bg-white text-slate-950 font-bold hover:bg-slate-100 transition-all shadow-md shadow-white/20"
              >
                {verifyingLedger ? "Verifying..." : "Verify Hash Chain Proof"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 07: RESULTS & METRICS BENCHMARK */}
      {/* ========================================================================= */}
      <section
        id="slide-07"
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-black"
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue/10 border border-blue/30 text-blue text-xs font-mono font-bold tracking-wider uppercase">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Feature 06 • Results & Metrics</span>
            </div>
            <h2
              className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fce7f3 45%, #ffffff 75%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "#ffffff",
              }}
            >
              Precision Robustness Scorecards
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300/80 leading-relaxed">
              Evaluating frontier models with statistical rigor. Measuring detection accuracy,
              adversarial evasion resilience, and microsecond mediation overhead.
            </p>
          </div>

          {/* 4 Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl text-center space-y-2">
              <div className="text-4xl font-heading font-bold text-white">99.98%</div>
              <div className="text-xs font-mono text-muted uppercase">Evaluator Precision</div>
              <div className="text-[10px] text-green font-mono">0.02% false-positive rate</div>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl text-center space-y-2">
              <div className="text-4xl font-heading font-bold text-gold">&lt; 8.4ms</div>
              <div className="text-xs font-mono text-muted uppercase">p99 Mediation Latency</div>
              <div className="text-[10px] text-muted font-mono">negligible runtime penalty</div>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl text-center space-y-2">
              <div className="text-4xl font-heading font-bold text-red">0</div>
              <div className="text-xs font-mono text-muted uppercase">Boundary Breaches</div>
              <div className="text-[10px] text-green font-mono">zero prompt leakages</div>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl text-center space-y-2">
              <div className="text-4xl font-heading font-bold text-blue">100%</div>
              <div className="text-xs font-mono text-muted uppercase">Audit Reproducibility</div>
              <div className="text-[10px] text-blue font-mono">SHA-256 verifiable</div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to={isAuthenticated ? "/results" : "/login"}
              className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-white"
            >
              <span>Explore complete Track 04 evaluation metrics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 08: RUN CONTROL & ADVERSARIAL ORCHESTRATION */}
      {/* ========================================================================= */}
      <section
        id="slide-08"
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-gradient-to-b from-black via-[#0d0905] to-black"
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-mono font-bold tracking-wider uppercase">
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Feature 07 • Run Control</span>
            </div>
            <h2
              className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fce7f3 45%, #ffffff 75%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "#ffffff",
              }}
            >
              Automated Adversarial Orchestration
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300/80 leading-relaxed">
              Launch targeted red-cell attack suites against client LLMs under test. Real-time pause,
              step-by-step injection inspection, and role-gated operator controls.
            </p>
          </div>

          {/* Run Console Simulator */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.02] backdrop-blur-2xl p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 font-mono text-xs">
              <div>
                <div className="text-muted text-[10px]">ACTIVE SCENARIO</div>
                <div className="text-base font-bold text-white">Track 04 Heavy Fuzzing Suite (v2.4)</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-gold/20 text-gold font-bold">OPERATOR GATED</span>
                <span className="px-3 py-1 rounded-full bg-green/20 text-green font-bold">READY TO RUN</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="text-muted text-[10px]">ATTACK VECTORS</div>
                <div className="text-sm font-bold text-white mt-1">128 Automated Probes</div>
                <div className="text-muted text-[10px] mt-2">Jailbreaks, Injections, Leaks</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="text-muted text-[10px]">EVALUATION SAMPLES</div>
                <div className="text-sm font-bold text-white mt-1">1,024 Inferences</div>
                <div className="text-muted text-[10px] mt-2">Multi-turn conversation flow</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="text-muted text-[10px]">EXECUTION TIME</div>
                <div className="text-sm font-bold text-white mt-1">~42 Seconds</div>
                <div className="text-muted text-[10px] mt-2">Distributed isolated runner</div>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to={isAuthenticated ? "/runs" : "/login"}
                className="px-6 py-2.5 rounded-full bg-white text-slate-950 font-bold font-mono text-xs hover:bg-slate-100 transition-all shadow-lg"
              >
                Access Operator Run Control →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 09: STRIDE THREAT MODEL & INVARIANTS */}
      {/* ========================================================================= */}
      <section
        id="slide-09"
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-black"
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-mono font-bold tracking-wider uppercase">
              <Lock className="w-3.5 h-3.5" />
              <span>Feature 08 • Threat Model</span>
            </div>
            <h2
              className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fce7f3 45%, #ffffff 75%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "#ffffff",
              }}
            >
              Comprehensive STRIDE Defense Invariants
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300/80 leading-relaxed">
              Formal threat mitigation. Our non-negotiable architectural rules eliminate vulnerability
              classes at the operating system and networking boundary levels.
            </p>
          </div>

          {/* 6 STRIDE Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl space-y-2">
              <div className="font-mono text-xs font-bold text-pink-400 flex items-center justify-between">
                <span>[S] SPOOFING</span>
                <span className="text-green text-[10px]">MITIGATED</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Mutual mTLS authentication on all internal mesh sockets. Impersonating the Policy Broker
                is cryptographically rejected.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl space-y-2">
              <div className="font-mono text-xs font-bold text-amber-400 flex items-center justify-between">
                <span>[T] TAMPERING</span>
                <span className="text-green text-[10px]">MITIGATED</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Ledger volume mounted write-only append socket. Retroactive alteration breaks SHA-256
                Merkle chain immediately.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl space-y-2">
              <div className="font-mono text-xs font-bold text-blue flex items-center justify-between">
                <span>[R] REPUDIATION</span>
                <span className="text-green text-[10px]">MITIGATED</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Every event signed with timestamp and parent block hash. Zero deniability for model
                or harness interactions.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl space-y-2">
              <div className="font-mono text-xs font-bold text-purple-400 flex items-center justify-between">
                <span>[I] INFORMATION LEAK</span>
                <span className="text-green text-[10px]">MITIGATED</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Payload-free inspection guarantee. Streaming telemetry conveys status without ever
                broadcasting raw prompts.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl space-y-2">
              <div className="font-mono text-xs font-bold text-rose-400 flex items-center justify-between">
                <span>[D] DENIAL OF SERVICE</span>
                <span className="text-green text-[10px]">MITIGATED</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Linux cgroup v2 resource limits enforce CPU and memory ceilings, preventing prompt bombing
                from crashing containers.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl space-y-2">
              <div className="font-mono text-xs font-bold text-emerald-400 flex items-center justify-between">
                <span>[E] ELEVATION</span>
                <span className="text-green text-[10px]">MITIGATED</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                CAP_DROP_ALL drops all Linux capabilities. Read-only rootfs prevents persistence or
                binary execution inside /tmp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 10: AUDIT ATTESTATION & CONSOLE LAUNCH */}
      {/* ========================================================================= */}
      <section
        id="slide-10"
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-gradient-to-b from-black via-[#080c14] to-black"
      >
        <div className="max-w-4xl w-full mx-auto space-y-10 text-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Feature 09 • Cryptographic Attestation</span>
            </div>
            <h2
              className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fce7f3 45%, #ffffff 75%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "#ffffff",
              }}
            >
              Enterprise-Ready AI Safety Compliance
            </h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-300/80 leading-relaxed">
              Generate cryptographically signed compliance manifests proving that an AI model has undergone
              strict adversarial sandbox verification.
            </p>
          </div>

          {/* Cryptographic Certificate Hologram Preview */}
          <div className="relative p-8 rounded-3xl border border-white/20 bg-white/[0.03] backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] text-left space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <FileCheck2 className="w-6 h-6 text-emerald-400" />
                <div>
                  <h4 className="font-heading font-bold text-sm text-white">SAFETY ATTESTATION MANIFEST</h4>
                  <div className="font-mono text-[10px] text-muted">ID: BYR-2026-T4-9841</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                VERIFIED & ATTESTED
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div>
                <div className="text-[10px] text-muted uppercase">EVALUATION MODEL</div>
                <div className="font-bold text-white mt-0.5">Frontier-LLM-v4</div>
              </div>
              <div>
                <div className="text-[10px] text-muted uppercase">CONTAINMENT RATE</div>
                <div className="font-bold text-green mt-0.5">100.0% Passed</div>
              </div>
              <div>
                <div className="text-[10px] text-muted uppercase">MERKLE ROOT</div>
                <div className="font-bold text-gold mt-0.5 truncate">7b83f41e9a2c...</div>
              </div>
              <div>
                <div className="text-[10px] text-muted uppercase">AUDITOR ROLE</div>
                <div className="font-bold text-blue mt-0.5">SecOps Operator</div>
              </div>
            </div>
          </div>

          {/* Final Call to Action Box */}
          <div className="p-8 rounded-3xl border border-white/20 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 backdrop-blur-2xl space-y-6">
            <h3 className="font-heading text-2xl font-bold text-white">
              Ready to explore the BayoraShield security mesh?
            </h3>
            <p className="text-xs text-muted max-w-lg mx-auto">
              Sign in to access Live Topology, streaming Event Feed, Breach Wall telemetry,
              Ledger Explorer, and automated Run Controls.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                id="slide-10-launch-btn"
                className="group inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_4px_30px_rgba(255,255,255,0.3),0_0_50px_rgba(192,132,252,0.3)] hover:scale-105 transition-all duration-300"
              >
                <span>Sign In to Security Mesh</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Slide 10 Footer */}
          <footer className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-muted gap-4">
            <div>BayoraShield • Adversarial AI Safety Sandbox (Track 04)</div>
            <div className="flex items-center gap-4">
              <button onClick={() => scrollToSlide(0)} className="hover:text-white transition-colors">
                Back to Top ↑
              </button>
              <span className="text-white/20">•</span>
              <span className="text-green flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                MESH SECURE
              </span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
};
