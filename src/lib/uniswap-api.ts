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

  // Proxy now wraps everything in { _upstreamStatus, _body }
  if (data?._upstreamStatus !== undefined) {
    const upstream = data._body;
    const status = data._upstreamStatus;

    if (status >= 400) {
      const msg = upstream?.detail || upstream?.errorCode || upstream?.error || `API returned ${status}`;
      throw new Error(msg);
    }

    if (upstream?.error) {
      throw new Error(upstream.error);
    }

    return { data: upstream, status };
  }

  // Fallback for old format
  if (data?.error) {
    throw new Error(data.error || data.message || 'API error');
  }

  return { data, status: 200 };
}
