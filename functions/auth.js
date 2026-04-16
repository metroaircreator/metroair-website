export async function onRequest(context) {
  const { env } = context;

  if (!env.GITHUB_CLIENT_ID) {
    return new Response('Missing GITHUB_CLIENT_ID environment variable', { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    scope: 'repo',
    redirect_uri: env.OAUTH_CALLBACK_URL,
  });

  return Response.redirect(
    'https://github.com/login/oauth/authorize?' + params.toString(),
    302
  );
}
