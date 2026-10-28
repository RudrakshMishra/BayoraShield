import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  ArrowRight,
  Zap,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";

export const VaultraHeroPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

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

  return (
    <div className="relative -m-6 min-h-[calc(100vh-3.5rem)] flex flex-col justify-between items-center overflow-hidden bg-black text-white font-sans select-none">
      {/* Ambient Radial Glowing Halos */}
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-[45vw] w-[45vw] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.18)_0%,transparent_70%)] blur-[90px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-16 -right-16 h-[45vw] w-[45vw] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.2)_0%,rgba(192,132,252,0.16)_40%,transparent_70%)] blur-[90px]"
        aria-hidden="true"
      />

      {/* Globe Media Plate (Masked) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 flex items-end justify-center overflow-hidden"
        style={{
          maskImage:
            "radial-gradient(ellipse 95% 85% at 50% 60%, black 50%, transparent 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 95% 85% at 50% 60%, black 50%, transparent 90%)",
        }}
        aria-hidden="true"
      >
        <img
          src="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/f1631235-0a76-464d-8f1d-2c4b48a997d5.jpg"
          alt="Vaultra Particle Globe"
          className="absolute -bottom-[12vh] left-1/2 w-screen max-w-[1600px] -translate-x-1/2 object-contain transition-opacity duration-1000"
        />
        <video
          ref={videoRef}
          src="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e71aea27-a808-4ae3-8231-a469d49285d4.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className={`absolute -bottom-[12vh] left-1/2 w-screen max-w-[1600px] -translate-x-1/2 object-contain transition-opacity duration-1000 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Top Navbar */}
      <header className="relative z-20 flex w-full max-w-7xl items-center justify-between px-6 py-6 animate-in fade-in slide-in-from-top-4 duration-1000">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
            //
          </span>
          <span className="text-xl font-semibold tracking-tight text-white">Vaultra</span>
        </div>

        {/* Center Nav Links Pill */}
        <nav className="hidden md:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-xl shadow-2xl">
          <button className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white shadow-inner">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            Home
          </button>
          <a href="#invest" className="rounded-full px-4 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors">
            Invest
          </a>
          <a href="#community" className="rounded-full px-4 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors">
            Community
          </a>
          <a href="#blog" className="rounded-full px-4 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors">
            Blog
          </a>
          <a href="#for-business" className="rounded-full px-4 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors">
            For business
          </a>
          <a href="#membership" className="rounded-full px-4 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors">
            Membership
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md hover:bg-white/10 transition-colors">
            <Globe className="h-3.5 w-3.5 text-white/70" />
            <span>EN</span>
            <ChevronDown className="h-3 w-3 text-white/50" />
          </button>

          <Link
            to="/login"
            className="hidden sm:inline-flex rounded-full border border-white/20 bg-transparent px-4 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors"
          >
            Log In
          </Link>

          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-lg shadow-white/20 hover:bg-slate-100 transition-all hover:scale-105"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-slate-900" />
            <span>Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Center Content */}
      <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 text-center my-auto pt-6 pb-12">
        {/* Glass Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-xl shadow-xl mb-6 animate-in fade-in slide-in-from-bottom-3 duration-1000">
          <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
          <span>Revolutionizing Crypto Finance</span>
        </div>

        {/* Gradient Headline */}
        <h1 className="max-w-3xl text-3xl sm:text-5xl md:text-6xl font-light tracking-tight leading-[1.12] mb-6 bg-gradient-to-r from-pink-200 via-white to-purple-200 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
          Innovative Crypto Financial Solutions<br />
          For Any Investment Challenge
        </h1>

        {/* Subtitle Copy */}
        <p className="max-w-xl text-sm sm:text-base font-normal text-slate-300/80 leading-relaxed mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          We Don't Just Focus On Investments, We Cover Your Entire<br className="hidden sm:inline" />
          Financial Ecosystem, From Budgeting To Retirement.
        </p>

        {/* Primary CTA */}
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-500">
          <a
            href="#get-started"
            className="group inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_4px_30px_rgba(255,255,255,0.3),0_0_50px_rgba(192,132,252,0.3)] hover:scale-105 transition-all duration-300"
          >
            <span>Get Started</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      {/* Floating Coin Glass Chips */}
      <div
        className="pointer-events-auto absolute left-[12%] top-[36%] hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-amber-500/30 bg-[#12141d]/60 text-amber-400 backdrop-blur-xl shadow-2xl font-bold hover:scale-110 transition-all cursor-pointer animate-bounce duration-[4000ms]"
        title="Bitcoin (BTC)"
      >
        ₿
      </div>
      <div
        className="pointer-events-auto absolute left-[22%] top-[62%] hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-blue-500/30 bg-[#12141d]/60 text-blue-400 backdrop-blur-xl shadow-2xl font-bold hover:scale-110 transition-all cursor-pointer animate-bounce duration-[5000ms]"
        title="Ethereum (ETH)"
      >
        Ξ
      </div>
      <div
        className="pointer-events-auto absolute right-[22%] top-[58%] hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/30 bg-[#12141d]/60 text-emerald-400 backdrop-blur-xl shadow-2xl font-bold hover:scale-110 transition-all cursor-pointer animate-bounce duration-[4500ms]"
        title="Tether (USDT)"
      >
        ₮
      </div>
      <div
        className="pointer-events-auto absolute right-[12%] top-[34%] hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-purple-500/30 bg-[#12141d]/60 text-purple-400 backdrop-blur-xl shadow-2xl font-bold hover:scale-110 transition-all cursor-pointer animate-bounce duration-[5500ms]"
        title="Vaultra Token"
      >
        ⬡
      </div>

      {/* Bottom Mouse Scroll Hint */}
      <footer className="relative z-10 flex w-full flex-col items-center pb-6">
        <div className="flex items-center gap-8 text-[11px] font-mono tracking-widest uppercase text-white/50">
          <span className="text-emerald-400/80">USDT</span>
          <div className="flex h-8 w-5 justify-center rounded-full border border-white/30 p-1">
            <div className="h-1.5 w-1 rounded-full bg-white animate-pulse" />
          </div>
          <span className="text-blue-400/80">ETH</span>
        </div>
      </footer>
    </div>
  );
};
