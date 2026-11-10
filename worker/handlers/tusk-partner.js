const headers={'Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'};
export function handleTuskCapabilities(request){
 if(request.method!=='GET')return new Response('Method not allowed',{status:405});
 return Response.json({name:'Ailon Tusk by RoamWise',integration:'read_only_openapi_discovery',capabilities:['travel_discovery','concise_cards','booking_handoff'],booking:{publicCreateOrder:false,requiresAuthenticatedVerifiedCheckout:true},status:'not_installed_as_chatgpt_app'}, {headers});
}
export function handleTuskOpenApi(request){
 if(request.method!=='GET')return new Response('Method not allowed',{status:405});
 return Response.json({openapi:'3.1.0',info:{title:'Ailon Tusk Partner Discovery',version:'0.1.0'},servers:[{url:'https://api.roamwise.co.in'}],paths:{'/tusk/capabilities':{get:{operationId:'getTuskCapabilities',responses:{'200':{description:'Capabilities'}}}},'/tusk/openapi.json':{get:{operationId:'getTuskOpenApi',responses:{'200':{description:'OpenAPI'}}}}}}, {headers});
}