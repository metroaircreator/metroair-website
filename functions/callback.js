export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return sendResult('error', { message: 'No code received from GitHub' });
  }

  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await res.json();

    if (data.error || !data.access_token) {
      return sendResult('error', { message: data.error_description || 'Auth failed' });
    }

    return sendResult('success', { token: data.access_token, provider: 'github' });
  } catch (e) {
    return sendResult('error', { message: e.message });
  }
}

function sendResult(status, content) {
  const msg = `authorization:github:${status}:${JSON.stringify(content)}`;
  return new Response(
    `<!DOCTYPE html><html><body><script>
      (function() {
        var msg = ${JSON.stringify(msg)};
        // 1) postMessage (works if opener not severed by COOP)
        if (window.opener && !window.opener.closed) {
          try { window.opener.postMessage(msg, '*'); } catch(e) {}
        }
        // 2) BroadcastChannel (reliable same-origin cross-tab)
        try {
          var bc = new BroadcastChannel('decap-cms-auth');
          bc.postMessage(msg);
          bc.close();
        } catch(e) {}
        // 3) localStorage polling fallback
        try {
          localStorage.setItem('decap-cms-auth', msg);
          localStorage.setItem('decap-cms-auth-ts', Date.now().toString());
        } catch(e) {}
        setTimeout(function(){ window.close(); }, 3000);
      })();
    <\/script><p style="font-family:sans-serif;padding:20px;">Authenticating...</p></body></html>`,
    { headers: { 
        'Content-Type': 'text/html',
        'Cross-Origin-Opener-Policy': 'unsafe-none' } }
  );
}
