"use client";

import { useConnect, useDisconnect, useAccount } from "@starknet-react/core";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function StarknetConnectButton() {
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const [showMenu, setShowMenu] = useState(false);

  if (isConnected && address) {
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
    return (
      <div className="relative">
        <button
          id="starknet-wallet-btn"
          onClick={() => setShowMenu((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 transition-all duration-200 text-sm font-mono text-orange-300"
        >
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          {short}
        </button>
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl z-50 p-2"
            >
              <p className="text-xs text-zinc-500 px-2 py-1">Starknet Sepolia</p>
              <button
                onClick={() => { disconnect(); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Disconnect
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        id="starknet-connect-btn"
        onClick={() => setShowMenu((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/15 hover:border-orange-500/60 transition-all duration-200 text-sm font-medium text-orange-400"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Connect Starknet
      </button>
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl z-50 p-2 space-y-1"
          >
            <p className="text-xs text-zinc-500 px-2 py-1">Select wallet</p>
            {connectors.map((connector) => (
              <button
                key={connector.id}
                id={`connect-${connector.id}`}
                onClick={() => {
                  connect({ connector });
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-200 hover:bg-white/5 transition-colors"
              >
                <span className="w-6 h-6 rounded-md bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
                  {connector.name.charAt(0)}
                </span>
                {connector.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
