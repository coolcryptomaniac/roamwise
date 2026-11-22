/* OpenAI Plugins domain verification.
 * The challenge token is PUBLIC by design: the platform verifies ownership
 * by fetching exactly this plain-text value at the public HTTPS endpoint.
 * Rotate it via OPENAI_APPS_CHALLENGE_TOKEN if the dashboard issues a new one.
 * Do not use this endpoint for authentication, secrets or private account data.
 */
export const DEFAULT_OPENAI_APPS_CHALLENGE='zW7Q6A_aJzxxiLSyCOKhxrWV4RfwXYg9Fr9_AjbOeIE';
export function handleOpenAIAppsChallenge(request,env={}){
 const headers={
  'Content-Type':'text/plain; charset=utf-8',
  'Cache-Control':'no-store, max-age=0',
  'X-Content-Type-Options':'nosniff',
  'X-Robots-Tag':'noindex'
 };
 if(request.method!=='GET'&&request.method!=='HEAD')
  return new Response('Method not allowed',{status:405,headers:{...headers,Allow:'GET, HEAD'}});
 const configured=env.OPENAI_APPS_CHALLENGE_TOKEN;
 const token=typeof configured==='string'&&/^[A-Za-z0-9_-]{20,128}$/.test(configured)
  ?configured:DEFAULT_OPENAI_APPS_CHALLENGE;
 return new Response(request.method==='HEAD'?null:token,{status:200,headers});
}
