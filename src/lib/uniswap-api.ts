import { supabase } from '@/integrations/supabase/client';

/**
 * Call the Uniswap Trading API through our edge function proxy (avoids CORS).
 */
export async function uniswapApiCall(
  endpoint: string,
  apiKey: string,
  payload: Record<string, any>,
): Promise<{ data: any; status: number }> {
  const { data, error } = await supabase.functions.invoke('uniswap-proxy', {
    body: { endpoint, apiKey, payload },
  });

  if (error) {
    throw new Error(error.message || 'Proxy call failed');
  }

  // Edge function returns the raw Uniswap API response
  // If the response contains an error field, throw it
  if (data?.error) {
    throw new Error(data.error || data.message || 'API error');
  }

  return { data, status: 200 };
}
