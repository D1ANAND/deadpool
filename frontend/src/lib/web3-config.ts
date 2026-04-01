import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const WALLET_CONNECT_PROJECT_ID = '6b6784ba8358aa25926c592ea1445ca6';
const SEPOLIA_RPC = 'https://eth-sepolia.g.alchemy.com/v2/PuciTLIfFiQrrhuVIkGAm';

export const wagmiConfig = getDefaultConfig({
  appName: 'deadpool',
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC),
  },
});
