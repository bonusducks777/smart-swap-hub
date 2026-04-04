const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const UNISWAP_API_BASE = 'https://trade-api.gateway.uniswap.org/v1';
const ALLOWED_PATHS = ['quote', 'swap', 'order', 'check_approval', 'swaps', 'orders'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { endpoint, apiKey, payload } = body;

    if (!endpoint || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint or apiKey' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_PATHS.includes(endpoint)) {
      return new Response(
        JSON.stringify({ error: `Invalid endpoint: ${endpoint}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Always return 200 to the client so supabase.functions.invoke doesn't treat it as an error.
    // Include the upstream status so the client can check it.
    const wrapped = JSON.stringify({
      _upstreamStatus: response.status,
      _body: data ? JSON.parse(data) : null,
    });

    return new Response(wrapped, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Proxy error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
