"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";

interface FhevmContextValue {
  fhevm: FhevmInstance | null;
  isReady: boolean;
  error: string | null;
}

const FhevmContext = createContext<FhevmContextValue>({
  fhevm: null,
  isReady: false,
  error: null,
});

export function useFhevm() {
  return useContext(FhevmContext);
}

interface FhevmProviderProps {
  children: ReactNode;
}

export function FhevmProvider({ children }: FhevmProviderProps) {
  const [fhevm, setFhevm] = useState<FhevmInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Lazy init — only load in browser
    let cancelled = false;
    const init = async () => {
      try {
        setIsInitializing(true);
        const { getFhevmInstance } = await import("@/lib/fhevm");
        const instance = await getFhevmInstance();
        if (!cancelled) {
          setFhevm(instance);
          setIsReady(true);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "FHE init failed";
          setError(msg);
          setIsReady(false);
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  return (
    <FhevmContext.Provider value={{ fhevm, isReady, error }}>
      {children}
    </FhevmContext.Provider>
  );
}

// Overlay shown on the Trade page while FHE is initializing
export function FhevmInitOverlay({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="fhe-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-2 border-transparent border-t-violet-500 border-r-blue-500 mb-6"
          />
          <p className="text-xl font-semibold text-white mb-2">
            Initializing FHE Engine
          </p>
          <p className="text-sm text-zinc-400 font-mono">
            Loading Zama fhEVM cryptographic context...
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
