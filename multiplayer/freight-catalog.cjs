/* Freight encounter identities. Shared with the authoritative simulation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NeonFreightCatalog=api})(typeof window==='undefined'?globalThis:window,function(){'use strict';
 const types=[
 {id:'aegis-captain',name:'Aegis Captain',hp:32,speed:34,r:25,value:38,role:'Directional shield; flank during bash recovery.',warning:1.05,recovery:1.25},
 {id:'glassline-hunter',name:'Glassline Hunter',hp:18,speed:58,r:19,value:32,role:'Locked firing line, two shots, then relocation.',warning:1.1,recovery:1.2},
 {id:'forge-tender',name:'Forge Tender',hp:24,speed:35,r:23,value:35,role:'Repairs one living ally; interrupt its exposed repair window.',warning:1.2,recovery:1.1},
 {id:'yard-marshal',name:'The Yard Marshal',hp:180,speed:36,r:42,value:120,role:'Five-pattern freight commander. Disable communications to stop reinforcements.',warning:1.25,recovery:1.45,miniBoss:true}
 ];
 return {version:1,types,byId:id=>types.find(t=>t.id===id)||null,limits:{repairPerSecond:.5,repairLink:1,protectionLinks:2,maxConcurrentWarnings:2,maxReinforcements:3,temporaryCover:3}};
});
