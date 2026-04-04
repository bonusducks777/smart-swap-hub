import { useAccount, useBalance, usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import { SEPOLIA_TOKENS } from '@/lib/tokens';
import { ERC20_ABI, isNativeETH } from '@/lib/contracts';

export interface TokenBalance {
  symbol: string;
  balance: bigint;
  formatted: string;
  decimals: number;
}

export function useTokenBalances() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const publicClient = usePublicClient();
  const [erc20Data, setErc20Data] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address || !publicClient) {
      setErc20Data([]);
      return;
    }

    const fetchBalances = async () => {
      setIsLoading(true);
      const tokens = SEPOLIA_TOKENS.filter(t => !isNativeETH(t.address));
      const results: TokenBalance[] = [];

      for (const token of tokens) {
        try {
          const raw = await publicClient.readContract({
            address: token.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          }) as bigint;

          results.push({
            symbol: token.symbol,
            balance: raw,
            formatted: (Number(raw) / 10 ** token.decimals).toFixed(token.decimals > 6 ? 6 : 2),
            decimals: token.decimals,
          });
        } catch {
          results.push({ symbol: token.symbol, balance: 0n, formatted: '0', decimals: token.decimals });
        }
      }

      setErc20Data(results);
      setIsLoading(false);
    };

    fetchBalances();
  }, [isConnected, address, publicClient]);

  const balances: TokenBalance[] = [];

  if (ethBalance) {
    balances.push({
      symbol: 'ETH',
      balance: ethBalance.value,
      formatted: parseFloat(ethBalance.formatted).toFixed(6),
      decimals: 18,
    });
  }

  balances.push(...erc20Data);

  return { balances, isLoading, isConnected };
}
