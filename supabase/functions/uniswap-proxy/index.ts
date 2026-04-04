import { corsHeaders } from '@supabase/supabase-js/cors'

const UNISWAP_API_BASE = 'https://trade-api.gateway.uniswap.org/v1';

const ALLOWED_PATHS = ['quote', 'swap', 'order', 'check_approval', 'swaps', 'orders'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { endpoint, apiKey, payload } = body;

    if (!endpoint || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint or apiKey' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_PATHS.includes(endpoint)) {
      return new Response(
        JSON.stringify({ error: `Invalid endpoint: ${endpoint}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine HTTP method — swaps and orders status checks are GET
    const isStatusCheck = (endpoint === 'swaps' || endpoint === 'orders') && payload?.txHash;
    const method = isStatusCheck ? 'GET' : 'POST';

    let url = `${UNISWAP_API_BASE}/${endpoint}`;
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (method === 'GET' && payload) {
      const params = new URLSearchParams(payload);
      url += `?${params.toString()}`;
    } else if (method === 'POST' && payload) {
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Proxy error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
