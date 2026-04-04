import { useEffect, useRef, useState, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem, formatUnits } from 'viem';

export interface IncomingTransfer {
  token: string;       // contract address
  from: string;
  amount: bigint;
  txHash: string;
  symbol?: string;
  decimals?: number;
  formatted?: string;
}

const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

/**
 * Listens for ERC-20 Transfer events TO the given address.
 * Only active when `enabled` is true. Returns the first transfer detected then stops.
 */
export function useErc20Listener(walletAddress: string | undefined, enabled: boolean) {
  const publicClient = usePublicClient();
  const [transfer, setTransfer] = useState<IncomingTransfer | null>(null);
  const [listening, setListening] = useState(false);
  const unwatchRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    if (unwatchRef.current) {
      unwatchRef.current();
      unwatchRef.current = null;
    }
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setTransfer(null);
  }, [stop]);

  useEffect(() => {
    if (!enabled || !walletAddress || !publicClient) {
      stop();
      return;
    }

    setListening(true);
    setTransfer(null);

    const unwatch = publicClient.watchEvent({
      event: TRANSFER_EVENT,
      args: { to: walletAddress as `0x${string}` },
      onLogs: async (logs) => {
        for (const log of logs) {
          const tokenAddress = log.address;
          const from = log.args.from as string;
          const value = log.args.value as bigint;
          const txHash = log.transactionHash;

          // Try to resolve symbol + decimals
          let symbol: string | undefined;
          let decimals: number | undefined;
          let formatted: string | undefined;

          try {
            const [sym, dec] = await Promise.all([
              publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: [{ inputs: [], name: 'symbol', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' }],
                functionName: 'symbol',
              }),
              publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: [{ inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' }],
                functionName: 'decimals',
              }),
            ]);
            symbol = sym as string;
            decimals = Number(dec);
            formatted = formatUnits(value, decimals);
          } catch {
            // unknown token
          }

          setTransfer({ token: tokenAddress, from, amount: value, txHash, symbol, decimals, formatted });
          // Stop listening after first transfer
          stop();
          break;
        }
      },
    });

    unwatchRef.current = unwatch;

    return () => {
      unwatch();
      unwatchRef.current = null;
    };
  }, [enabled, walletAddress, publicClient, stop]);

  return { transfer, listening, stop, reset };
}
