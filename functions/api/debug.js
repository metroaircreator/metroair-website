export async function onRequest(context) {
  const { env } = context;
  return new Response(JSON.stringify({
    has_client_id: !!env.GITHUB_CLIENT_ID,
    has_client_secret: !!env.GITHUB_CLIENT_SECRET,
    has_callback_url: !!env.OAUTH_CALLBACK_URL,
    callback_url: env.OAUTH_CALLBACK_URL || 'not set',
    env_keys: Object.keys(env),
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}
