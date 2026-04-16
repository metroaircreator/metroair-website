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
        // Try postMessage first
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage(msg, '*');
          } catch(e) {}
        }
        // Also store in localStorage as fallback
        try {
          localStorage.setItem('decap-cms-auth', msg);
          localStorage.setItem('decap-cms-auth-ts', Date.now().toString());
        } catch(e) {}
        setTimeout(function(){ window.close(); }, 500);
      })();
    <\/script><p style="font-family:sans-serif;padding:20px;">Authenticating...</p></body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}
