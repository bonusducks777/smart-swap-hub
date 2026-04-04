import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { QUOTER_V2_ABI, FEE_TIERS, getSwapAddress, getContractsForChain } from '@/lib/contracts';
import { useChain } from '@/lib/chain-context';
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
  const { activeChain } = useChain();

  useEffect(() => {
    const fetchQuote = async () => {
      if (!amountIn || parseFloat(amountIn) <= 0) {
        setQuote(null);
        setError(null);
        return;
      }

      if (routeMode === 'crosschain') {
        setQuote(null);
        setError('Cross-chain routing requires API mode');
        setIsLoading(false);
        return;
      }

      if (routeMode === 'safe') {
        setQuote(null);
        setError('UniswapX MEV protection requires API mode');
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
        const inAddr = getSwapAddress(tokenIn.address, activeChain.id);
        const outAddr = getSwapAddress(tokenOut.address, activeChain.id);
        const contracts = getContractsForChain(activeChain.id);

        const feeTiersToTry = FEE_TIERS;
        let bestQuote: QuoteResult | null = null;

        for (const fee of feeTiersToTry) {
          try {
            const result = await publicClient.simulateContract({
              address: contracts.quoterV2,
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
              if (routeMode === 'fastest') break;
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
          setError(`No liquidity pool found for this pair on ${activeChain.name}`);
        }
      } catch (err) {
        setQuote(null);
        const msg = err instanceof Error ? err.message : 'Quote failed';
        setError(msg.length > 150 ? msg.slice(0, 150) + '…' : msg);
      }

      setIsLoading(false);
    };

    const timeout = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeout);
  }, [publicClient, tokenIn.address, tokenOut.address, amountIn, tokenIn.decimals, tokenOut.decimals, routeMode, activeChain.id]);

  return { quote, isLoading, error };
}
