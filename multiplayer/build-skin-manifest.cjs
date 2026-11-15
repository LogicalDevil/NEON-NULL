'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const radiant = require('./radiant-catalog.cjs');
const factionSkins = require('./faction-skin-catalog.cjs').items;
const source = fs.readFileSync(path.join(__dirname,'../work/neon-null.html'),'utf8').split('</template>').pop();
const skinsStart = source.indexOf('const weaponSkins=');
const skinsEnd = source.indexOf('const skinById=',skinsStart);
const operatorsStart = source.indexOf('const cosmeticCatalog=');
const operatorsEnd = source.indexOf('let progression=',operatorsStart);
if ([skinsStart,skinsEnd,operatorsStart,operatorsEnd].some(index=>index<0)) throw Error('Cosmetic catalog declarations not found');
const originals = vm.runInNewContext(source.slice(skinsStart,skinsEnd)+source.slice(operatorsStart,operatorsEnd)+';({weaponSkins,cosmeticCatalog})',{}, {timeout:500});
if (originals.weaponSkins.length !== 70 || Object.keys(originals.cosmeticCatalog).length !== 70) throw Error('Historical base catalog changed; audit additions before rebuilding');
const weaponSkins = [...originals.weaponSkins.map(item=>({...item})),...factionSkins.map(item=>({...item})),...radiant.weapons.map(item=>({...item}))];
const operators = {...originals.cosmeticCatalog,...Object.fromEntries(radiant.operators.map(item=>[item.id,{...item}]))};
radiant.assignOdds(weaponSkins);
const manifest = {operators:Object.keys(operators),skins:Object.fromEntries(weaponSkins.map(item=>[item.id,item.weaponIndex]))};
if (manifest.operators.length !== 140 || Object.keys(manifest.skins).length !== 160) throw Error('Radiant catalog count mismatch');
const cases = {weapon:radiant.casePool('weapon',weaponSkins,operators),operator:radiant.casePool('operator',weaponSkins,operators)};
for (const pool of Object.values(cases)) {
  if (Math.abs(pool.reduce((total,item)=>total+item.odds,0)-100)>1e-8) throw Error('Case odds must total 100%');
  if (new Set(pool.map(item=>item.id)).size !== pool.length) throw Error('Case contains duplicate stable IDs');
}
fs.writeFileSync(path.join(__dirname,'skin-manifest.json'),JSON.stringify(manifest,null,2));
fs.writeFileSync(path.join(__dirname,'case-catalog.json'),JSON.stringify(cases,null,2));
const audit = {
  version:'7.1',before:{weapons:90,operators:70},after:{weapons:160,operators:140},
  caseTierOdds:radiant.tierOdds,
  caseEligible:{weapons:cases.weapon.length,operators:cases.operator.length},
  weapons:weaponSkins.map(item=>({...item,kind:'weapon',unlockRoute:item.directOnly?'Direct scrap purchase':'Weapon case or direct scrap purchase'})),
  operators:Object.entries(operators).map(([id,item])=>({id,...item,kind:'operator',unlockRoute:item.cost>0?'Cosmetic case or direct scrap purchase':'Free starting operator'}))
};
fs.writeFileSync(path.join(__dirname,'../outputs/RADIANT-CATALOG-7.1.json'),JSON.stringify(audit,null,2));
const catalogRows=[...audit.weapons,...audit.operators];
const columns=['id','name','kind','rarity','cost','odds','weaponIndex','weaponId','weaponName','faction','collection','theme','variant','materials','finish','structure','animation','effect','unlockRoute'];
const csv=[columns,...catalogRows.map(item=>columns.map(column=>item[column]??''))].map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\r\n');
fs.writeFileSync(path.join(__dirname,'../outputs/RADIANT-CATALOG-7.1.csv'),csv);
console.log('Exported canonical cosmetic manifest:',manifest.operators.length,'operators,',Object.keys(manifest.skins).length,'weapon skins; case pools',cases.weapon.length,cases.operator.length);

const quote = value => "'" + String(value).replaceAll("'","''") + "'";
const rows = Object.values(cases).flat().map(item=>`(${quote(item.id)},${quote(item.kind)},${quote(item.name)},${quote(item.rarity)},${item.odds})`);
const sql = `-- NEON//NULL v7.1 Radiant case catalog. Run after supabase-profiles-gifts.sql.
-- Data-only refresh of existing catalog rows; grants, RLS and receipts are preserved.
begin;
insert into public.neon_case_catalog(id,kind,name,rarity,odds) values
${rows.join(',\n')}
on conflict(id) do update set kind=excluded.kind,name=excluded.name,rarity=excluded.rarity,odds=excluded.odds;
do $$
begin
  if (select count(*) from public.neon_case_catalog where kind='weapon') <> 140
     or (select count(*) from public.neon_case_catalog where kind='operator') <> 139 then
    raise exception 'Unexpected case catalog rows. Review custom rows before updating.';
  end if;
  if exists(select kind from public.neon_case_catalog group by kind having abs(sum(odds)-100)>0.000001) then
    raise exception 'Case probabilities must total 100 percent for each collection.';
  end if;
end $$;
commit;
select kind,count(*) as entries,sum(odds) as total_percent from public.neon_case_catalog group by kind order by kind;
`;
fs.writeFileSync(path.join(__dirname,'../outputs/supabase-radiant-cases.sql'),sql);
