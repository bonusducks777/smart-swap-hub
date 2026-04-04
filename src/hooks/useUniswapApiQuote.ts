import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { useChain } from '@/lib/chain-context';
import { uniswapApiCall } from '@/lib/uniswap-api';
import { isNativeETH } from '@/lib/contracts';
import type { Token } from '@/lib/tokens';
import type { RouteMode } from '@/hooks/useUniswapQuote';

const NATIVE_API_ADDRESS = '0x0000000000000000000000000000000000000000';

export interface ApiQuoteResult {
  amountOut: bigint;
  formattedOut: string;
  gasEstimate: bigint;
  routing: string;
  quote: any;
  permitData: any | null;
  routeMode: RouteMode;
  chainId: number;
}

function getApiTokenAddress(token: Token): string {
  if (isNativeETH(token.address)) return NATIVE_API_ADDRESS;
  return token.address;
}

function getRoutingPreference(routeMode: RouteMode): Record<string, any> {
  switch (routeMode) {
    case 'payment':
      return { protocols: ['V3', 'V2'] };
    case 'auto':
    default:
      return { protocols: ['V3', 'V2', 'UNISWAPX_V3'] };
  }
}

export function useUniswapApiQuote(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  routeMode: RouteMode = 'auto',
  apiKey?: string,
) {
  const [quote, setQuote] = useState<ApiQuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const { activeChain } = useChain();

  // Get API key from param or localStorage
  const resolvedApiKey = apiKey || localStorage.getItem('uniswap_api_key') || '';

  useEffect(() => {
    const fetchQuote = async () => {
      if (!amountIn || parseFloat(amountIn) <= 0) {
        setQuote(null);
        setError(null);
        return;
      }

      if (!resolvedApiKey) {
        setQuote(null);
        setError('API key required — enter it in the Settings tab');
        setIsLoading(false);
        return;
      }

      if (!address) {
        setQuote(null);
        setError('Connect wallet to get quotes');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const parsedAmount = parseUnits(amountIn, tokenIn.decimals).toString();
        const basePayload: Record<string, any> = {
          tokenIn: getApiTokenAddress(tokenIn),
          tokenOut: getApiTokenAddress(tokenOut),
          tokenInChainId: activeChain.id,
          tokenOutChainId: activeChain.id,
          type: 'EXACT_INPUT',
          amount: parsedAmount,
          swapper: address,
          slippageTolerance: 0.5,
          ...(recipient ? { recipient } : {}),
        };

        const preferredPayload = {
          ...basePayload,
          ...getRoutingPreference(routeMode),
        };

        let data: any;

        try {
          ({ data } = await uniswapApiCall('quote', resolvedApiKey, preferredPayload));
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'API quote failed';
          const normalized = msg.toLowerCase();

          // If forced protocols fail (e.g. UNISWAPX_V3 not available), retry without
          if (routeMode !== 'payment' && (normalized.includes('invalid value') || normalized.includes('requestvalidationerror'))) {
            ({ data } = await uniswapApiCall('quote', resolvedApiKey, basePayload));
          } else {
            throw err;
          }
        }

        const rawAmountOut = BigInt(data.quote?.output?.amount || data.quote?.amountOut || data.quote?.amount || '0');
        const formattedOut = (Number(rawAmountOut) / 10 ** tokenOut.decimals).toFixed(tokenOut.decimals);
        const gasEstimate = BigInt(data.quote?.gasUseEstimate || data.quote?.gasEstimate || '0');

        setQuote({
          amountOut: rawAmountOut,
          formattedOut,
          gasEstimate,
          routing: data.routing || 'CLASSIC',
          quote: data.quote,
          permitData: data.permitData || null,
          routeMode,
          chainId: activeChain.id,
        });
        setError(null);
      } catch (err) {
        setQuote(null);
        const msg = err instanceof Error ? err.message : 'API quote failed';
        setError(msg.length > 200 ? msg.slice(0, 200) + '…' : msg);
      }

      setIsLoading(false);
    };

    const timeout = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeout);
  }, [resolvedApiKey, address, tokenIn.address, tokenOut.address, amountIn, tokenIn.decimals, tokenOut.decimals, routeMode, activeChain.id]);

  return { quote, isLoading, error };
}
