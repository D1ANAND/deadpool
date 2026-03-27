"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toHex } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { useFhevm, FhevmInitOverlay } from "@/components/FhevmProvider";
import { SETTLEMENT_VAULT_ABI, ENCRYPTED_ORDER_BOOK_ABI } from "@/constants/abis";
import { EVM_ADDRESSES } from "@/constants/addresses";

// ─── Types ──────────────────────────────────────────────────────────────────

type OrderSide = 0 | 1; // 0 = BUY, 1 = SELL

interface PlacedOrder {
  id: string;
  side: "BUY" | "SELL";
  price: string;
  qty: string;
  status: "pending" | "confirmed";
  txHash?: string;
  timestamp: number;
}

// ─── Encrypting Overlay ─────────────────────────────────────────────────────

function EncryptingOverlay({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="enc-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-2 border-transparent border-t-green-400 border-r-blue-500 mb-4"
          />
          <p className="text-sm font-mono text-zinc-300">
            Encrypting zero-knowledge payload locally…
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            No data leaves your browser unencrypted
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Vault Card ──────────────────────────────────────────────────────────────

function VaultCard() {
  const { fhevm, isReady } = useFhevm();
  const { address } = useAccount();
  const [depositAmount, setDepositAmount] = useState("100");
  const [encrypting, setEncrypting] = useState(false);

  const { writeContractAsync: depositWrite, isPending: depositPending } = useWriteContract();
  const [depositTxHash, setDepositTxHash] = useState<`0x${string}` | undefined>();
  const { isSuccess: depositConfirmed } = useWaitForTransactionReceipt({ hash: depositTxHash });

  const handleDeposit = useCallback(async () => {
    if (!fhevm || !isReady) {
      toast.error("FHE engine not ready yet. Please wait.");
      return;
    }
    if (!address) {
      toast.error("Connect your EVM wallet first.");
      return;
    }
    try {
      setEncrypting(true);
      const amountBigInt = BigInt(Math.round(parseFloat(depositAmount) * 1e8));

      // FHE encrypt the amount
      const encrypted = await fhevm.encrypt64(amountBigInt);
      setEncrypting(false);

      // encrypted.handle → bytes32 (externalEuint64)
      // encrypted.inputProof → bytes
      const handleHex = toHex(encrypted.handle) as `0x${string}`;
      const proofHex = toHex(encrypted.inputProof) as `0x${string}`;

      const hash = await depositWrite({
        address: EVM_ADDRESSES.vault,
        abi: SETTLEMENT_VAULT_ABI,
        functionName: "deposit",
        args: [handleHex, proofHex],
      });
      setDepositTxHash(hash);
      toast.info("Deposit TX submitted…", { description: `Tx: ${hash.slice(0, 14)}…` });
    } catch (e) {
      setEncrypting(false);
      const msg = e instanceof Error ? e.message : "Transaction failed";
      toast.error("Deposit failed", { description: msg });
    }
  }, [fhevm, isReady, address, depositAmount, depositWrite]);

  // success toast on confirmation
  if (depositConfirmed && depositTxHash) {
    toast.success("✅ Vault deposit confirmed!", {
      id: depositTxHash,
      description: "Your encrypted balance has been updated.",
    });
  }

  return (
    <div className="relative glass-card rounded-2xl p-6 overflow-hidden">
      <EncryptingOverlay show={encrypting} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Vault Deposit</h2>
          <p className="text-xs text-zinc-500 mt-0.5">FHE-encrypted balance</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xl">
          🏦
        </div>
      </div>

      <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">
        Amount (tokens)
      </label>
      <div className="flex gap-3 items-center mb-4">
        <input
          id="deposit-amount-input"
          type="number"
          min="0"
          className="glow-input flex-1 rounded-xl px-4 py-3 font-mono text-sm"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          placeholder="100"
        />
        <button
          id="deposit-btn"
          onClick={handleDeposit}
          disabled={encrypting || depositPending || !isReady}
          className="px-5 py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_16px_rgba(139,92,246,0.3)] whitespace-nowrap"
        >
          {encrypting ? "Encrypting…" : depositPending ? "Confirming…" : "Deposit"}
        </button>
      </div>

      <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 px-4 py-3 text-xs font-mono text-violet-400/70">
        Amount is FHE-encrypted before leaving your browser. The chain only sees a ciphertext.
      </div>
    </div>
  );
}

// ─── Order Entry Card ────────────────────────────────────────────────────────

function OrderCard({ orders, setOrders }: {
  orders: PlacedOrder[];
  setOrders: React.Dispatch<React.SetStateAction<PlacedOrder[]>>;
}) {
  const { fhevm, isReady } = useFhevm();
  const { address } = useAccount();
  const [side, setSide] = useState<OrderSide>(0);
  const [price, setPrice] = useState("1500");
  const [qty, setQty] = useState("1.0");
  const [encrypting, setEncrypting] = useState(false);

  const { writeContractAsync: placeOrderWrite, isPending } = useWriteContract();

  const handlePlaceOrder = useCallback(async () => {
    if (!fhevm || !isReady) {
      toast.error("FHE engine not ready yet.");
      return;
    }
    if (!address) {
      toast.error("Connect your EVM wallet first.");
      return;
    }
    const priceVal = parseFloat(price);
    const qtyVal = parseFloat(qty);
    if (isNaN(priceVal) || isNaN(qtyVal) || priceVal <= 0 || qtyVal <= 0) {
      toast.error("Enter valid price and quantity.");
      return;
    }
    try {
      setEncrypting(true);
      const priceBigInt = BigInt(Math.round(priceVal * 1e8));
      const qtyBigInt = BigInt(Math.round(qtyVal * 1e8));

      // FHE encrypt both values
      const encPrice = await fhevm.encrypt64(priceBigInt);
      const encSize = await fhevm.encrypt64(qtyBigInt);
      setEncrypting(false);

      const priceHandleHex = toHex(encPrice.handle) as `0x${string}`;
      const priceProfHex = toHex(encPrice.inputProof) as `0x${string}`;
      const sizeHandleHex = toHex(encSize.handle) as `0x${string}`;
      const sizeProfHex = toHex(encSize.inputProof) as `0x${string}`;

      const hash = await placeOrderWrite({
        address: EVM_ADDRESSES.orderBook,
        abi: ENCRYPTED_ORDER_BOOK_ABI,
        functionName: "placeOrder",
        args: [priceHandleHex, sizeHandleHex, side, priceProfHex, sizeProfHex],
      });

      const newOrder: PlacedOrder = {
        id: hash.slice(0, 10),
        side: side === 0 ? "BUY" : "SELL",
        price,
        qty,
        status: "pending",
        txHash: hash,
        timestamp: Date.now(),
      };
      setOrders((prev) => [newOrder, ...prev]);

      toast.info(`Encrypted ${side === 0 ? "BUY" : "SELL"} order submitted`, {
        description: `Tx: ${hash.slice(0, 14)}…`,
      });
    } catch (e) {
      setEncrypting(false);
      const msg = e instanceof Error ? e.message : "Transaction failed";
      toast.error("Order failed", { description: msg });
    }
  }, [fhevm, isReady, address, price, qty, side, placeOrderWrite, setOrders]);

  return (
    <div className="relative glass-card rounded-2xl p-6 overflow-hidden">
      <EncryptingOverlay show={encrypting} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Encrypted Limit Order</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Price &amp; size are FHE-encrypted on-chain</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
          🔐
        </div>
      </div>

      {/* Buy / Sell toggle */}
      <div className="flex rounded-xl bg-zinc-900/60 border border-white/[0.05] p-1 mb-6">
        <button
          id="side-buy-btn"
          onClick={() => setSide(0)}
          className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
            side === 0
              ? "bg-green-600/90 text-white shadow-[0_0_16px_rgba(34,197,94,0.3)]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Buy
        </button>
        <button
          id="side-sell-btn"
          onClick={() => setSide(1)}
          className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
            side === 1
              ? "bg-red-600/90 text-white shadow-[0_0_16px_rgba(239,68,68,0.3)]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">
            Price (USDC)
          </label>
          <input
            id="price-input"
            type="number"
            min="0"
            className="glow-input w-full rounded-xl px-4 py-3 font-mono text-sm"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">
            Quantity
          </label>
          <input
            id="qty-input"
            type="number"
            min="0"
            className="glow-input w-full rounded-xl px-4 py-3 font-mono text-sm"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
      </div>

      {/* Total estimate */}
      <div className="rounded-xl bg-zinc-900/40 border border-white/[0.04] px-4 py-3 mb-5 flex justify-between text-sm">
        <span className="text-zinc-500">Est. Total</span>
        <span className="font-mono text-white font-medium">
          {(parseFloat(price || "0") * parseFloat(qty || "0")).toLocaleString()} USDC
        </span>
      </div>

      <button
        id="place-order-btn"
        onClick={handlePlaceOrder}
        disabled={encrypting || isPending || !isReady}
        className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
          side === 0
            ? "bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            : "bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
        }`}
      >
        {encrypting
          ? "🔐 Encrypting payload…"
          : isPending
          ? "Confirming…"
          : `Place Encrypted ${side === 0 ? "Buy" : "Sell"} Order`}
      </button>
    </div>
  );
}

// ─── Order History ───────────────────────────────────────────────────────────

function OrderHistory({ orders }: { orders: PlacedOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <p className="text-zinc-600 text-sm font-mono">No orders placed yet.</p>
        <p className="text-zinc-700 text-xs mt-1">Your encrypted orders will appear here.</p>
      </div>
    );
  }
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-sm font-bold text-zinc-300 mb-4 flex items-center gap-2">
        <span>Order History</span>
        <span className="text-xs text-zinc-600 font-normal font-mono">
          (encrypted on-chain)
        </span>
      </h3>
      <div className="space-y-2">
        {orders.map((o, i) => (
          <motion.div
            key={o.txHash ?? i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-900/40 border border-white/[0.04] text-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  o.side === "BUY"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {o.side}
              </span>
              <span className="font-mono text-xs text-zinc-400">
                {o.qty} @ {o.price}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-600 font-mono">
                {new Date(o.timestamp).toLocaleTimeString()}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                o.status === "confirmed"
                  ? "bg-green-500/10 text-green-400"
                  : "bg-yellow-500/10 text-yellow-400"
              }`}>
                {o.status === "confirmed" ? "✓ Filled" : "Pending"}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TradePage() {
  const { isConnected } = useAccount();
  const { isReady: fhevmReady, error: fhevmError } = useFhevm();
  const [orders, setOrders] = useState<PlacedOrder[]>([]);

  return (
    <div className="min-h-screen relative z-10 px-6 py-10">
      {/* FHE init overlay */}
      <FhevmInitOverlay show={isConnected && !fhevmReady && !fhevmError} />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors font-mono mb-4 inline-block">
            ← Back to home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                Dark Pool Terminal
                <span className={`text-xs font-mono px-2 py-1 rounded-full border ${
                  fhevmReady
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                }`}>
                  {fhevmReady ? "● FHE Ready" : "● FHE Init…"}
                </span>
              </h1>
              <p className="text-zinc-500 text-sm">
                All orders are encrypted on-chain via Zama fhEVM
              </p>
            </div>
          </div>
        </motion.div>

        {/* Not connected guard */}
        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto"
          >
            <div className="text-4xl mb-4">🔌</div>
            <h2 className="text-xl font-bold text-white mb-2">
              EVM Wallet Required
            </h2>
            <p className="text-zinc-500 text-sm mb-6">
              Connect your MetaMask or any EVM wallet via the header to access the dark pool.
            </p>
            <Link
              href="/prove"
              className="text-violet-400 text-sm hover:text-violet-300 font-mono underline underline-offset-4"
            >
              Haven't proved BTC yet? Start here →
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Main two-column layout */}
            <div className="grid lg:grid-cols-2 gap-6">
              <VaultCard />
              <OrderCard orders={orders} setOrders={setOrders} />
            </div>

            {/* FHE error */}
            {fhevmError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300 font-mono">
                FHE Error: {fhevmError}
              </div>
            )}

            {/* Order history */}
            <OrderHistory orders={orders} />

            {/* Info strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-4 text-center"
            >
              {[
                { icon: "🔐", label: "Homomorphic Encryption", sub: "Orders never decrypt on-chain" },
                { icon: "🌉", label: "ZK BTC Collateral", sub: "Cross-chain Starknet proof" },
                { icon: "⚡", label: "MEV Protected", sub: "Dark pool order matching" },
              ].map(({ icon, label, sub }) => (
                <div
                  key={label}
                  className="glass-card rounded-xl p-4 text-center border border-white/[0.04]"
                >
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className="text-xs font-semibold text-zinc-300">{label}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
