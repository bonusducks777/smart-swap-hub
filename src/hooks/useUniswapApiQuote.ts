import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { useBackendMode } from '@/lib/backend-context';
import { isNativeETH, UNISWAP_ADDRESSES } from '@/lib/contracts';
import type { Token } from '@/lib/tokens';
import type { RouteMode } from '@/hooks/useUniswapQuote';

const API_BASE = 'https://trade-api.gateway.uniswap.org/v1';
const SEPOLIA_CHAIN_ID = 11155111;

// Native ETH address for the Uniswap API
const NATIVE_API_ADDRESS = '0x0000000000000000000000000000000000000000';

export interface ApiQuoteResult {
  amountOut: bigint;
  formattedOut: string;
  gasEstimate: bigint;
  routing: string; // CLASSIC, DUTCH_V2, DUTCH_V3, PRIORITY, WRAP, UNWRAP, BRIDGE
  quote: any; // raw quote object to pass to /swap or /order
  permitData: any | null;
  routeMode: RouteMode;
}

function getApiTokenAddress(token: Token): string {
  if (isNativeETH(token.address)) return NATIVE_API_ADDRESS;
  return token.address;
}

function getRoutingPreference(routeMode: RouteMode): Record<string, any> {
  switch (routeMode) {
    case 'fastest':
      return { protocols: ['V3'] }; // direct AMM only
    case 'safe':
      return { protocols: ['UNISWAPX_V2', 'UNISWAPX_V3'] }; // UniswapX only
    case 'crosschain':
      return {}; // let API decide, cross-chain uses BRIDGE routing
    case 'cheapest':
    default:
      return {}; // let API find best route
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
        const tokenInAddr = getApiTokenAddress(tokenIn);
        const tokenOutAddr = getApiTokenAddress(tokenOut);

        const body: Record<string, any> = {
          tokenIn: tokenInAddr,
          tokenOut: tokenOutAddr,
          tokenInChainId: SEPOLIA_CHAIN_ID,
          tokenOutChainId: SEPOLIA_CHAIN_ID,
          type: 'EXACT_INPUT',
          amount: parsedAmount,
          swapper: address,
          slippageTolerance: 0.5,
          ...getRoutingPreference(routeMode),
        };

        const response = await fetch(`${API_BASE}/quote`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 401) {
            throw new Error('Invalid API key — check Settings');
          } else if (response.status === 429) {
            throw new Error('Rate limited — try again in a few seconds');
          } else {
            throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
          }
        }

        const data = await response.json();

        // Parse the amount out from the API response
        const rawAmountOut = BigInt(data.quote?.amountOut || data.quote?.amount || '0');
        const formattedOut = (Number(rawAmountOut) / 10 ** tokenOut.decimals).toFixed(tokenOut.decimals);
        const gasEstimate = BigInt(data.quote?.gasEstimate || data.quote?.gasUseEstimate || '0');

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
