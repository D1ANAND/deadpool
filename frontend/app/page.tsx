"use client";

import { useAccount as useEvmAccount } from "wagmi";
import { useAccount as useStarknetAccount } from "@starknet-react/core";
import { motion } from "framer-motion";
import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const FLOW_STEPS = [
  {
    step: "01",
    title: "Prove BTC Ownership",
    desc: "Submit your BTC UTXO commitment to Starknet's CollateralVerifier. A ZK-compatible Pedersen proof is generated on-chain.",
    icon: "⚡",
    color: "from-orange-500/20 to-orange-500/5",
    border: "border-orange-500/20",
    label: "Starknet",
    labelColor: "text-orange-400 bg-orange-500/10",
  },
  {
    step: "02",
    title: "Relayer Bridges Proof",
    desc: "A trustless relayer listens for ProofVerified events and registers your proof hash on Ethereum's CollateralRegistry.",
    icon: "🌉",
    color: "from-violet-500/20 to-violet-500/5",
    border: "border-violet-500/20",
    label: "Cross-Chain",
    labelColor: "text-violet-400 bg-violet-500/10",
  },
  {
    step: "03",
    title: "Trade in the Dark Pool",
    desc: "Deposit funds and place fully encrypted limit orders using Zama's fhEVM. No one sees your price or size — not even the chain.",
    icon: "🔐",
    color: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/20",
    label: "fhEVM",
    labelColor: "text-blue-400 bg-blue-500/10",
  },
];

const STATS = [
  { value: "100%", label: "Order Privacy" },
  { value: "ZK", label: "BTC Collateral" },
  { value: "E2E", label: "Encrypted" },
  { value: "0", label: "MEV Exposure" },
];

export default function HomePage() {
  const { isConnected: evmConnected } = useEvmAccount();
  const { isConnected: starknetConnected } = useStarknetAccount();

  const bothConnected = evmConnected && starknetConnected;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-mono mb-8 backdrop-blur-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Live on Starknet Sepolia × Ethereum Sepolia
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-6"
        >
          <span className="gradient-text">Dead</span>
          <span className="text-white">Pool</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-400 max-w-xl mb-4"
        >
          The first confidential dark pool where{" "}
          <span className="text-white font-medium">BTC collateral</span> is
          proven via Starknet ZK and orders are encrypted using{" "}
          <span className="text-white font-medium">Zama fhEVM</span>.
        </motion.p>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-wrap justify-center gap-6 mb-12 mt-4"
        >
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold gradient-text">{value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          {/* Prove BTC */}
          {starknetConnected ? (
            <Link
              id="cta-prove"
              href="/prove"
              className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-[0_0_24px_rgba(249,115,22,0.35)] hover:shadow-[0_0_36px_rgba(249,115,22,0.5)] transition-all duration-200"
            >
              ⚡ Prove BTC Collateral
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          ) : (
            <button
              id="cta-prove-disabled"
              disabled
              title="Connect Starknet wallet first"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-zinc-500 bg-zinc-900 border border-zinc-800 cursor-not-allowed"
            >
              ⚡ Prove BTC Collateral
              <span className="text-xs text-zinc-600">(Connect Starknet)</span>
            </button>
          )}

          {/* Trade */}
          {evmConnected ? (
            <Link
              id="cta-trade"
              href="/trade"
              className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-[0_0_24px_rgba(99,102,241,0.35)] hover:shadow-[0_0_36px_rgba(99,102,241,0.5)] transition-all duration-200"
            >
              🔐 Enter Dark Pool
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          ) : (
            <button
              id="cta-trade-disabled"
              disabled
              title="Connect EVM wallet first"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-zinc-500 bg-zinc-900 border border-zinc-800 cursor-not-allowed"
            >
              🔐 Enter Dark Pool
              <span className="text-xs text-zinc-600">(Connect EVM)</span>
            </button>
          )}
        </motion.div>

        {/* Connection status nudge */}
        {!bothConnected && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-5 text-xs text-zinc-600 font-mono"
          >
            {!starknetConnected && !evmConnected
              ? "↑ Connect both wallets using the header to get started"
              : !starknetConnected
              ? "↑ Connect your Starknet wallet to prove BTC"
              : "↑ Connect your EVM wallet to start trading"}
          </motion.p>
        )}
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 pb-28 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-[0.3em] mb-3">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Three steps to true{" "}
            <span className="gradient-text">financial privacy</span>
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-5"
        >
          {FLOW_STEPS.map(({ step, title, desc, icon, color, border, label, labelColor }) => (
            <motion.div
              key={step}
              variants={item}
              className={`relative rounded-2xl border ${border} bg-gradient-to-b ${color} p-6 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{icon}</span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${labelColor}`}>
                  {label}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-600 mb-1">{step}</p>
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
