import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PowerOff, ShieldCheck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorage, clearAll } from '@/lib/storage';
import { useDisconnect as useEvmDisconnect } from 'wagmi';
import { useDisconnect as useStarknetDisconnect } from '@starknet-react/core';

const Header = () => {
  const navigate = useNavigate();
  const { disconnect: evmDisconnect } = useEvmDisconnect();
  const { disconnect: starkDisconnect } = useStarknetDisconnect();
  const [storage, setStorage] = useState(getStorage());
  const [flash, setFlash] = useState(false);

  // Poll storage for changes
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getStorage();
      if (current.vaultBalance !== storage.vaultBalance || current.walletBalance !== storage.walletBalance) {
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
      }
      setStorage(current);
    }, 500);
    return () => clearInterval(interval);
  }, [storage.vaultBalance, storage.walletBalance]);

  const handleDisconnect = useCallback(() => {
    try { evmDisconnect(); } catch {}
    try { starkDisconnect(); } catch {}
    clearAll();
    navigate('/');
  }, [evmDisconnect, starkDisconnect, navigate]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tighter">
          <span className="text-primary text-glow">dead</span>
          <span className="text-foreground">pool</span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">ZK Collateral:</span>
            <span className={storage.isVerified ? 'text-green-500' : 'text-primary'}>
              {storage.isVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">fhEVM:</span>
            <span className="text-foreground">Encrypted</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Vault:</span>
            <span className={`text-foreground font-semibold ${flash ? 'flash-crimson' : ''}`}>
              ${storage.vaultBalance.toLocaleString()}
            </span>
          </div>
          <button onClick={handleDisconnect} className="btn-outline-danger flex items-center gap-1.5 text-xs py-1.5 px-3 ml-2">
            <PowerOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
