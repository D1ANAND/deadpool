"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useSendTransaction, useTransactionReceipt } from "@starknet-react/core";
import { useReadContract } from "wagmi";
import { type Hash } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { COLLATERAL_VERIFIER_ABI } from "@/constants/starknetAbi";
import { COLLATERAL_REGISTRY_ABI } from "@/constants/abis";
import { EVM_ADDRESSES, STARKNET_ADDRESSES } from "@/constants/addresses";
import { encode, num } from "starknet";

// ─── Types ──────────────────────────────────────────────────────────────────

type ProveStatus =
  | "idle"
  | "starknet_tx"
  | "starknet_pending"
  | "waiting_relayer"
  | "verified";

// ─── Step Indicator ────────────────────────────────────────────────────────

const STEPS = ["BTC Details", "ZK Proof", "Bridge", "Verified"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                  done
                    ? "bg-violet-600 border-violet-600 text-white"
                    : active
                    ? "border-violet-500 text-violet-400 bg-violet-500/10"
                    : "border-zinc-800 text-zinc-600"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`text-[10px] font-mono hidden sm:block whitespace-nowrap ${
                  active ? "text-violet-400" : done ? "text-zinc-400" : "text-zinc-700"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 mb-5 transition-all duration-500 ${
                  done ? "bg-violet-600" : "bg-zinc-800"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Pulsing Orbit Loader ───────────────────────────────────────────────────

function OrbitLoader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
        <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 spin-ring" />
        <div className="absolute inset-2 rounded-full border-t-2 border-blue-400/60 spin-ring" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
      </div>
      <p className="text-sm text-zinc-400 font-mono animate-pulse">{label}</p>
    </div>
  );
}

// ─── Bridging Animation ─────────────────────────────────────────────────────

function BridgingAnimation() {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="flex items-center gap-6">
        {/* Starknet side */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-14 h-14 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-2xl"
        >
          ⚡
        </motion.div>
        {/* Arrow */}
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-0.5 bg-violet-400 rounded-full"
            />
          ))}
        </div>
        {/* Ethereum side */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl"
        >
          🔷
        </motion.div>
      </div>
      <p className="text-sm text-zinc-400 text-center">
        Relayer bridging proof from Starknet → Ethereum…
      </p>
      <p className="text-xs text-zinc-600 font-mono">
        Polling CollateralRegistry every 5s
      </p>
    </div>
  );
}

// ─── Success Card ───────────────────────────────────────────────────────────

function SuccessCard({ proofHash }: { proofHash: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(proofHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="text-center space-y-6 py-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/40 flex items-center justify-center text-4xl mx-auto glow-green"
      >
        ✓
      </motion.div>
      <div>
        <h3 className="text-xl font-bold gradient-text-green mb-1">
          BTC Collateral Verified
        </h3>
        <p className="text-sm text-zinc-400">
          Your proof is registered on-chain. You can now trade.
        </p>
      </div>
      <div className="text-left glass-card rounded-xl p-4">
        <p className="text-xs text-zinc-500 mb-2 font-mono">PROOF HASH</p>
        <div className="flex items-start gap-3">
          <p className="font-mono text-green-400 text-xs break-all flex-1 leading-5">
            {proofHash}
          </p>
          <button
            onClick={copy}
            className="shrink-0 text-xs text-zinc-500 hover:text-white transition-colors px-2 py-1 rounded-md border border-zinc-800 hover:border-zinc-600"
          >
            {copied ? "✓" : "Copy"}
          </button>
        </div>
      </div>
      <Link
        href="/trade"
        id="prove-to-trade-btn"
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-[0_0_24px_rgba(99,102,241,0.35)] hover:shadow-[0_0_36px_rgba(99,102,241,0.5)] transition-all duration-200"
      >
        Enter Dark Pool →
      </Link>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProvePage() {
  const { address: starknetAddress, isConnected } = useAccount();

  const [btcHash, setBtcHash] = useState("0xbtcaddress123456789");
  const [amount, setAmount] = useState("100000");
  const [nonce, setNonce] = useState("1");
  const [status, setStatus] = useState<ProveStatus>("idle");
  const [proofHash, setProofHash] = useState<`0x${string}` | "">("");
  const [starknetTxHash, setStarknetTxHash] = useState<string>("");

  // ── Starknet send tx ────────────────────────────────────────────────────
  const { sendAsync } = useSendTransaction({
    calls: undefined,
  });

  // ── Starknet tx receipt (to parse events) ───────────────────────────────
  const { data: txReceipt } = useTransactionReceipt({
    hash: starknetTxHash as `0x${string}`,
    watch: true,
  });

  // Parse ProofVerified event from receipt
  useEffect(() => {
    if (!txReceipt || status !== "starknet_pending") return;
    // starknet-react receipt events
    const receipt = txReceipt as unknown as {
      events?: Array<{ keys: string[]; data: string[] }>;
    };
    if (!receipt.events) return;

    for (const ev of receipt.events) {
      // ProofVerified event selector (keys[0] is event selector)
      // keys[1] = prover, data[0] or keys[2] = proof_hash, data[1] = timestamp
      if (ev.data && ev.data.length >= 1) {
        // The proof_hash is emitted in data[0] for this event structure
        const rawHash = ev.data[0];
        if (rawHash && rawHash !== "0x0") {
          const hex = num.toHex(rawHash) as `0x${string}`;
          setProofHash(hex);
          setStatus("waiting_relayer");
          toast.success("Starknet proof generated!", {
            description: `Hash: ${hex.slice(0, 14)}…`,
          });
          return;
        }
      }
    }
  }, [txReceipt, status]);

  // ── EVM polling: validProofHashes ───────────────────────────────────────
  const proofHashBytes32 = proofHash
    ? (proofHash.padEnd(66, "0") as `0x${string}`)
    : undefined;

  const { data: isProofValid } = useReadContract({
    address: EVM_ADDRESSES.collateralRegistry,
    abi: COLLATERAL_REGISTRY_ABI,
    functionName: "validProofHashes",
    args: proofHashBytes32 ? [proofHashBytes32] : undefined,
    query: {
      enabled: status === "waiting_relayer" && !!proofHashBytes32,
      refetchInterval: 5000,
    },
  });

  useEffect(() => {
    if (isProofValid === true && status === "waiting_relayer") {
      setStatus("verified");
      toast.success("✅ Proof bridged to Ethereum!", {
        description: "Your BTC collateral is now verified on-chain.",
      });
    }
  }, [isProofValid, status]);

  // ── Submit to Starknet ───────────────────────────────────────────────────
  const handleGenerateProof = useCallback(async () => {
    if (!isConnected) {
      toast.error("Connect your Starknet wallet first.");
      return;
    }
    setStatus("starknet_tx");
    try {
      const toFelt = (v: string) => encode.addHexPrefix(BigInt(v).toString(16));
      const result = await sendAsync([
        {
          contractAddress: STARKNET_ADDRESSES.collateralVerifier,
          entrypoint: "submit_utxo_commitment",
          calldata: [
            toFelt(btcHash.startsWith("0x") ? BigInt(btcHash).toString() : btcHash),
            toFelt(amount),
            toFelt(nonce),
            toFelt("100000"), // minimum_threshold hardcoded
          ],
        },
      ]);
      setStarknetTxHash(result.transaction_hash);
      setStatus("starknet_pending");
      toast.info("Starknet tx submitted — waiting for confirmation…", {
        description: `Tx: ${result.transaction_hash.slice(0, 14)}…`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      toast.error("Starknet TX failed", { description: msg });
      setStatus("idle");
    }
  }, [isConnected, btcHash, amount, nonce, sendAsync]);

  const stepIndex =
    status === "idle" ? 0
    : status === "starknet_tx" || status === "starknet_pending" ? 1
    : status === "waiting_relayer" ? 2
    : 3;

  return (
    <div className="min-h-screen relative z-10 px-6 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors font-mono mb-4 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold text-white mb-1">
            Prove BTC Collateral
          </h1>
          <p className="text-zinc-500 text-sm">
            Generate a ZK commitment on Starknet. The relayer bridges it to Ethereum.
          </p>
        </motion.div>

        {/* Step indicator */}
        <StepIndicator current={stepIndex} />

        {/* Main card */}
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="glass-card rounded-2xl p-8"
        >
          <AnimatePresence mode="wait">
            {/* STEP 0 — Form */}
            {status === "idle" && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">
                    BTC Address Hash (felt252 / hex)
                  </label>
                  <input
                    id="btc-hash-input"
                    className="glow-input w-full rounded-xl px-4 py-3 font-mono text-sm"
                    value={btcHash}
                    onChange={(e) => setBtcHash(e.target.value)}
                    placeholder="0xbtcaddress..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">
                      Amount (satoshis)
                    </label>
                    <input
                      id="amount-input"
                      type="number"
                      className="glow-input w-full rounded-xl px-4 py-3 font-mono text-sm"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">
                      Nonce
                    </label>
                    <input
                      id="nonce-input"
                      type="number"
                      className="glow-input w-full rounded-xl px-4 py-3 font-mono text-sm"
                      value={nonce}
                      onChange={(e) => setNonce(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-xs text-orange-300/70 font-mono">
                  Min threshold: 100,000 sats (0.001 BTC) · Proof = Pedersen(hash, amount, nonce)
                </div>

                <button
                  id="generate-proof-btn"
                  onClick={handleGenerateProof}
                  disabled={!isConnected}
                  className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-[0_0_24px_rgba(249,115,22,0.3)] hover:shadow-[0_0_36px_rgba(249,115,22,0.5)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isConnected
                    ? "⚡ Generate Proof on Starknet"
                    : "Connect Starknet Wallet First"}
                </button>
              </motion.div>
            )}

            {/* STEP 1 — Starknet TX in flight */}
            {(status === "starknet_tx" || status === "starknet_pending") && (
              <motion.div key="starknet-pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <OrbitLoader
                  label={
                    status === "starknet_tx"
                      ? "Awaiting wallet confirmation…"
                      : "Confirming on Starknet…"
                  }
                />
                {starknetTxHash && (
                  <p className="text-center text-xs text-zinc-600 font-mono mt-2">
                    Tx: {starknetTxHash.slice(0, 20)}…
                  </p>
                )}
              </motion.div>
            )}

            {/* STEP 2 — Waiting for relayer bridge */}
            {status === "waiting_relayer" && (
              <motion.div key="relayer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BridgingAnimation />
                {proofHash && (
                  <div className="mt-6 glass-card rounded-xl p-4">
                    <p className="text-xs text-zinc-500 mb-1 font-mono">STARKNET PROOF HASH</p>
                    <p className="font-mono text-violet-400 text-xs break-all">{proofHash}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3 — Verified */}
            {status === "verified" && (
              <motion.div key="verified" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SuccessCard proofHash={proofHash} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
