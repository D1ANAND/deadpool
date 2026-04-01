import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Skull, ArrowRight, ShieldCheck, Lock, Eye } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(hsl(var(--crimson) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--crimson) / 0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
      
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, hsl(var(--crimson) / 0.4), transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center max-w-3xl"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 glass-panel px-4 py-2 mb-8 text-xs font-mono text-muted-foreground"
        >
          <Skull className="w-4 h-4 text-primary" />
          CONFIDENTIAL DARK POOL PROTOCOL
        </motion.div>

        <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-6">
          <span className="text-primary text-glow">dead</span>
          <span className="text-foreground">pool</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground font-light max-w-xl mx-auto mb-4 leading-relaxed">
          ZK proves you belong. FHE keeps your secrets.
          <br />
          <span className="text-foreground font-medium">Trade in the shadows.</span>
        </p>

        <p className="text-xs font-mono text-muted-foreground/60 mb-10">
          Pre-IPO Synthetics · SpaceX · OpenAI · Stripe
        </p>

        <div className="flex items-center justify-center gap-6 mb-16">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/prove')}
            className="btn-crimson flex items-center gap-2 text-base font-bold animate-pulse-glow"
          >
            Enter the Pool
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="flex items-center justify-center gap-8 text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Starknet ZK Proofs
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Zama fhEVM
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Encrypted Orderbook
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Landing;
