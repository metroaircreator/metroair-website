export function onRequest(context) {
  const { env } = context;
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
