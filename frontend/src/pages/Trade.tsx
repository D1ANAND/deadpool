import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Loader2, ExternalLink, TrendingUp, TrendingDown, Vault, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { getStorage, updateBalances } from '@/lib/storage';
import { SETTLEMENT_VAULT_ABI, SETTLEMENT_VAULT_ADDRESS, ENCRYPTED_ORDER_BOOK_ABI, ENCRYPTED_ORDER_BOOK_ADDRESS } from '@/lib/abis';
import Header from '@/components/Header';

const ASSETS = [
  { name: 'SpaceX', ticker: 'SPACEX', price: 185.00 },
  { name: 'OpenAI', ticker: 'OPENAI', price: 157.50 },
  { name: 'Stripe', ticker: 'STRIPE', price: 72.25 },
];

const DUMMY_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
const DUMMY_PROOF = '0x00' as `0x${string}`;

const MOCK_ORDERS = [
  { price: '••••', size: '••••', side: 'buy' },
  { price: '••••', size: '••••', side: 'buy' },
  { price: '••••', size: '••••', side: 'sell' },
  { price: '••••', size: '••••', side: 'sell' },
  { price: '••••', size: '••••', side: 'buy' },
];

const Trade = () => {
  const navigate = useNavigate();
  const { isConnected, address: evmAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [storage, setStorage] = useState(getStorage());
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [depositAmount, setDepositAmount] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderSize, setOrderSize] = useState('');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [depositing, setDepositing] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [encryptingDeposit, setEncryptingDeposit] = useState(false);
  const [encryptingOrder, setEncryptingOrder] = useState(false);

  useEffect(() => {
    if (!getStorage().isVerified) navigate('/prove');
  }, [navigate]);

  const refreshStorage = () => setStorage(getStorage());

  const estimatedValue = (Number(orderPrice) || 0) * (Number(orderSize) || 0);

  const handleDeposit = async () => {
    const amt = Number(depositAmount);
    if (amt <= 0 || amt > storage.walletBalance) return;

    setEncryptingDeposit(true);
    await new Promise(r => setTimeout(r, 1500));
    setEncryptingDeposit(false);
    setDepositing(true);

    try {
      const hash = await writeContractAsync({
        address: SETTLEMENT_VAULT_ADDRESS,
        abi: SETTLEMENT_VAULT_ABI,
        functionName: 'deposit',
        args: [DUMMY_BYTES32, DUMMY_PROOF],
        chain: sepolia,
        account: evmAddress,
      });

      updateBalances(storage.walletBalance - amt, storage.vaultBalance + amt);
      refreshStorage();
      setDepositAmount('');

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Deposit Submitted!</span>
          <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer"
            className="text-primary underline flex items-center gap-1 text-xs">
            View on Etherscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>,
        { duration: 10000 }
      );
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || 'Deposit failed');
    } finally {
      setDepositing(false);
    }
  };

  const handleOrder = async () => {
    if (estimatedValue <= 0 || estimatedValue > storage.vaultBalance) return;

    setEncryptingOrder(true);
    await new Promise(r => setTimeout(r, 1500));
    setEncryptingOrder(false);
    setOrdering(true);

    try {
      const hash = await writeContractAsync({
        address: ENCRYPTED_ORDER_BOOK_ADDRESS,
        abi: ENCRYPTED_ORDER_BOOK_ABI,
        functionName: 'placeOrder',
        args: [DUMMY_BYTES32, DUMMY_BYTES32, orderSide === 'buy' ? 0 : 1, DUMMY_PROOF, DUMMY_PROOF],
        chain: sepolia,
        account: evmAddress,
      });

      updateBalances(storage.walletBalance, storage.vaultBalance - estimatedValue);
      refreshStorage();
      setOrderPrice('');
      setOrderSize('');

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Order Placed!</span>
          <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer"
            className="text-primary underline flex items-center gap-1 text-xs">
            View on Etherscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>,
        { duration: 10000 }
      );
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || 'Order failed');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-20 pb-12 px-4 max-w-7xl mx-auto">
        {/* EVM Connect */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dark Pool Terminal</h1>
          <ConnectButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Vault & Assets */}
          <div className="space-y-6">
            {/* Assets List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Pre-IPO Synthetic Assets
              </h2>
              <div className="space-y-2">
                {ASSETS.map((a) => (
                  <button key={a.ticker} onClick={() => setSelectedAsset(a)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${
                      selectedAsset.ticker === a.ticker ? 'glass-panel-active' : 'hover:bg-secondary/30'
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{a.ticker}</span>
                      <span className="text-muted-foreground text-xs">{a.name}</span>
                    </div>
                    <span className="font-mono">${a.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Settlement Vault */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <Vault className="w-4 h-4 text-primary" /> Settlement Vault
              </h2>
              <div className="text-xs font-mono text-muted-foreground mb-3">
                Wallet Balance: <span className="text-foreground">${storage.walletBalance.toLocaleString()}</span>
              </div>
              <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="USD Amount"
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm font-mono mb-3 focus:outline-none focus:glow-border transition-all" />

              {encryptingDeposit && (
                <div className="flex items-center gap-2 text-xs text-primary mb-3 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Encrypting payload via Zama fhEVM...
                </div>
              )}

              <button onClick={handleDeposit}
                disabled={!isConnected || depositing || encryptingDeposit || Number(depositAmount) <= 0 || Number(depositAmount) > storage.walletBalance}
                className="btn-crimson w-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                {depositing ? <><Loader2 className="w-4 h-4 animate-spin" /> Depositing...</> : 'Deposit to Vault'}
              </button>
              {!isConnected && <p className="text-xs text-muted-foreground mt-2 text-center">Connect EVM wallet to deposit</p>}
            </motion.div>
          </div>

          {/* RIGHT: Order Entry & Orderbook */}
          <div className="space-y-6">
            {/* Order Entry */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel p-5">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4">
                Order: <span className="text-foreground">{selectedAsset.ticker}</span>
              </h2>

              <div className="text-xs font-mono text-muted-foreground mb-3">
                Vault Balance (Trading Power): <span className="text-foreground">${storage.vaultBalance.toLocaleString()}</span>
              </div>

              {/* Buy/Sell Toggle */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setOrderSide('buy')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    orderSide === 'buy' ? 'bg-green-600 text-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}>
                  <TrendingUp className="w-4 h-4" /> Buy
                </button>
                <button onClick={() => setOrderSide('sell')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    orderSide === 'sell' ? 'bg-primary text-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}>
                  <TrendingDown className="w-4 h-4" /> Sell
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <input type="number" value={orderPrice} onChange={(e) => setOrderPrice(e.target.value)} placeholder="Price (USD)"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:glow-border transition-all" />
                <input type="number" value={orderSize} onChange={(e) => setOrderSize(e.target.value)} placeholder="Amount (units)"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:glow-border transition-all" />
              </div>

              <div className="text-xs font-mono text-muted-foreground mb-4">
                Est. Order Value: <span className={`font-semibold ${estimatedValue > storage.vaultBalance ? 'text-primary' : 'text-foreground'}`}>
                  ${estimatedValue.toLocaleString()}
                </span>
                {estimatedValue > storage.vaultBalance && <span className="text-primary ml-2">Insufficient vault balance</span>}
              </div>

              {encryptingOrder && (
                <div className="flex items-center gap-2 text-xs text-primary mb-3 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Encrypting order via Zama fhEVM...
                </div>
              )}

              <button onClick={handleOrder}
                disabled={!isConnected || ordering || encryptingOrder || estimatedValue <= 0 || estimatedValue > storage.vaultBalance}
                className="btn-crimson w-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                {ordering ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</> :
                  `Place ${orderSide === 'buy' ? 'Buy' : 'Sell'} Order`}
              </button>
            </motion.div>

            {/* Encrypted Orderbook */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-5">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4">Encrypted Orderbook</h2>
              <div className="space-y-1 font-mono text-xs">
                <div className="grid grid-cols-3 text-muted-foreground mb-2 px-2">
                  <span>Side</span><span className="text-center">Price</span><span className="text-right">Size</span>
                </div>
                {MOCK_ORDERS.map((o, i) => (
                  <div key={i} className={`grid grid-cols-3 px-2 py-1.5 rounded ${
                    o.side === 'buy' ? 'bg-green-500/5' : 'bg-primary/5'
                  }`}>
                    <span className={o.side === 'buy' ? 'text-green-500' : 'text-primary'}>{o.side.toUpperCase()}</span>
                    <span className="text-center text-muted-foreground">{o.price}</span>
                    <span className="text-right text-muted-foreground">{o.size}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-3 text-center">All values encrypted via fhEVM — masked for privacy</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trade;
