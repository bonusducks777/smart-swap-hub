import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';
import {
  SWAP_ROUTER_ABI,
  ERC20_ABI,
  isNativeETH,
  getSwapAddress,
  getContractsForChain,
} from '@/lib/contracts';
import { useChain } from '@/lib/chain-context';
import type { Token } from '@/lib/tokens';

export type SwapStep = 'idle' | 'checking-allowance' | 'approving' | 'swapping' | 'done' | 'error';

export function useSwapExecution() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { activeChain } = useChain();
  const [step, setStep] = useState<SwapStep>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeSwap = async (
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string,
    amountOutMin: bigint,
    feeTier: number,
    slippagePct: number,
  ) => {
    if (!address || !publicClient || !walletClient) {
      setError('Wallet not connected');
      return;
    }

    try {
      setStep('idle');
      setError(null);
      setTxHash(null);

      const contracts = getContractsForChain(activeChain.id);
      const parsedAmountIn = parseUnits(amountIn, tokenIn.decimals);
      const inAddr = getSwapAddress(tokenIn.address, activeChain.id);
      const outAddr = getSwapAddress(tokenOut.address, activeChain.id);
      const isETHIn = isNativeETH(tokenIn.address);

      const slippageMultiplier = BigInt(Math.floor((1 - slippagePct / 100) * 10000));
      const minOut = (amountOutMin * slippageMultiplier) / 10000n;

      if (!isETHIn) {
        setStep('checking-allowance');

        const allowance = await publicClient.readContract({
          address: inAddr,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, contracts.swapRouter02],
        });

        if ((allowance as bigint) < parsedAmountIn) {
          setStep('approving');

          const approveHash = await walletClient.writeContract({
            address: inAddr,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [contracts.swapRouter02, maxUint256],
            chain: walletClient.chain,
            account: address,
          });

          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      setStep('swapping');

      const swapHash = await walletClient.writeContract({
        address: contracts.swapRouter02,
        abi: SWAP_ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [
          {
            tokenIn: inAddr,
            tokenOut: outAddr,
            fee: feeTier,
            recipient: address,
            amountIn: parsedAmountIn,
            amountOutMinimum: minOut,
            sqrtPriceLimitX96: 0n,
          },
        ],
        value: isETHIn ? parsedAmountIn : 0n,
        chain: walletClient.chain,
        account: address,
      });

      setTxHash(swapHash);
      await publicClient.waitForTransactionReceipt({ hash: swapHash });
      setStep('done');
    } catch (err: unknown) {
      setStep('error');
      const msg = err instanceof Error ? err.message : 'Swap failed';
      if (msg.includes('User rejected')) {
        setError('Transaction rejected by user');
      } else if (msg.includes('insufficient funds')) {
        setError('Insufficient balance for this swap');
      } else {
        setError(msg.length > 200 ? msg.slice(0, 200) + '…' : msg);
      }
    }
  };

  const reset = () => {
    setStep('idle');
    setTxHash(null);
    setError(null);
  };

  return { executeSwap, step, txHash, error, reset };
}
