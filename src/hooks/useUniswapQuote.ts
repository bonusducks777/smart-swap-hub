import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { QUOTER_V2_ABI, UNISWAP_ADDRESSES, FEE_TIERS, getSwapAddress } from '@/lib/contracts';
import type { Token } from '@/lib/tokens';

export type RouteMode = 'cheapest' | 'fastest' | 'safe' | 'crosschain';

export interface QuoteResult {
  amountOut: bigint;
  formattedOut: string;
  gasEstimate: bigint;
  feeTier: number;
  routeMode: RouteMode;
  error?: string;
}

export function useUniswapQuote(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  routeMode: RouteMode = 'cheapest',
) {
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchQuote = async () => {
      if (!amountIn || parseFloat(amountIn) <= 0) {
        setQuote(null);
        setError(null);
        return;
      }

      // Cross-chain is not available on testnet
      if (routeMode === 'crosschain') {
        setQuote(null);
        setError('Cross-chain routing is not available on Sepolia testnet');
        setIsLoading(false);
        return;
      }

      // UniswapX / Safe mode is not available on testnet
      if (routeMode === 'safe') {
        setQuote(null);
        setError('UniswapX MEV protection is not available on Sepolia testnet');
        setIsLoading(false);
        return;
      }

      if (!publicClient) {
        setQuote(null);
        setError('No RPC connection — connect your wallet first');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const parsedAmountIn = parseUnits(amountIn, tokenIn.decimals);
        const inAddr = getSwapAddress(tokenIn.address);
        const outAddr = getSwapAddress(tokenOut.address);

        // Route mode determines selection strategy
        // Fastest: return first successful quote (skip remaining tiers)
        // Cheapest: try all fee tiers, pick best output
        const feeTiersToTry = FEE_TIERS;

        let bestQuote: QuoteResult | null = null;

        for (const fee of feeTiersToTry) {
          try {
            const result = await publicClient.simulateContract({
              address: UNISWAP_ADDRESSES.quoterV2,
              abi: QUOTER_V2_ABI,
              functionName: 'quoteExactInputSingle',
              args: [
                {
                  tokenIn: inAddr,
                  tokenOut: outAddr,
                  amountIn: parsedAmountIn,
                  fee,
                  sqrtPriceLimitX96: 0n,
                },
              ],
            });

            const [amountOut, , , gasEstimate] = result.result as [bigint, bigint, number, bigint];

            if (!bestQuote || amountOut > bestQuote.amountOut) {
              bestQuote = {
                amountOut,
                formattedOut: formatUnits(amountOut, tokenOut.decimals),
                gasEstimate,
                feeTier: fee,
                routeMode,
              };
            }
          } catch {
            // This fee tier doesn't have a pool, try next
          }
        }

        if (bestQuote) {
          setQuote(bestQuote);
          setError(null);
        } else {
          setQuote(null);
          if (routeMode === 'fastest') {
            setError('No 0.05% fee pool found for this pair. Try "Save Money" mode to search all pools.');
          } else {
            setError('No liquidity pool found for this pair on Sepolia');
          }
        }
      } catch (err) {
        setQuote(null);
        const msg = err instanceof Error ? err.message : 'Quote failed';
        setError(msg.length > 150 ? msg.slice(0, 150) + '…' : msg);
      }

      setIsLoading(false);
    };

    const timeout = setTimeout(fetchQuote, 500); // debounce
    return () => clearTimeout(timeout);
  }, [publicClient, tokenIn.address, tokenOut.address, amountIn, tokenIn.decimals, tokenOut.decimals, routeMode]);

  return { quote, isLoading, error };
}
