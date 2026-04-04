import { http, createConfig } from 'wagmi';
import {
  mainnet, sepolia, polygon, arbitrum, optimism, base,
  bsc, avalanche, celo, zkSync, zora, blast,
} from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const chains = [sepolia, mainnet, polygon, arbitrum, optimism, base, bsc, avalanche, celo, zkSync, zora, blast] as const;

export const config = createConfig({
  chains,
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
    [celo.id]: http(),
    [zkSync.id]: http(),
    [zora.id]: http(),
    [blast.id]: http(),
  },
});
