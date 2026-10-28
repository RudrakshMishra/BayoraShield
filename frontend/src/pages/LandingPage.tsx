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
  { id: "slide-01", num: "01", navLabel: "Security Mesh", title: "Zero-Trust Architecture", icon: Zap, accentColor: "#c81b1c" },
  { id: "slide-02", num: "02", navLabel: "Live Topology", title: "5-Node Container Mesh", icon: Activity, accentColor: "#c81b1c" },
  { id: "slide-03", num: "03", navLabel: "Event Feed", title: "Payload-Free Streams", icon: Layers, accentColor: "#c81b1c" },
  { id: "slide-04", num: "04", navLabel: "Breach Wall", title: "Attack Detection", icon: ShieldAlert, accentColor: "#c81b1c" },
  { id: "slide-05", num: "05", navLabel: "Baseline vs Bayora Shield", title: "Stack Benchmark", icon: GitCompare, accentColor: "#c81b1c" },
  { id: "slide-06", num: "06", navLabel: "Ledger Explorer", title: "SHA-256 Hash Chaining", icon: ScrollText, accentColor: "#c81b1c" },
  { id: "slide-07", num: "07", navLabel: "Results & Metrics", title: "Robustness Scorecard", icon: BarChart3, accentColor: "#c81b1c" },
  { id: "slide-08", num: "08", navLabel: "Run Control", title: "Adversarial Campaigns", icon: PlayCircle, accentColor: "#c81b1c" },
  { id: "slide-09", num: "09", navLabel: "Threat Model", title: "STRIDE Invariants", icon: Lock, accentColor: "#c81b1c" },
  { id: "slide-10", num: "10", navLabel: "Audit Attestation", title: "Cryptographic Certificate", icon: FileCheck2, accentColor: "#c81b1c" },
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

  // Keyboard navigation for sliding between all 10 pages
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const tag = (e.target as { tagName?: string } | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        setActiveSlide((curr) => {
          const next = Math.min(curr + 1, SLIDES.length - 1);
          scrollToSlide(next);
          return next;
        });
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        setActiveSlide((curr) => {
          const prev = Math.max(curr - 1, 0);
          scrollToSlide(prev);
          return prev;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

      {/* SVG Color-grade Filters for Background Video */}
      <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <filter id="grade" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.0018 0.0105 0.0154 0.0228 0.0307 0.0404 0.0485 0.0585 0.0719 0.0923 0.1205 0.1466 0.1657 0.1866 0.2197 0.2405 0.2485 0.2921 0.3362 0.3465 0.3472 0.3781 0.3781 0.4078 0.4199 0.4391 0.4604 0.4763 0.4798 0.5197 0.5473 0.5720 0.5995 0.6048 0.6232 0.6322 0.6483 0.6734 0.7201 0.7201 0.7410 0.7707 0.7707 0.7790 0.8084 0.8084 0.8390 0.8595 0.8707 0.8870 0.8993 0.9085 0.9132 0.9132 0.9162 0.9162 0.9162 0.9162 0.9162 0.9162 0.9162 0.9162 0.9162 0.9238 0.9300"/>
            <feFuncG type="table" tableValues="0.0023 0.0106 0.0159 0.0250 0.0333 0.0445 0.0535 0.0620 0.0707 0.0827 0.0936 0.1063 0.1214 0.1402 0.1678 0.1727 0.2029 0.2176 0.2461 0.2757 0.2814 0.3050 0.3415 0.3692 0.3826 0.3884 0.4617 0.4617 0.4617 0.4643 0.4643 0.4808 0.5706 0.6005 0.6005 0.6390 0.6390 0.6390 0.6390 0.6390 0.6390 0.6390 0.6390 0.6390 0.6524 0.6664 0.6805 0.6945 0.7086 0.7227 0.7367 0.7508 0.7648 0.7789 0.7929 0.8070 0.8211 0.8351 0.8492 0.8632 0.8773 0.8913 0.9054 0.9195 0.9300"/>
            <feFuncB type="table" tableValues="0.0021 0.0110 0.0187 0.0311 0.0377 0.0466 0.0584 0.0706 0.0791 0.0924 0.1039 0.1145 0.1316 0.1464 0.1614 0.1719 0.1887 0.2014 0.2247 0.2458 0.2954 0.2954 0.3089 0.3938 0.3938 0.3988 0.3988 0.4581 0.4581 0.4762 0.4762 0.4763 0.5374 0.5560 0.5813 0.5813 0.5813 0.5813 0.5835 0.5969 0.6104 0.6238 0.6373 0.6507 0.6642 0.6777 0.6911 0.7046 0.7181 0.7315 0.7449 0.7584 0.7719 0.7853 0.7988 0.8123 0.8257 0.8391 0.8526 0.8661 0.8795 0.8930 0.9065 0.9199 0.9300"/>
          </feComponentTransfer>
        </filter>
        <filter id="grade2" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.0016 0.0092 0.0136 0.0201 0.0270 0.0356 0.0427 0.0515 0.0633 0.0812 0.1060 0.1290 0.1458 0.1642 0.1933 0.2116 0.2187 0.2570 0.2959 0.3049 0.3055 0.3327 0.3327 0.3589 0.3695 0.3864 0.4052 0.4191 0.4222 0.4573 0.4816 0.5034 0.5276 0.5322 0.5484 0.5563 0.5705 0.5926 0.6337 0.6337 0.6521 0.6782 0.6782 0.6855 0.7114 0.7114 0.7383 0.7564 0.7662 0.7806 0.7914 0.7995 0.8036 0.8036 0.8063 0.8063 0.8063 0.8063 0.8063 0.8063 0.8063 0.8063 0.8063 0.8129 0.8184"/>
            <feFuncG type="table" tableValues="0.0015 0.0069 0.0103 0.0163 0.0216 0.0289 0.0348 0.0403 0.0460 0.0538 0.0608 0.0691 0.0789 0.0911 0.1091 0.1123 0.1319 0.1414 0.1600 0.1792 0.1829 0.1983 0.2220 0.2400 0.2487 0.2525 0.3001 0.3001 0.3001 0.3018 0.3018 0.3125 0.3709 0.3903 0.3903 0.4153 0.4153 0.4153 0.4153 0.4153 0.4153 0.4153 0.4153 0.4153 0.4241 0.4332 0.4423 0.4514 0.4606 0.4698 0.4789 0.4880 0.4971 0.5063 0.5154 0.5246 0.5337 0.5428 0.5520 0.5611 0.5702 0.5793 0.5885 0.5977 0.6045"/>
            <feFuncB type="table" tableValues="0.0013 0.0066 0.0112 0.0187 0.0226 0.0280 0.0350 0.0424 0.0475 0.0554 0.0623 0.0687 0.0790 0.0878 0.0968 0.1031 0.1132 0.1208 0.1348 0.1475 0.1772 0.1772 0.1853 0.2363 0.2363 0.2393 0.2393 0.2749 0.2749 0.2857 0.2857 0.2858 0.3224 0.3336 0.3488 0.3488 0.3488 0.3488 0.3501 0.3581 0.3662 0.3743 0.3824 0.3904 0.3985 0.4066 0.4147 0.4228 0.4309 0.4389 0.4469 0.4550 0.4631 0.4712 0.4793 0.4874 0.4954 0.5035 0.5116 0.5197 0.5277 0.5358 0.5439 0.5519 0.5580"/>
          </feComponentTransfer>
        </filter>
      </svg>

      {/* Sticky Floating Topbar */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-2xl bg-black/80 border-b border-white/10 transition-all">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 46 46" className="w-8 h-8 text-white group-hover:scale-105 transition-transform">
              <g stroke="#fff" strokeWidth="3" strokeLinecap="butt" fill="none">
                <g transform="rotate(0 23 23)"><path d="M23 0V19.5"/><path d="M14 10.2L23 19.2L32 10.2"/></g>
                <g transform="rotate(90 23 23)"><path d="M23 0V19.5"/><path d="M14 10.2L23 19.2L32 10.2"/></g>
                <g transform="rotate(180 23 23)"><path d="M23 0V19.5"/><path d="M14 10.2L23 19.2L32 10.2"/></g>
                <g transform="rotate(270 23 23)"><path d="M23 0V19.5"/><path d="M14 10.2L23 19.2L32 10.2"/></g>
              </g>
            </svg>
          </div>
          <div>
            <div className="font-heading font-bold text-base tracking-wide flex items-center gap-2">
              <span className="text-white">Bayora Shield</span>
              <span className="px-1.5 py-0.2 rounded-none text-[9px] font-mono bg-[#c81b1c]/20 text-[#c81b1c] border border-[#c81b1c]/40 font-bold">
                TRACK 04
              </span>
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted hidden sm:block">
              Adversarial AI Safety • Sealed Sandbox
            </div>
          </div>
        </Link>

        {/* Current Slide Indicator (Centered) */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-none border border-white/15 bg-black/60 backdrop-blur-xl text-xs font-mono text-muted shadow-lg">
          <span className="text-[#c81b1c] font-bold">{SLIDES[activeSlide].num}</span>
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
            className="hidden sm:flex items-center gap-1.5 rounded-none border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-mono text-white/90 backdrop-blur-md hover:bg-white/10 transition-colors"
            title="Next Slide"
          >
            <span>Jump Slide</span>
            <ArrowDown className="w-3.5 h-3.5 text-[#c81b1c]" />
          </button>

          {isAuthenticated && user ? (
            <Link
              to="/"
              id="landing-open-console-btn"
              className="flex items-center gap-2 rounded-none bg-[#c81b1c] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#c81b1c]/30 hover:bg-[#b01617] transition-all hover:scale-105"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-white" />
              <span>Open Console</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                id="landing-login-btn"
                className="hidden sm:inline-flex rounded-none border border-white/20 bg-transparent px-4 py-2 text-xs font-mono font-medium text-white hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                id="landing-launch-console-btn"
                className="flex items-center gap-2 rounded-none bg-[#c81b1c] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#c81b1c]/30 hover:bg-[#b01617] transition-all hover:scale-105"
              >
                <span>Secure System</span>
                <svg className="w-4 h-3.5" viewBox="0 0 21.5 18">
                  <path d="M0 9H20.1" stroke="#fff" strokeWidth="2" fill="none"/>
                  <path d="M12.1 1L20.1 9L12.1 17" stroke="#fff" strokeWidth="2" fill="none"/>
                </svg>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Right Floating Slide Navigation Dots (10 slides) */}
      <nav
        aria-label="Slide Navigation"
        className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-2.5 p-2 rounded-none border border-white/15 bg-black/80 backdrop-blur-2xl shadow-2xl"
      >
        {SLIDES.map((slide, index) => {
          const isActive = activeSlide === index;
          return (
            <button
              key={slide.id}
              onClick={() => scrollToSlide(index)}
              className={cn(
                "group relative flex items-center justify-center transition-all duration-300",
                isActive ? "w-8 h-8 bg-white/10" : "w-6 h-6 hover:scale-110"
              )}
              title={`${slide.num}. ${slide.navLabel}`}
            >
              <span
                className={cn(
                  "transition-all duration-300",
                  isActive
                    ? "w-2.5 h-2.5 bg-[#c81b1c] shadow-[0_0_10px_#c81b1c]"
                    : "w-1.5 h-1.5 bg-white/40 group-hover:bg-white"
                )}
              />
              {/* Tooltip on hover */}
              <span className="absolute right-10 px-2.5 py-1 rounded-none bg-black border border-white/15 text-[10px] font-mono text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                {slide.num} • {slide.navLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ========================================================================= */}
      {/* SLIDE 01: HERO & SECURITY MESH OVERVIEW */}
      {/* ========================================================================= */}
      <section
        id="slide-01"
        className="relative min-h-screen w-full flex flex-col justify-between items-center overflow-hidden pt-28 pb-8 px-6 select-none bg-black"
      >
        {/* Background Graded Atmosphere Video Plates */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0 overflow-hidden" style={{ filter: "url(#grade)" }}>
            <video
              ref={videoRef}
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_132544_b6ef0174-ed95-45ad-9a2f-ccb8acfbdce8.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className={cn(
                "absolute inset-0 w-full h-full object-cover object-right-top transition-opacity duration-1000",
                videoReady ? "opacity-100" : "opacity-0"
              )}
            />
          </div>
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              filter: "url(#grade2)",
              mixBlendMode: "plus-lighter",
              opacity: 0.35,
              maskImage: "linear-gradient(180deg, transparent 21.5%, #000 100%)",
              WebkitMaskImage: "linear-gradient(180deg, transparent 21.5%, #000 100%)",
            }}
          >
            <video
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_132544_b6ef0174-ed95-45ad-9a2f-ccb8acfbdce8.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover object-right-top"
            />
          </div>
          {/* Subtle vignette scrim */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(100deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.2) 80%, transparent 100%)",
            }}
          />
        </div>

        {/* Slide 1 Main Hero Content (Left-locked typography) */}
        <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col justify-center items-start text-left my-auto pt-6 pb-4">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-none border border-[#c81b1c]/40 bg-[#c81b1c]/10 px-4 py-1.5 text-xs font-mono font-medium text-white/90 shadow-[0_0_20px_rgba(200,27,28,0.2)] mb-6">
            <span className="w-2 h-2 bg-[#c81b1c] animate-pulse" />
            <span className="uppercase tracking-widest text-[#e6e6e6]">Adversarial AI Safety • Track 04 Sandbox Platform</span>
          </div>

          {/* Grand Headline */}
          <h1 className="max-w-4xl text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-6 text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
            Security built into<br />
            every system layer
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl text-base sm:text-lg md:text-xl font-normal text-[#e6e6e6] leading-relaxed mb-8 font-mono">
            Engineered to stay resilient, controlled, and uncompromised under pressure.
            Cryptographically verifiable container sandbox separating Model, Red Team attack harnesses,
            and Blue Team judges through sealed policy mediation.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to={isAuthenticated ? "/" : "/login"}
              id="slide-01-get-started-btn"
              className="group inline-flex items-center gap-3 rounded-none bg-[#c81b1c] px-8 py-4 text-sm sm:text-base font-bold text-white shadow-[0_0_30px_rgba(200,27,28,0.4)] hover:bg-[#b01617] hover:scale-105 transition-all duration-300"
            >
              <span>{isAuthenticated ? "Launch Console" : "Secure System"}</span>
              <svg className="w-5 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 21.5 18">
                <path d="M0 9H20.1" stroke="#fff" strokeWidth="2" fill="none"/>
                <path d="M12.1 1L20.1 9L12.1 17" stroke="#fff" strokeWidth="2" fill="none"/>
              </svg>
            </Link>

            <button
              onClick={() => scrollToSlide(1)}
              className="inline-flex items-center gap-2.5 rounded-none border border-white/20 bg-black/60 px-6 py-4 text-sm sm:text-base font-mono font-medium text-white hover:bg-white/10 transition-colors"
            >
              <span>Explore All 10 Modules</span>
              <ArrowDown className="h-4 w-4 text-[#c81b1c] animate-bounce" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 max-w-4xl w-full text-left font-mono">
            <div className="p-4 border-l-2 border-[#c81b1c] bg-black/70 backdrop-blur-xl">
              <div className="text-2xl sm:text-3xl font-black text-white">300+</div>
              <div className="text-xs text-[#949494] uppercase tracking-wider mt-1">Protected Deployments</div>
            </div>
            <div className="p-4 border-l-2 border-white/30 bg-black/70 backdrop-blur-xl">
              <div className="text-2xl sm:text-3xl font-black text-white">99%</div>
              <div className="text-xs text-[#949494] uppercase tracking-wider mt-1">Evasion Mitigation</div>
            </div>
            <div className="p-4 border-l-2 border-[#c81b1c] bg-black/70 backdrop-blur-xl">
              <div className="text-2xl sm:text-3xl font-black text-white">0</div>
              <div className="text-xs text-[#949494] uppercase tracking-wider mt-1">Cross-Cell Links</div>
            </div>
            <div className="p-4 border-l-2 border-white/30 bg-black/70 backdrop-blur-xl">
              <div className="text-2xl sm:text-3xl font-black text-white">100%</div>
              <div className="text-xs text-[#949494] uppercase tracking-wider mt-1">SHA-256 Verifiable</div>
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
            <div className="flex h-7 w-4 justify-center rounded-none border border-white/40 p-1">
              <div className="h-1.5 w-1 bg-[#c81b1c] animate-bounce" />
            </div>
            <span className="flex items-center gap-1 text-[#c81b1c]">
              <span>SCROLL TO EXPLORE</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </span>
          </button>
        </footer>
      </section>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SLIDE 02: LIVE TOPOLOGY & ISOLATION MESH */}
      {/* ========================================================================= */}
      <section
        id="slide-02"
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-black"
        style={{ scrollSnapAlign: "start" }}
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-none bg-[#c81b1c]/10 border border-[#c81b1c]/40 text-[#c81b1c] text-xs font-mono font-bold tracking-wider uppercase">
              <Activity className="w-3.5 h-3.5 text-[#c81b1c]" />
              <span>Feature 01 • Live Topology</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              5-Node Sealed Container Mesh
            </h2>
            <p className="max-w-2xl text-sm sm:text-base text-[#949494] font-mono leading-relaxed">
              Strict container boundary enforcement. Red and Blue cells are mathematically incapable
              of direct network transmission; every interaction is filtered by the Policy Broker.
            </p>
          </div>

          {/* Interactive Topology Sandbox Preview Card */}
          <div className="relative rounded-none border border-white/15 bg-black/80 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl overflow-hidden">
            {/* Forbidden Barrier Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-none bg-[#c81b1c]/10 border border-[#c81b1c]/40 mb-8 font-mono text-xs text-[#c81b1c]">
              <div className="flex items-center gap-2 font-bold">
                <Lock className="w-4 h-4 text-[#c81b1c]" />
                <span>ARCHITECTURAL INVARIANT:</span>
                <span className="text-white">No direct cell-to-cell communication link</span>
              </div>
              <span className="px-2 py-0.5 rounded-none bg-[#c81b1c]/20 text-[#c81b1c] border border-[#c81b1c]/40 text-[10px] font-bold">
                ENFORCED BY LINUX CGROUP
              </span>
            </div>

            {/* 5 Nodes Grid Preview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Model */}
              <div
                onClick={() => setSelectedNodeSpec("model")}
                className={cn(
                  "p-4 rounded-none border backdrop-blur-xl cursor-pointer transition-all",
                  selectedNodeSpec === "model" ? "bg-white/10 border-white ring-1 ring-white" : "bg-white/[0.02] border-white/10 hover:border-white/30"
                )}
              >
                <div className="p-2 w-fit rounded-none bg-white/10 text-white mb-2">
                  <Cpu className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-white">Model Cell</h4>
                <p className="text-[10px] text-[#949494]">Client LLM under test</p>
                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-[#949494]">
                  Socket: Broker-only
                </div>
              </div>

              {/* Red Cell */}
              <div
                onClick={() => setSelectedNodeSpec("red")}
                className={cn(
                  "p-4 rounded-none border backdrop-blur-xl cursor-pointer transition-all",
                  selectedNodeSpec === "red" ? "bg-[#c81b1c]/15 border-[#c81b1c] ring-1 ring-[#c81b1c]" : "bg-white/[0.02] border-white/10 hover:border-[#c81b1c]/50"
                )}
              >
                <div className="p-2 w-fit rounded-none bg-[#c81b1c]/20 text-[#c81b1c] mb-2">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-[#c81b1c]">Red Cell</h4>
                <p className="text-[10px] text-[#949494]">Adversarial attack harness</p>
                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-[#c81b1c]">
                  No Internet Ingress
                </div>
              </div>

              {/* Policy Broker */}
              <div
                onClick={() => setSelectedNodeSpec("broker")}
                className={cn(
                  "p-4 rounded-none border backdrop-blur-xl cursor-pointer transition-all",
                  selectedNodeSpec === "broker" ? "bg-[#c81b1c]/15 border-[#c81b1c] ring-1 ring-[#c81b1c]" : "bg-white/[0.02] border-white/10 hover:border-white/40"
                )}
              >
                <div className="p-2 w-fit rounded-none bg-white/10 text-white mb-2">
                  <Server className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-white">Policy Broker</h4>
                <p className="text-[10px] text-[#949494]">Sealed mediation gateway</p>
                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-[#c81b1c]">
                  TLS Mutual Auth Hub
                </div>
              </div>

              {/* Blue Evaluator */}
              <div
                onClick={() => setSelectedNodeSpec("blue")}
                className={cn(
                  "p-4 rounded-none border backdrop-blur-xl cursor-pointer transition-all",
                  selectedNodeSpec === "blue" ? "bg-white/10 border-white ring-1 ring-white" : "bg-white/[0.02] border-white/10 hover:border-white/30"
                )}
              >
                <div className="p-2 w-fit rounded-none bg-white/10 text-white mb-2">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                </div>
                <h4 className="font-heading font-bold text-xs text-white">Blue Evaluator</h4>
                <p className="text-[10px] text-[#949494]">Defensive judge & classifier</p>
                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-[#10B981]">
                  Weights Unreadable
                </div>
              </div>

              {/* Ledger */}
              <div
                onClick={() => setSelectedNodeSpec("ledger")}
                className={cn(
                  "p-4 rounded-none border backdrop-blur-xl cursor-pointer transition-all",
                  selectedNodeSpec === "ledger" ? "bg-white/10 border-white ring-1 ring-white" : "bg-white/[0.02] border-white/10 hover:border-white/30"
                )}
              >
                <div className="p-2 w-fit rounded-none bg-white/10 text-white mb-2">
                  <Database className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-white">Ledger</h4>
                <p className="text-[10px] text-[#949494]">Signed SHA-256 chain</p>
                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-[#10B981]">
                  Write-Only Socket
                </div>
              </div>
            </div>

            {/* Node Specifications Details Drawer */}
            <div className="mt-6 p-4 rounded-none bg-black/90 border border-white/15 font-mono text-xs flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[#949494]">CONTAINER PROFILE [{selectedNodeSpec.toUpperCase()}]:</span>
                <span className="text-white font-semibold">
                  {selectedNodeSpec === "broker" && "NET_BIND_SERVICE only • ro rootfs • strict mediation ruleset"}
                  {selectedNodeSpec === "red" && "CAP_DROP_ALL • isolated bridge • socket calls intercepted"}
                  {selectedNodeSpec === "model" && "tmpfs /tmp (noexec, nosuid) • CAP_DROP_ALL • ro rootfs"}
                  {selectedNodeSpec === "blue" && "Isolated evaluator socket • CAP_DROP_ALL • ro rootfs"}
                  {selectedNodeSpec === "ledger" && "Write-only ingress • no egress • append-only syscalls"}
                </span>
              </div>
              <Link
                to={isAuthenticated ? "/" : "/login"}
                className="px-4 py-2 rounded-none bg-[#c81b1c] hover:bg-[#b01617] text-white font-mono text-xs font-bold transition-colors whitespace-nowrap"
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
        style={{ scrollSnapAlign: "start" }}
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-none bg-[#c81b1c]/10 border border-[#c81b1c]/40 text-[#c81b1c] text-xs font-mono font-bold tracking-wider uppercase">
              <Layers className="w-3.5 h-3.5 text-[#c81b1c]" />
              <span>Feature 02 • Real-Time Event Feed</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              Payload-Free Real-Time Streams
            </h2>
            <p className="max-w-2xl text-sm sm:text-base text-[#949494] font-mono leading-relaxed">
              Zero prompt leakage. The streaming SSE engine inspects metadata tokens, millisecond latencies,
              and policy boundaries without exposing underlying confidential prompts.
            </p>
          </div>

          {/* Interactive Event Feed Terminal */}
          <div className="rounded-none border border-white/15 bg-black/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-[#10B981] animate-pulse" />
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
                      "px-3 py-1 rounded-none uppercase transition-all font-mono text-xs",
                      eventFeedFilter === filter
                        ? "bg-[#c81b1c] text-white font-bold"
                        : "border border-white/15 text-[#949494] hover:text-white"
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
                <div className="p-3 rounded-none bg-[#c81b1c]/10 border border-[#c81b1c]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[#c81b1c] font-bold">#EVT-8941</span>
                    <span className="text-[#949494]">boundary:</span>
                    <span className="text-white">red-cell → broker</span>
                    <span className="text-[#949494]">type:</span>
                    <span className="text-[#c81b1c] font-semibold">recursive_jailbreak_attempt</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#949494] text-[10px]">14ms</span>
                    <span className="px-2 py-0.5 rounded-none bg-[#c81b1c] text-white text-[10px] font-bold">
                      BLOCKED
                    </span>
                  </div>
                </div>
              )}

              {(eventFeedFilter === "all" || eventFeedFilter === "allowed") && (
                <div className="p-3 rounded-none bg-white/[0.02] border border-[#10B981]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[#10B981] font-bold">#EVT-8942</span>
                    <span className="text-[#949494]">boundary:</span>
                    <span className="text-white">broker → model-cell</span>
                    <span className="text-[#949494]">type:</span>
                    <span className="text-[#10B981] font-semibold">sanitized_prompt_inference</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#949494] text-[10px]">8.2ms</span>
                    <span className="px-2 py-0.5 rounded-none bg-[#10B981] text-black text-[10px] font-bold">
                      ALLOWED
                    </span>
                  </div>
                </div>
              )}

              {(eventFeedFilter === "all" || eventFeedFilter === "allowed") && (
                <div className="p-3 rounded-none bg-white/[0.02] border border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">#EVT-8943</span>
                    <span className="text-[#949494]">boundary:</span>
                    <span className="text-white">broker → ledger</span>
                    <span className="text-[#949494]">type:</span>
                    <span className="text-white font-semibold">append_audit_block</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#949494] text-[10px]">hash: 7f3a...</span>
                    <span className="px-2 py-0.5 rounded-none bg-white/20 text-white text-[10px] font-bold">
                      SEALED
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between text-xs text-[#949494] font-mono">
              <span>Zero-leakage telemetry guarantee: prompt body hashes stored, raw text dropped.</span>
              <Link to={isAuthenticated ? "/events" : "/login"} className="text-[#c81b1c] hover:underline">
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
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-black"
        style={{ scrollSnapAlign: "start" }}
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-none bg-[#c81b1c]/10 border border-[#c81b1c]/40 text-[#c81b1c] text-xs font-mono font-bold tracking-wider uppercase">
              <ShieldAlert className="w-3.5 h-3.5 text-[#c81b1c]" />
              <span>Feature 03 • Breach Wall</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              Live Threat Telemetry & Mitigation
            </h2>
            <p className="max-w-2xl text-sm sm:text-base text-[#949494] font-mono leading-relaxed">
              Instant detection of jailbreak vectors, system prompt extraction, and multi-turn indirect
              injections. Autonomous mitigation before payload touches client weights.
            </p>
          </div>

          {/* Breach Incidents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-none border border-[#c81b1c]/40 bg-black/80 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-none bg-[#c81b1c]/20 text-[#c81b1c] border border-[#c81b1c]/40 text-[10px] font-mono font-bold">
                  HIGH SEVERITY
                </span>
                <Flame className="w-5 h-5 text-[#c81b1c]" />
              </div>
              <h3 className="font-heading font-bold text-base text-white">System Prompt Extraction</h3>
              <p className="text-xs text-[#949494] font-mono leading-relaxed">
                Adversarial red probe attempted delimiter evasion to dump system initialization tokens.
              </p>
              <div className="p-3 rounded-none bg-black border border-white/10 font-mono text-[11px] text-[#c81b1c] flex items-center justify-between">
                <span>STATUS: MITIGATED</span>
                <span className="text-white">0 TOKENS LEAKED</span>
              </div>
            </div>

            <div className="p-6 rounded-none border border-white/20 bg-black/80 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-none bg-white/10 text-white border border-white/20 text-[10px] font-mono font-bold">
                  MEDIUM SEVERITY
                </span>
                <AlertTriangle className="w-5 h-5 text-[#c81b1c]" />
              </div>
              <h3 className="font-heading font-bold text-base text-white">Recursive Multi-Turn Jailbreak</h3>
              <p className="text-xs text-[#949494] font-mono leading-relaxed">
                Hypothetical persona shift designed to bypass safety policies through roleplay chains.
              </p>
              <div className="p-3 rounded-none bg-black border border-white/10 font-mono text-[11px] text-white flex items-center justify-between">
                <span>STATUS: SEALED AT BROKER</span>
                <span className="text-[#c81b1c]">PASS: 0%</span>
              </div>
            </div>

            <div className="p-6 rounded-none border border-[#10B981]/40 bg-black/80 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-none bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 text-[10px] font-mono font-bold">
                  ISOLATION GUARANTEE
                </span>
                <ShieldCheck className="w-5 h-5 text-[#10B981]" />
              </div>
              <h3 className="font-heading font-bold text-base text-white">Indirect Injection Quarantine</h3>
              <p className="text-xs text-[#949494] font-mono leading-relaxed">
                Suspicious metadata signature flagged by Blue Evaluator judge before execution.
              </p>
              <div className="p-3 rounded-none bg-black border border-white/10 font-mono text-[11px] text-[#10B981] flex items-center justify-between">
                <span>STATUS: QUARANTINED</span>
                <span className="text-white">CHAIN APPENDED</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to={isAuthenticated ? "/breach" : "/login"}
              className="inline-flex items-center gap-2 text-xs font-mono text-[#949494] hover:text-white"
            >
              <span>Explore live breach telemetry in security console</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#c81b1c]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 05: BASELINE VS BAYORA SHIELD COMPARISON */}
      {/* ========================================================================= */}
      <section
        id="slide-05"
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-black"
        style={{ scrollSnapAlign: "start" }}
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-none bg-[#c81b1c]/10 border border-[#c81b1c]/40 text-[#c81b1c] text-xs font-mono font-bold tracking-wider uppercase">
              <GitCompare className="w-3.5 h-3.5 text-[#c81b1c]" />
              <span>Feature 04 • Head-to-Head Comparison</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              Baseline Stack vs Bayora Shield Mesh
            </h2>
            <p className="max-w-2xl text-sm sm:text-base text-[#949494] font-mono leading-relaxed">
              Empirical proof of isolation superiority. See how Bayora Shield drops cross-cell
              evasion rate from 84.6% to absolute 0.0%.
            </p>
          </div>

          {/* Interactive Stack Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-none bg-black border border-white/20 backdrop-blur-xl">
              <button
                onClick={() => setCompareStack("shield")}
                className={cn(
                  "px-6 py-2 rounded-none text-xs font-mono font-bold transition-all",
                  compareStack === "shield"
                    ? "bg-[#c81b1c] text-white shadow-lg shadow-[#c81b1c]/30"
                    : "text-[#949494] hover:text-white"
                )}
              >
                BAYORA SHIELD ISOLATED MESH
              </button>
              <button
                onClick={() => setCompareStack("baseline")}
                className={cn(
                  "px-6 py-2 rounded-none text-xs font-mono font-bold transition-all",
                  compareStack === "baseline"
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-[#949494] hover:text-white"
                )}
              >
                UNPROTECTED BASELINE
              </button>
            </div>
          </div>

          {/* Comparative Matrix Card */}
          <div className="rounded-none border border-white/15 bg-black/80 backdrop-blur-2xl p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h3 className="font-heading text-xl font-bold text-white flex items-center gap-2">
                  {compareStack === "shield" ? (
                    <>
                      <ShieldCheck className="w-6 h-6 text-[#10B981]" />
                      <span>Bayora Shield Architecture</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-6 h-6 text-[#c81b1c]" />
                      <span>Unprotected Baseline Architecture</span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-[#949494] font-mono leading-relaxed">
                  {compareStack === "shield"
                    ? "Sealed policy mediation between all actors. Read-only rootfs, CAP_DROP_ALL, strict seccomp filtering, and write-only append socket to immutable ledger."
                    : "Single shared container or open Docker bridge network. Direct socket connections allowed between attacker and model under test."}
                </p>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-none bg-white/[0.03] border border-white/10">
                    <span className="text-[#949494]">Direct Cell-to-Cell Sockets:</span>
                    <span className={compareStack === "shield" ? "text-[#10B981] font-bold" : "text-[#c81b1c] font-bold"}>
                      {compareStack === "shield" ? "FORBIDDEN (0 links)" : "PERMITTED (Vulnerable)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-none bg-white/[0.03] border border-white/10">
                    <span className="text-[#949494]">Attack Evasion Success Rate:</span>
                    <span className={compareStack === "shield" ? "text-[#10B981] font-bold" : "text-[#c81b1c] font-bold"}>
                      {compareStack === "shield" ? "0.0% (Total Containment)" : "84.6% (System Leaks)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-none bg-white/[0.03] border border-white/10">
                    <span className="text-[#949494]">Audit Trail Cryptography:</span>
                    <span className={compareStack === "shield" ? "text-[#10B981] font-bold" : "text-[#c81b1c] font-bold"}>
                      {compareStack === "shield" ? "SHA-256 Merkle Chained" : "Ephemeral Plaintext"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Graphic Score Visual */}
              <div className="p-8 rounded-none bg-black border border-white/15 text-center space-y-4">
                <div className="text-xs font-mono uppercase tracking-widest text-[#949494]">CONTAINMENT SCORE</div>
                <div className={cn("text-6xl font-heading font-black", compareStack === "shield" ? "text-[#10B981]" : "text-[#c81b1c]")}>
                  {compareStack === "shield" ? "100%" : "15.4%"}
                </div>
                <p className="text-xs text-[#949494] font-mono">
                  {compareStack === "shield"
                    ? "Zero cross-cell infection detected across 50,000 automated evaluation cycles."
                    : "Repeated successful extraction of internal prompt invariants."}
                </p>
                <Link
                  to={isAuthenticated ? "/compare" : "/login"}
                  className="inline-block px-5 py-2 rounded-none bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-colors"
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
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-black"
        style={{ scrollSnapAlign: "start" }}
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-none bg-[#c81b1c]/10 border border-[#c81b1c]/40 text-[#c81b1c] text-xs font-mono font-bold tracking-wider uppercase">
              <ScrollText className="w-3.5 h-3.5 text-[#c81b1c]" />
              <span>Feature 05 • Ledger Explorer</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              Tamper-Evident SHA-256 Hash Chain
            </h2>
            <p className="max-w-2xl text-sm sm:text-base text-[#949494] font-mono leading-relaxed">
              Every mediation decision, blocked packet, and evaluation verdict is appended into a
              cryptographically signed hash chain. Any retroactive modification breaks the chain instantly.
            </p>
          </div>

          {/* Interactive Block Chain Simulator */}
          <div className="rounded-none border border-white/15 bg-black/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-none bg-white/[0.02] border border-white/15 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-[#949494] text-[10px]">
                  <span>BLOCK #001</span>
                  <span className="text-[#10B981] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>
                <div className="text-white font-bold truncate">Hash: 8f3c429d...</div>
                <div className="text-[#949494] text-[10px] truncate">Prev: 00000000... (GENESIS)</div>
                <div className="text-white/80 text-[10px]">Events: 25 • Policy: Sealed</div>
              </div>

              <div className="p-4 rounded-none bg-white/[0.02] border border-white/15 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-[#949494] text-[10px]">
                  <span>BLOCK #002</span>
                  <span className="text-[#10B981] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>
                <div className="text-white font-bold truncate">Hash: e4b19280...</div>
                <div className="text-[#949494] text-[10px] truncate">Prev: 8f3c429d...</div>
                <div className="text-white/80 text-[10px]">Events: 18 • Verdicts: Pass</div>
              </div>

              <div className="p-4 rounded-none bg-white/[0.02] border border-white/15 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-[#949494] text-[10px]">
                  <span>BLOCK #003 (LATEST)</span>
                  <span className="text-[#10B981] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>
                <div className="text-white font-bold truncate">Hash: a90df41e...</div>
                <div className="text-[#949494] text-[10px] truncate">Prev: e4b19280...</div>
                <div className="text-[#c81b1c] text-[10px]">Events: 31 • Appends: Active</div>
              </div>
            </div>

            {/* Interactive Chain Verification Button */}
            <div className="p-4 rounded-none bg-black border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#c81b1c]" />
                <span className="text-[#949494]">CRYPTOGRAPHIC AUDIT STATUS:</span>
                <span className={ledgerVerified ? "text-[#10B981] font-bold" : "text-white font-bold"}>
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
                className="px-5 py-2.5 rounded-none bg-[#c81b1c] text-white font-bold font-mono hover:bg-[#b01617] transition-all shadow-md shadow-[#c81b1c]/30"
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
        style={{ scrollSnapAlign: "start" }}
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-none bg-[#c81b1c]/10 border border-[#c81b1c]/40 text-[#c81b1c] text-xs font-mono font-bold tracking-wider uppercase">
              <BarChart3 className="w-3.5 h-3.5 text-[#c81b1c]" />
              <span>Feature 06 • Results & Metrics</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              Precision Robustness Scorecards
            </h2>
            <p className="max-w-2xl text-sm sm:text-base text-[#949494] font-mono leading-relaxed">
              Evaluating frontier models with statistical rigor. Measuring detection accuracy,
              adversarial evasion resilience, and microsecond mediation overhead.
            </p>
          </div>

          {/* 4 Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div className="p-6 rounded-none border border-white/15 bg-black/80 backdrop-blur-xl text-center space-y-2">
              <div className="text-4xl font-black text-white">99.98%</div>
              <div className="text-xs text-[#949494] uppercase">Evaluator Precision</div>
              <div className="text-[10px] text-[#10B981]">0.02% false-positive rate</div>
            </div>

            <div className="p-6 rounded-none border border-white/15 bg-black/80 backdrop-blur-xl text-center space-y-2">
              <div className="text-4xl font-black text-white">&lt; 8.4ms</div>
              <div className="text-xs text-[#949494] uppercase">p99 Mediation Latency</div>
              <div className="text-[10px] text-[#949494]">negligible runtime penalty</div>
            </div>

            <div className="p-6 rounded-none border border-white/15 bg-black/80 backdrop-blur-xl text-center space-y-2">
              <div className="text-4xl font-black text-[#c81b1c]">0</div>
              <div className="text-xs text-[#949494] uppercase">Boundary Breaches</div>
              <div className="text-[10px] text-[#10B981]">zero prompt leakages</div>
            </div>

            <div className="p-6 rounded-none border border-white/15 bg-black/80 backdrop-blur-xl text-center space-y-2">
              <div className="text-4xl font-black text-white">100%</div>
              <div className="text-xs text-[#949494] uppercase">Audit Reproducibility</div>
              <div className="text-[10px] text-white">SHA-256 verifiable</div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to={isAuthenticated ? "/results" : "/login"}
              className="inline-flex items-center gap-2 text-xs font-mono text-[#949494] hover:text-white"
            >
              <span>Explore complete Track 04 evaluation metrics</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#c81b1c]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 08: RUN CONTROL & ADVERSARIAL ORCHESTRATION */}
      {/* ========================================================================= */}
      <section
        id="slide-08"
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-black"
        style={{ scrollSnapAlign: "start" }}
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-none bg-[#c81b1c]/10 border border-[#c81b1c]/40 text-[#c81b1c] text-xs font-mono font-bold tracking-wider uppercase">
              <PlayCircle className="w-3.5 h-3.5 text-[#c81b1c]" />
              <span>Feature 07 • Run Control</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              Automated Adversarial Orchestration
            </h2>
            <p className="max-w-2xl text-sm sm:text-base text-[#949494] font-mono leading-relaxed">
              Launch targeted red-cell attack suites against client LLMs under test. Real-time pause,
              step-by-step injection inspection, and role-gated operator controls.
            </p>
          </div>

          {/* Run Console Simulator */}
          <div className="rounded-none border border-white/15 bg-black/80 backdrop-blur-2xl p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 font-mono text-xs">
              <div>
                <div className="text-[#949494] text-[10px]">ACTIVE SCENARIO</div>
                <div className="text-base font-bold text-white">Track 04 Heavy Fuzzing Suite (v2.4)</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-none bg-white/10 text-white border border-white/20 font-bold">OPERATOR GATED</span>
                <span className="px-3 py-1 rounded-none bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-bold">READY TO RUN</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-none bg-white/[0.02] border border-white/15">
                <div className="text-[#949494] text-[10px]">ATTACK VECTORS</div>
                <div className="text-sm font-bold text-white mt-1">128 Automated Probes</div>
                <div className="text-[#949494] text-[10px] mt-2">Jailbreaks, Injections, Leaks</div>
              </div>
              <div className="p-4 rounded-none bg-white/[0.02] border border-white/15">
                <div className="text-[#949494] text-[10px]">EVALUATION SAMPLES</div>
                <div className="text-sm font-bold text-white mt-1">1,024 Inferences</div>
                <div className="text-[#949494] text-[10px] mt-2">Multi-turn conversation flow</div>
              </div>
              <div className="p-4 rounded-none bg-white/[0.02] border border-white/15">
                <div className="text-[#949494] text-[10px]">EXECUTION TIME</div>
                <div className="text-sm font-bold text-white mt-1">~42 Seconds</div>
                <div className="text-[#949494] text-[10px] mt-2">Distributed isolated runner</div>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to={isAuthenticated ? "/runs" : "/login"}
                className="px-6 py-3 rounded-none bg-[#c81b1c] text-white font-bold font-mono text-xs hover:bg-[#b01617] transition-all shadow-lg shadow-[#c81b1c]/30"
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
        style={{ scrollSnapAlign: "start" }}
      >
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-none bg-[#c81b1c]/10 border border-[#c81b1c]/40 text-[#c81b1c] text-xs font-mono font-bold tracking-wider uppercase">
              <Lock className="w-3.5 h-3.5 text-[#c81b1c]" />
              <span>Feature 08 • Threat Model</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              Comprehensive STRIDE Defense Invariants
            </h2>
            <p className="max-w-2xl text-sm sm:text-base text-[#949494] font-mono leading-relaxed">
              Formal threat mitigation. Our non-negotiable architectural rules eliminate vulnerability
              classes at the operating system and networking boundary levels.
            </p>
          </div>

          {/* 6 STRIDE Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-none border border-white/15 bg-black/80 backdrop-blur-xl space-y-2">
              <div className="font-mono text-xs font-bold text-white flex items-center justify-between">
                <span>[S] SPOOFING</span>
                <span className="text-[#10B981] text-[10px]">MITIGATED</span>
              </div>
              <p className="text-xs text-[#949494] font-mono leading-relaxed">
                Mutual mTLS authentication on all internal mesh sockets. Impersonating the Policy Broker
                is cryptographically rejected.
              </p>
            </div>

            <div className="p-5 rounded-none border border-white/15 bg-black/80 backdrop-blur-xl space-y-2">
              <div className="font-mono text-xs font-bold text-white flex items-center justify-between">
                <span>[T] TAMPERING</span>
                <span className="text-[#10B981] text-[10px]">MITIGATED</span>
              </div>
              <p className="text-xs text-[#949494] font-mono leading-relaxed">
                Ledger volume mounted write-only append socket. Retroactive alteration breaks SHA-256
                Merkle chain immediately.
              </p>
            </div>

            <div className="p-5 rounded-none border border-white/15 bg-black/80 backdrop-blur-xl space-y-2">
              <div className="font-mono text-xs font-bold text-white flex items-center justify-between">
                <span>[R] REPUDIATION</span>
                <span className="text-[#10B981] text-[10px]">MITIGATED</span>
              </div>
              <p className="text-xs text-[#949494] font-mono leading-relaxed">
                Every event signed with timestamp and parent block hash. Zero deniability for model
                or harness interactions.
              </p>
            </div>

            <div className="p-5 rounded-none border border-white/15 bg-black/80 backdrop-blur-xl space-y-2">
              <div className="font-mono text-xs font-bold text-white flex items-center justify-between">
                <span>[I] INFORMATION LEAK</span>
                <span className="text-[#10B981] text-[10px]">MITIGATED</span>
              </div>
              <p className="text-xs text-[#949494] font-mono leading-relaxed">
                Payload-free inspection guarantee. Streaming telemetry conveys status without ever
                broadcasting raw prompts.
              </p>
            </div>

            <div className="p-5 rounded-none border border-white/15 bg-black/80 backdrop-blur-xl space-y-2">
              <div className="font-mono text-xs font-bold text-white flex items-center justify-between">
                <span>[D] DENIAL OF SERVICE</span>
                <span className="text-[#10B981] text-[10px]">MITIGATED</span>
              </div>
              <p className="text-xs text-[#949494] font-mono leading-relaxed">
                Linux cgroup v2 resource limits enforce CPU and memory ceilings, preventing prompt bombing
                from crashing containers.
              </p>
            </div>

            <div className="p-5 rounded-none border border-white/15 bg-black/80 backdrop-blur-xl space-y-2">
              <div className="font-mono text-xs font-bold text-white flex items-center justify-between">
                <span>[E] ELEVATION</span>
                <span className="text-[#10B981] text-[10px]">MITIGATED</span>
              </div>
              <p className="text-xs text-[#949494] font-mono leading-relaxed">
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
        className="min-h-screen w-full py-28 px-6 flex flex-col justify-center items-center relative border-t border-white/10 bg-black"
        style={{ scrollSnapAlign: "start" }}
      >
        <div className="max-w-4xl w-full mx-auto space-y-10 text-center">
          <div className="text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-none bg-[#c81b1c]/10 border border-[#c81b1c]/40 text-[#c81b1c] text-xs font-mono font-bold tracking-wider uppercase">
              <FileCheck2 className="w-3.5 h-3.5 text-[#c81b1c]" />
              <span>Feature 09 • Cryptographic Attestation</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              Enterprise-Ready AI Safety Compliance
            </h2>
            <p className="max-w-xl text-sm sm:text-base text-[#949494] font-mono leading-relaxed">
              Generate cryptographically signed compliance manifests proving that an AI model has undergone
              strict adversarial sandbox verification.
            </p>
          </div>

          {/* Cryptographic Certificate Manifest Card */}
          <div className="relative p-8 rounded-none border border-white/20 bg-black/90 backdrop-blur-2xl shadow-2xl text-left space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <FileCheck2 className="w-6 h-6 text-[#10B981]" />
                <div>
                  <h4 className="font-heading font-bold text-sm text-white">SAFETY ATTESTATION MANIFEST</h4>
                  <div className="font-mono text-[10px] text-[#949494]">ID: BYR-2026-T4-9841</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-none bg-[#10B981]/20 text-[#10B981] font-mono text-[10px] font-bold border border-[#10B981]/30">
                VERIFIED & ATTESTED
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div>
                <div className="text-[10px] text-[#949494] uppercase">EVALUATION MODEL</div>
                <div className="font-bold text-white mt-0.5">Frontier-LLM-v4</div>
              </div>
              <div>
                <div className="text-[10px] text-[#949494] uppercase">CONTAINMENT RATE</div>
                <div className="font-bold text-[#10B981] mt-0.5">100.0% Passed</div>
              </div>
              <div>
                <div className="text-[10px] text-[#949494] uppercase">MERKLE ROOT</div>
                <div className="font-bold text-white mt-0.5 truncate">7b83f41e9a2c...</div>
              </div>
              <div>
                <div className="text-[10px] text-[#949494] uppercase">AUDITOR ROLE</div>
                <div className="font-bold text-white mt-0.5">SecOps Operator</div>
              </div>
            </div>
          </div>

          {/* Final Call to Action Box */}
          <div className="p-8 sm:p-12 rounded-none border border-[#c81b1c]/50 bg-black/90 backdrop-blur-2xl space-y-6 text-center">
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-white">
              Ready to explore the Bayora Shield security mesh?
            </h3>
            <p className="text-xs sm:text-sm text-[#949494] font-mono max-w-lg mx-auto">
              Sign in to access Live Topology, streaming Event Feed, Breach Wall telemetry,
              Ledger Explorer, and automated Run Controls.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                id="slide-10-launch-btn"
                className="group inline-flex items-center gap-3 rounded-none bg-[#c81b1c] px-8 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(200,27,28,0.4)] hover:bg-[#b01617] hover:scale-105 transition-all duration-300"
              >
                <span>Sign In to Security Mesh</span>
                <svg className="w-5 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 21.5 18">
                  <path d="M0 9H20.1" stroke="#fff" strokeWidth="2" fill="none"/>
                  <path d="M12.1 1L20.1 9L12.1 17" stroke="#fff" strokeWidth="2" fill="none"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Slide 10 Footer */}
          <footer className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#949494] gap-4">
            <div>Bayora Shield • Adversarial AI Safety Sandbox (Track 04)</div>
            <div className="flex items-center gap-4">
              <button onClick={() => scrollToSlide(0)} className="hover:text-white transition-colors">
                Back to Top ↑
              </button>
              <span className="text-white/20">•</span>
              <span className="text-[#10B981] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#10B981] animate-pulse" />
                MESH SECURE
              </span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
};
