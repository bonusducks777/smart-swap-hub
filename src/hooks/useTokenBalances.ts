import { useAccount, useBalance, useReadContracts } from 'wagmi';
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

  // ETH balance
  const { data: ethBalance } = useBalance({ address });

  // ERC20 balances
  const erc20Tokens = SEPOLIA_TOKENS.filter(t => !isNativeETH(t.address));

  const contracts = erc20Tokens.map(token => ({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf' as const,
    args: [address!] as const,
  }));

  const { data: erc20Balances, isLoading } = useReadContracts({
    contracts,
    query: { enabled: isConnected && !!address },
  });

  const balances: TokenBalance[] = [];

  if (ethBalance) {
    balances.push({
      symbol: 'ETH',
      balance: ethBalance.value,
      formatted: parseFloat(ethBalance.formatted).toFixed(6),
      decimals: 18,
    });
  }

  if (erc20Balances) {
    erc20Tokens.forEach((token, i) => {
      const result = erc20Balances[i];
      if (result?.status === 'success' && result.result != null) {
        const raw = BigInt(result.result.toString());
        const formatted = (Number(raw) / 10 ** token.decimals).toFixed(token.decimals > 6 ? 6 : 2);
        balances.push({
          symbol: token.symbol,
          balance: raw,
          formatted,
          decimals: token.decimals,
        });
      }
    });
  }

  return { balances, isLoading, isConnected };
}
