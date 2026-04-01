import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { StarknetConfig, publicProvider, argent, braavos } from "@starknet-react/core";
import { sepolia as starknetSepolia } from "@starknet-react/chains";
import { Toaster } from "@/components/ui/sonner";
import { wagmiConfig } from "@/lib/web3-config";
import Landing from "@/pages/Landing";
import Prove from "@/pages/Prove";
import Trade from "@/pages/Trade";
import NotFound from "@/pages/NotFound";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const starknetConnectors = [argent(), braavos()];

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider theme={darkTheme({ accentColor: 'hsl(0, 84%, 60%)', borderRadius: 'medium' })}>
        <StarknetConfig chains={[starknetSepolia]} provider={publicProvider()} connectors={starknetConnectors as any}>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/prove" element={<Prove />} />
              <Route path="/trade" element={<Trade />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </StarknetConfig>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
