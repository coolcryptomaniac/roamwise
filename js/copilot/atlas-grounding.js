/* Public destination-only RoamWise knowledge context for Ailon models.
   Never send private chat, traveller data or booking history to this endpoint. */
function rwAtlasGroundGuide(dest,base){
        var g0=base;
        return Promise.resolve(g0).then(function(g){
          // Query the RoamWise-owned public atlas using just the destination,
          // never the traveller's personal itinerary, names or booking data.
          if(!dest||typeof rwTuskWorkerSearch!=='function')return g;
          var question='Travel guide to '+String(dest).slice(0,75)+' itinerary and food';
          if(typeof rwTuskIsPublicQuery!=='function'||!rwTuskIsPublicQuery(question))return g;
          var source={hits:[]};
          return Promise.resolve(rwTuskWorkerSearch(question,source)).then(function(){
            var a=source.atlas;if(!a)return g;
            var context='RoamWise '+(a.status==='source-backed-overview'?'source-backed overview':'editorial travel ideas (not verified facts)')+' for '+a.name+': ';
            context+='Attractions: '+(a.highlights||[]).join(', ')+'. ';
            context+='Suggested itinerary: '+(a.itinerary||[]).map(function(d){return 'Day '+d.day+' '+d.description;}).join(' / ')+'. ';
            context+='Regional food ideas: '+(a.food||[]).join(', ')+'. ';
            if(a.status==='source-backed-overview')context+='Sourced background: '+(a.facts||[]).join(' ')+'. ';
            context+='No verified real-time pricing, openings, traffic or confirmed reservations. Photo references lack commercial usage clearance.';
            return Object.assign({},g||{},{_rwAtlasContext:context.slice(0,1800)});
          }).catch(function(){return g;});
        });
      }
