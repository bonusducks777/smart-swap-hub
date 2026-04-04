import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { QUOTER_V2_ABI, UNISWAP_ADDRESSES, FEE_TIERS, getSwapAddress } from '@/lib/contracts';
import type { Token } from '@/lib/tokens';

export interface QuoteResult {
  amountOut: bigint;
  formattedOut: string;
  gasEstimate: bigint;
  feeTier: number;
  error?: string;
}

export function useUniswapQuote(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
) {
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchQuote = async () => {
      if (!publicClient || !amountIn || parseFloat(amountIn) <= 0) {
        setQuote(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      const parsedAmountIn = parseUnits(amountIn, tokenIn.decimals);
      const inAddr = getSwapAddress(tokenIn.address);
      const outAddr = getSwapAddress(tokenOut.address);

      // Try each fee tier, take the best quote
      let bestQuote: QuoteResult | null = null;

      for (const fee of FEE_TIERS) {
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
        setError('No liquidity pool found for this pair on Sepolia');
      }

      setIsLoading(false);
    };

    const timeout = setTimeout(fetchQuote, 500); // debounce
    return () => clearTimeout(timeout);
  }, [publicClient, tokenIn.address, tokenOut.address, amountIn, tokenIn.decimals, tokenOut.decimals]);

  return { quote, isLoading, error };
}
