const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../work/neon-null.html'),'utf8').split('</template>').pop();
const arrays=['weapons','secondaryWeapons','meleeWeapons','utilityItems'].map(name=>vm.runInNewContext('('+source.match(new RegExp('const '+name+'=(\\[.*?\\]);','s'))[1]+')',{}, {timeout:100}));
const profiles=JSON.parse(source.match(/ammoProfiles=(\[\[.*?\]\]);/)[1]);let ranged=0;
const catalog=arrays.map((items,slot)=>Array.from(items,item=>{const profile=slot<2?profiles[ranged++]:null;return {name:item.name,kind:item.kind,damage:item.dmg||item.damage||1,rate:item.rate||item.cooldown||.4,cooldown:item.cooldown||item.rate||.4,speed:item.speed||500,spread:item.spread||1,reach:item.reach||60,arc:item.arc||1,...(profile?{mag:profile[0],magSize:profile[0],reserve:profile[1],reserveMax:profile[1],reloadTime:profile[2]}:{})}}));
fs.writeFileSync(path.join(__dirname,'catalog.json'),JSON.stringify(catalog,null,2));console.log('Exported',catalog.map(a=>a.length).join('/'),'co-op items');
