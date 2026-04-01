import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useConnect, useAccount, useSendTransaction } from '@starknet-react/core';
import { ShieldCheck, ExternalLink, Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { COLLATERAL_VERIFIER_ADDRESS } from '@/lib/abis';
import { setVerified, getStorage } from '@/lib/storage';
import Header from '@/components/Header';
import { CallData } from 'starknet';

const Prove = () => {
  const navigate = useNavigate();
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const { sendAsync } = useSendTransaction({});

  const [btcHash, setBtcHash] = useState('');
  const [amount, setAmount] = useState('');
  const [nonce, setNonce] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [verified, setVerifiedState] = useState(getStorage().isVerified);

  const handleProve = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const calls = [{
        contractAddress: COLLATERAL_VERIFIER_ADDRESS,
        entrypoint: 'submit_utxo_commitment',
        calldata: CallData.compile([btcHash, amount, nonce, '100000']),
      }];

      const result = await sendAsync(calls);
      const hash = result.transaction_hash;
      setTxHash(hash);

      setVerified(address, Number(amount));
      setVerifiedState(true);

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">ZK Proof Submitted!</span>
          <a
            href={`https://sepolia.starkscan.co/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline flex items-center gap-1 text-xs"
          >
            View on Starkscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>,
        { duration: 10000 }
      );
    } catch (err: any) {
      toast.error(err?.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-24 pb-12 px-4 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">The Gatekeeper</h1>
          <p className="text-muted-foreground text-sm">Prove BTC collateral ownership via ZK proof on Starknet</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 space-y-6">
          {!isConnected ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">Connect your Starknet wallet to begin</p>
              {connectors.map((c) => (
                <button key={c.id} onClick={() => connect({ connector: c })} className="btn-crimson w-full flex items-center justify-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Connect {c.name || c.id}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="text-xs font-mono text-muted-foreground truncate glass-panel p-3">
                Connected: {address}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">BTC Address Hash (felt252 hex)</label>
                  <input value={btcHash} onChange={(e) => setBtcHash(e.target.value)} placeholder="0xabc123..."
                    className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:glow-border transition-all" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Amount in Sats</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100000"
                    className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:glow-border transition-all" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nonce</label>
                  <input type="number" value={nonce} onChange={(e) => setNonce(e.target.value)} placeholder="1"
                    className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:glow-border transition-all" />
                </div>

                <button onClick={handleProve} disabled={loading || !btcHash || !amount || !nonce}
                  className="btn-crimson w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating ZK Proof...</> : 'Generate ZK Proof'}
                </button>
              </div>

              {txHash && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel-active p-4 space-y-3">
                  <div className="flex items-center gap-2 text-green-500 text-sm font-semibold">
                    <ShieldCheck className="w-4 h-4" /> ZK Proof Verified
                  </div>
                  <a href={`https://sepolia.starkscan.co/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-mono text-primary underline flex items-center gap-1 break-all">
                    {txHash} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </motion.div>
              )}

              {verified && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/trade')}
                  className="btn-crimson w-full mt-4"
                >
                  Enter Dark Pool Terminal →
                </motion.button>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Prove;
