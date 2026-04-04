export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
  chain?: string;
}

export interface ChainConfig {
  id: number;
  name: string;
  icon: string;
  color: string;
  explorerUrl: string;
  tokens: Token[];
  contracts: {
    swapRouter02: string;
    quoterV2: string;
    WETH: string;
  };
}

// All Uniswap-supported EVM mainnets + Sepolia testnet
export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: 11155111,
    name: 'Sepolia',
    icon: '🧪',
    color: 'hsl(45, 80%, 55%)',
    explorerUrl: 'https://sepolia.etherscan.io',
    tokens: [
      { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '⟠' },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', decimals: 18, icon: '🔷' },
      { symbol: 'USDC', name: 'USD Coin', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6, icon: '💵' },
      { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, icon: '🦄' },
      { symbol: 'LINK', name: 'Chainlink', address: '0x779877A7B0D9E8603169DdbD7836e478b4624789', decimals: 18, icon: '⛓️' },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x68194a729C2450ad26072b3D33ADaCbcef39D574', decimals: 18, icon: '🟡' },
    ],
    contracts: {
      swapRouter02: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
      quoterV2: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
      WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    },
  },
  {
    id: 1,
    name: 'Ethereum',
    icon: '⟠',
    color: 'hsl(230, 60%, 55%)',
    explorerUrl: 'https://etherscan.io',
    tokens: [
      { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '⟠' },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, icon: '🔷' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, icon: '💵' },
      { symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, icon: '💲' },
      { symbol: 'DAI', name: 'Dai', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, icon: '🟡' },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, icon: '₿' },
      { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, icon: '🦄' },
      { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, icon: '⛓️' },
    ],
    contracts: {
      swapRouter02: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      quoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
      WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
  },
  {
    id: 137,
    name: 'Polygon',
    icon: '🟣',
    color: 'hsl(280, 80%, 55%)',
    explorerUrl: 'https://polygonscan.com',
    tokens: [
      { symbol: 'MATIC', name: 'Polygon', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '🟣' },
      { symbol: 'WMATIC', name: 'Wrapped MATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18, icon: '🟣' },
      { symbol: 'USDC', name: 'USD Coin', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6, icon: '💵' },
      { symbol: 'USDT', name: 'Tether', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, icon: '💲' },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18, icon: '🔷' },
      { symbol: 'DAI', name: 'Dai', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18, icon: '🟡' },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8, icon: '₿' },
      { symbol: 'UNI', name: 'Uniswap', address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', decimals: 18, icon: '🦄' },
    ],
    contracts: {
      swapRouter02: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      quoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
      WETH: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    },
  },
  {
    id: 42161,
    name: 'Arbitrum',
    icon: '🔷',
    color: 'hsl(210, 80%, 50%)',
    explorerUrl: 'https://arbiscan.io',
    tokens: [
      { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '⟠' },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, icon: '🔷' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, icon: '💵' },
      { symbol: 'USDT', name: 'Tether', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, icon: '💲' },
      { symbol: 'DAI', name: 'Dai', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18, icon: '🟡' },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', decimals: 8, icon: '₿' },
      { symbol: 'ARB', name: 'Arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, icon: '🔷' },
      { symbol: 'UNI', name: 'Uniswap', address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', decimals: 18, icon: '🦄' },
    ],
    contracts: {
      swapRouter02: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      quoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
      WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    },
  },
  {
    id: 10,
    name: 'Optimism',
    icon: '🔴',
    color: 'hsl(0, 80%, 55%)',
    explorerUrl: 'https://optimistic.etherscan.io',
    tokens: [
      { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '⟠' },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18, icon: '🔷' },
      { symbol: 'USDC', name: 'USD Coin', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6, icon: '💵' },
      { symbol: 'USDT', name: 'Tether', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6, icon: '💲' },
      { symbol: 'DAI', name: 'Dai', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18, icon: '🟡' },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095', decimals: 8, icon: '₿' },
      { symbol: 'OP', name: 'Optimism', address: '0x4200000000000000000000000000000000000042', decimals: 18, icon: '🔴' },
      { symbol: 'UNI', name: 'Uniswap', address: '0x6fd9d7AD17242c41f7131d257212c54A0e816691', decimals: 18, icon: '🦄' },
    ],
    contracts: {
      swapRouter02: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      quoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
      WETH: '0x4200000000000000000000000000000000000006',
    },
  },
  {
    id: 8453,
    name: 'Base',
    icon: '🔵',
    color: 'hsl(220, 90%, 55%)',
    explorerUrl: 'https://basescan.org',
    tokens: [
      { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '⟠' },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18, icon: '🔷' },
      { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, icon: '💵' },
      { symbol: 'DAI', name: 'Dai', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18, icon: '🟡' },
      { symbol: 'cbETH', name: 'Coinbase ETH', address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', decimals: 18, icon: '🏦' },
    ],
    contracts: {
      swapRouter02: '0x2626664c2603336E57B271c5C0b26F421741e481',
      quoterV2: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
      WETH: '0x4200000000000000000000000000000000000006',
    },
  },
  {
    id: 56,
    name: 'BNB Chain',
    icon: '🟡',
    color: 'hsl(45, 90%, 50%)',
    explorerUrl: 'https://bscscan.com',
    tokens: [
      { symbol: 'BNB', name: 'BNB', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '🟡' },
      { symbol: 'WBNB', name: 'Wrapped BNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18, icon: '🟡' },
      { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18, icon: '💵' },
      { symbol: 'USDT', name: 'Tether', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, icon: '💲' },
      { symbol: 'ETH', name: 'Ethereum', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', decimals: 18, icon: '⟠' },
    ],
    contracts: {
      swapRouter02: '0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2',
      quoterV2: '0x78D78E420Da98ad378D7799bE8f19C796B4E0BBB',
      WETH: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    },
  },
  {
    id: 43114,
    name: 'Avalanche',
    icon: '🔺',
    color: 'hsl(0, 70%, 50%)',
    explorerUrl: 'https://snowtrace.io',
    tokens: [
      { symbol: 'AVAX', name: 'Avalanche', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '🔺' },
      { symbol: 'WAVAX', name: 'Wrapped AVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', decimals: 18, icon: '🔺' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6, icon: '💵' },
      { symbol: 'USDT', name: 'Tether', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', decimals: 6, icon: '💲' },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', decimals: 18, icon: '🔷' },
    ],
    contracts: {
      swapRouter02: '0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE',
      quoterV2: '0xbe0F5544EC67e9B3b2D979aaA43f18Fd87E6257F',
      WETH: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    },
  },
  {
    id: 42220,
    name: 'Celo',
    icon: '🟢',
    color: 'hsl(140, 70%, 50%)',
    explorerUrl: 'https://celoscan.io',
    tokens: [
      { symbol: 'CELO', name: 'Celo', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '🟢' },
      { symbol: 'cUSD', name: 'Celo Dollar', address: '0x765DE816845861e75A25fCA122bb6898B8B1282a', decimals: 18, icon: '💵' },
      { symbol: 'cEUR', name: 'Celo Euro', address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73', decimals: 18, icon: '💶' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', decimals: 6, icon: '💵' },
    ],
    contracts: {
      swapRouter02: '0x5615CDAb10dc425a742d643d949a7F474C01abc4',
      quoterV2: '0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8',
      WETH: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    },
  },
  {
    id: 324,
    name: 'zkSync Era',
    icon: '💠',
    color: 'hsl(260, 70%, 55%)',
    explorerUrl: 'https://explorer.zksync.io',
    tokens: [
      { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '⟠' },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91', decimals: 18, icon: '🔷' },
      { symbol: 'USDC', name: 'USD Coin', address: '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4', decimals: 6, icon: '💵' },
    ],
    contracts: {
      swapRouter02: '0x99c56385dB8B0000a6a67f27A0ee19394A46eC59',
      quoterV2: '0x8Cb537fc92E26d8EBBb760E632c95484b6Ea3e28',
      WETH: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91',
    },
  },
  {
    id: 7777777,
    name: 'Zora',
    icon: '✨',
    color: 'hsl(300, 70%, 55%)',
    explorerUrl: 'https://explorer.zora.energy',
    tokens: [
      { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '⟠' },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18, icon: '🔷' },
    ],
    contracts: {
      swapRouter02: '0x7De04c96BE5159c3b5CeffC82aa176dc81281557',
      quoterV2: '0x11867e1b3348F3ce4FcC56B522D624F2f27C037F',
      WETH: '0x4200000000000000000000000000000000000006',
    },
  },
  {
    id: 81457,
    name: 'Blast',
    icon: '💥',
    color: 'hsl(50, 90%, 50%)',
    explorerUrl: 'https://blastscan.io',
    tokens: [
      { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '⟠' },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4300000000000000000000000000000000000004', decimals: 18, icon: '🔷' },
      { symbol: 'USDB', name: 'USDB', address: '0x4300000000000000000000000000000000000003', decimals: 18, icon: '💵' },
    ],
    contracts: {
      swapRouter02: '0x549FEB8c9bd4c12Ad2AB27022dA12492F0A1A2D0',
      quoterV2: '0x6Cdcd65e03c1CEc3730AeeCd45bc140D57A25C77',
      WETH: '0x4300000000000000000000000000000000000004',
    },
  },
];

// Legacy exports for backward compatibility
export const SEPOLIA_TOKENS = SUPPORTED_CHAINS[0].tokens;

export const CHAINS = SUPPORTED_CHAINS.map(c => ({
  id: c.name.toLowerCase().replace(/\s+/g, '-'),
  name: c.name,
  icon: c.icon,
  color: c.color,
}));

export function getChainConfig(chainId: number): ChainConfig {
  return SUPPORTED_CHAINS.find(c => c.id === chainId) || SUPPORTED_CHAINS[0];
}

export function getTokensForChain(chainId: number): Token[] {
  return getChainConfig(chainId).tokens;
}
