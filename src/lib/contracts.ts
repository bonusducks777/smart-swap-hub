// Uniswap V3 contract ABIs (chain-agnostic)
// Addresses are now per-chain in tokens.ts

import { getChainConfig } from '@/lib/tokens';

// Get contract addresses for a specific chain
export function getContractsForChain(chainId: number) {
  const chain = getChainConfig(chainId);
  return {
    swapRouter02: chain.contracts.swapRouter02 as `0x${string}`,
    quoterV2: chain.contracts.quoterV2 as `0x${string}`,
    WETH: chain.contracts.WETH as `0x${string}`,
  };
}

// Legacy static addresses (Sepolia) - kept for backward compat
export const UNISWAP_ADDRESSES = getContractsForChain(11155111);

// Minimal ABIs for the contracts we interact with
export const QUOTER_V2_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'quoteExactInputSingle',
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const SWAP_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'exactInputSingle',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Fee tiers available on Uniswap V3
export const FEE_TIERS = [100, 500, 3000, 10000] as const;
export type FeeTier = typeof FEE_TIERS[number];

// Native ETH pseudo-address
export const NATIVE_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export function isNativeETH(address: string): boolean {
  return address.toLowerCase() === NATIVE_ETH.toLowerCase();
}

// Get the actual token address for contract calls (WETH for native ETH)
export function getSwapAddress(tokenAddress: string, chainId: number = 11155111): `0x${string}` {
  if (isNativeETH(tokenAddress)) return getContractsForChain(chainId).WETH;
  return tokenAddress as `0x${string}`;
}
