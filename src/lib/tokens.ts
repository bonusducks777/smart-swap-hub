export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
  chain?: string;
}

// Sepolia testnet tokens
export const SEPOLIA_TOKENS: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '⟠' },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', decimals: 18, icon: '🔷' },
  { symbol: 'USDC', name: 'USD Coin', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6, icon: '💵' },
  { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, icon: '🦄' },
  { symbol: 'LINK', name: 'Chainlink', address: '0x779877A7B0D9E8603169DdbD7836e478b4624789', decimals: 18, icon: '⛓️' },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x68194a729C2450ad26072b3D33ADaCbcef39D574', decimals: 18, icon: '🟡' },
];

export const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', icon: '⟠', color: 'hsl(230, 60%, 55%)' },
  { id: 'base', name: 'Base', icon: '🔵', color: 'hsl(220, 90%, 55%)' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔷', color: 'hsl(210, 80%, 50%)' },
  { id: 'polygon', name: 'Polygon', icon: '🟣', color: 'hsl(280, 80%, 55%)' },
  { id: 'optimism', name: 'Optimism', icon: '🔴', color: 'hsl(0, 80%, 55%)' },
];
