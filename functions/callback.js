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
  const token = JSON.stringify(content);
  const html = `<!DOCTYPE html>
<html>
<body>
<script>
(function() {
  function receiveMessage(e) {
    window.removeEventListener('message', receiveMessage, false);
    window.opener.postMessage(
      'authorization:github:${status}:${token}',
      e.origin
    );
    setTimeout(function(){ window.close(); }, 1000);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
<\/script>
<p style="font-family:sans-serif;padding:20px;">Authenticating...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cross-Origin-Opener-Policy': 'unsafe-none'
    }
  });
}
