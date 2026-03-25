"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import StarknetConnectButton from "./StarknetConnectButton";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/prove", label: "Prove BTC" },
  { href: "/trade", label: "Trade" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-40 h-16"
    >
      {/* Glassmorphism bar */}
      <div className="h-full mx-4 mt-3 rounded-2xl border border-white/[0.06] bg-black/60 backdrop-blur-xl shadow-[0_0_40px_rgba(99,102,241,0.08)] flex items-center px-6 gap-6">
        {/* Logo */}
        <Link href="/" id="header-logo" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-[0_0_16px_rgba(139,92,246,0.6)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span className="font-bold text-base bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
            DeadPool
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                id={`nav-${label.toLowerCase().replace(" ", "-")}`}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "text-white"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-white/[0.07] border border-white/10"
                  />
                )}
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Wallet Connections */}
        <div className="flex items-center gap-3">
          {/* Starknet */}
          <div className="flex items-center gap-2">
            <span className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500/60" />
              SN
            </span>
            <StarknetConnectButton />
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />

          {/* EVM */}
          <div className="flex items-center gap-2">
            <span className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
              EVM
            </span>
            <ConnectButton
              accountStatus="address"
              chainStatus="none"
              showBalance={false}
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
