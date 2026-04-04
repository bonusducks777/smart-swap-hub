import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { useChain } from '@/lib/chain-context';
import { uniswapApiCall } from '@/lib/uniswap-api';
import { isNativeETH } from '@/lib/contracts';
import type { Token } from '@/lib/tokens';
import type { RouteMode } from '@/hooks/useUniswapQuote';

const NATIVE_API_ADDRESS = '0x0000000000000000000000000000000000000000';

export type QuoteType = 'EXACT_INPUT' | 'EXACT_OUTPUT';

export interface ApiQuoteResult {
  amountOut: bigint;
  formattedOut: string;
  amountIn: bigint;
  formattedIn: string;
  gasEstimate: bigint;
  routing: string;
  quote: any;
  permitData: any | null;
  routeMode: RouteMode;
  chainId: number;
  quoteType: QuoteType;
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
  amount: string,
  routeMode: RouteMode = 'auto',
  apiKey?: string,
  recipient?: string,
  quoteType: QuoteType = 'EXACT_INPUT',
) {
  const [quote, setQuote] = useState<ApiQuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const { activeChain } = useChain();

  const resolvedApiKey = apiKey || localStorage.getItem('uniswap_api_key') || '';

  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount || parseFloat(amount) <= 0) {
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
        const amountToken = quoteType === 'EXACT_INPUT' ? tokenIn : tokenOut;
        const parsedAmount = parseUnits(amount, amountToken.decimals).toString();
        const basePayload: Record<string, any> = {
          tokenIn: getApiTokenAddress(tokenIn),
          tokenOut: getApiTokenAddress(tokenOut),
          tokenInChainId: activeChain.id,
          tokenOutChainId: activeChain.id,
          type: quoteType,
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

          if (routeMode !== 'payment' && (normalized.includes('invalid value') || normalized.includes('requestvalidationerror'))) {
            ({ data } = await uniswapApiCall('quote', resolvedApiKey, basePayload));
          } else {
            throw err;
          }
        }

        const rawAmountOut = BigInt(data.quote?.output?.amount || data.quote?.amountOut || '0');
        const formattedOut = (Number(rawAmountOut) / 10 ** tokenOut.decimals).toFixed(tokenOut.decimals > 6 ? 6 : tokenOut.decimals);
        const rawAmountIn = BigInt(data.quote?.input?.amount || data.quote?.amountIn || '0');
        const formattedIn = (Number(rawAmountIn) / 10 ** tokenIn.decimals).toFixed(tokenIn.decimals > 6 ? 6 : 6);
        const gasEstimate = BigInt(data.quote?.gasUseEstimate || data.quote?.gasEstimate || '0');

        setQuote({
          amountOut: rawAmountOut,
          formattedOut,
          amountIn: rawAmountIn,
          formattedIn,
          gasEstimate,
          routing: data.routing || 'CLASSIC',
          quote: data.quote,
          permitData: data.permitData || null,
          routeMode,
          chainId: activeChain.id,
          quoteType,
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
  }, [resolvedApiKey, address, tokenIn.address, tokenOut.address, amount, tokenIn.decimals, tokenOut.decimals, routeMode, activeChain.id, recipient, quoteType]);

  return { quote, isLoading, error };
}
