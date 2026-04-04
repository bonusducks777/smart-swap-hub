import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { sepolia } from 'viem/chains';
import { useBackendMode } from '@/lib/backend-context';
import { uniswapApiCall } from '@/lib/uniswap-api';
import type { ApiQuoteResult } from '@/hooks/useUniswapApiQuote';

export type ApiSwapStep = 'idle' | 'checking-approval' | 'approving' | 'signing-permit' | 'building-swap' | 'swapping' | 'done' | 'error';

const UNISWAPX_ROUTING = ['DUTCH_V2', 'DUTCH_V3', 'PRIORITY'];

export function useApiSwapExecution() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { apiKey } = useBackendMode();
  const [step, setStep] = useState<ApiSwapStep>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeSwap = async (apiQuote: ApiQuoteResult) => {
    if (!address || !publicClient || !walletClient || !apiKey) {
      setError('Wallet not connected or API key missing');
      return;
    }

    try {
      setStep('idle');
      setError(null);
      setTxHash(null);

      // Step 1: Check approval
      setStep('checking-approval');
      try {
        const { data: approvalData } = await uniswapApiCall('check_approval', apiKey, {
          token: apiQuote.quote.tokenIn || apiQuote.quote.input?.token,
          amount: apiQuote.quote.amountIn || apiQuote.quote.input?.amount,
          walletAddress: address,
          chainId: 11155111,
        });

        if (approvalData.approval) {
          setStep('approving');
          const approveTx = approvalData.approval;
          const approveHash = await walletClient.sendTransaction({
            to: approveTx.to as `0x${string}`,
            data: approveTx.data as `0x${string}`,
            value: BigInt(approveTx.value || '0'),
            chain: sepolia,
            account: address,
            kzg: undefined as any,
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      } catch {
        // check_approval may fail on testnet, continue
      }

      // Step 2: Sign Permit2 if needed
      let signature: string | undefined;
      if (apiQuote.permitData) {
        setStep('signing-permit');
        const { domain, types, values } = apiQuote.permitData;
        signature = await walletClient.signTypedData({
          account: address,
          domain,
          types,
          primaryType: Object.keys(types).find(k => k !== 'EIP712Domain') || 'PermitSingle',
          message: values,
        });
      }

      // Step 3: Build and execute
      const isUniswapX = UNISWAPX_ROUTING.includes(apiQuote.routing);
      const endpoint = isUniswapX ? 'order' : 'swap';

      setStep('building-swap');
      const swapBody: Record<string, any> = { quote: apiQuote.quote };
      if (signature && apiQuote.permitData) {
        swapBody.signature = signature;
        swapBody.permitData = apiQuote.permitData;
      }

      const { data: swapData } = await uniswapApiCall(endpoint, apiKey, swapBody);

      if (isUniswapX) {
        setTxHash(swapData.orderHash || swapData.hash || 'order-submitted');
        setStep('done');
      } else {
        const tx = swapData.swap;
        if (!tx?.data || tx.data === '' || tx.data === '0x') {
          throw new Error('Invalid transaction: empty data field from API');
        }

        setStep('swapping');
        const hash = await walletClient.sendTransaction({
          to: tx.to as `0x${string}`,
          data: tx.data as `0x${string}`,
          value: BigInt(tx.value || '0'),
          chain: sepolia,
          account: address,
          ...(tx.gasLimit ? { gas: BigInt(tx.gasLimit) } : {}),
          kzg: undefined as any,
        });

        setTxHash(hash);
        await publicClient.waitForTransactionReceipt({ hash });
        setStep('done');
      }
    } catch (err: unknown) {
      setStep('error');
      const msg = err instanceof Error ? err.message : 'Swap failed';
      if (msg.includes('User rejected')) {
        setError('Transaction rejected by user');
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
