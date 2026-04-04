import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { useBackendMode } from '@/lib/backend-context';
import { uniswapApiCall } from '@/lib/uniswap-api';
import { isNativeETH } from '@/lib/contracts';
import type { Token } from '@/lib/tokens';
import type { RouteMode } from '@/hooks/useUniswapQuote';

const SEPOLIA_CHAIN_ID = 11155111;
const NATIVE_API_ADDRESS = '0x0000000000000000000000000000000000000000';

export interface ApiQuoteResult {
  amountOut: bigint;
  formattedOut: string;
  gasEstimate: bigint;
  routing: string;
  quote: any;
  permitData: any | null;
  routeMode: RouteMode;
}

function getApiTokenAddress(token: Token): string {
  if (isNativeETH(token.address)) return NATIVE_API_ADDRESS;
  return token.address;
}

function getRoutingPreference(routeMode: RouteMode): Record<string, any> {
  switch (routeMode) {
    case 'safe':
      return { protocols: ['UNISWAPX_V2'] };
    case 'fastest':
    case 'crosschain':
    case 'cheapest':
    default:
      return {};
  }
}

export function useUniswapApiQuote(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  routeMode: RouteMode = 'cheapest',
) {
  const [quote, setQuote] = useState<ApiQuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { apiKey } = useBackendMode();
  const { address } = useAccount();

  useEffect(() => {
    const fetchQuote = async () => {
      if (!amountIn || parseFloat(amountIn) <= 0) {
        setQuote(null);
        setError(null);
        return;
      }

      if (!apiKey) {
        setQuote(null);
        setError('API key required — enter it in the Settings tab');
        setIsLoading(false);
        return;
      }

      if (!address) {
        setQuote(null);
        setError('Connect wallet to get API quotes');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const parsedAmount = parseUnits(amountIn, tokenIn.decimals).toString();

        const payload: Record<string, any> = {
          tokenIn: getApiTokenAddress(tokenIn),
          tokenOut: getApiTokenAddress(tokenOut),
          tokenInChainId: SEPOLIA_CHAIN_ID,
          tokenOutChainId: SEPOLIA_CHAIN_ID,
          type: 'EXACT_INPUT',
          amount: parsedAmount,
          swapper: address,
          slippageTolerance: 0.5,
          ...getRoutingPreference(routeMode),
        };

        const { data } = await uniswapApiCall('quote', apiKey, payload);

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
  }, [apiKey, address, tokenIn.address, tokenOut.address, amountIn, tokenIn.decimals, tokenOut.decimals, routeMode]);

  return { quote, isLoading, error };
}
