'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../work/account-save.js'),'utf8');
const storage=initial=>{const values=new Map(Object.entries(initial));return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key),values}};
async function check(remember){
 const project='https://account-test.supabase.co',old={project,access_token:'expired',refresh_token:'old-refresh',expires_at:1,user:{id:'mock-user'}};
 const local=storage({'nn.cloud.config':JSON.stringify({url:project,key:'sb_publishable_test'}),...(remember?{'nn.remembered.session':JSON.stringify(old)}:{})});
 const tab=storage(remember?{}:{'nn.session':JSON.stringify(old)}),window={};let refreshes=0;
 const fetch=async(url,request)=>{assert.equal(url,project+'/auth/v1/token?grant_type=refresh_token');assert.equal(JSON.parse(request.body).refresh_token,'old-refresh');refreshes++;await new Promise(resolve=>setTimeout(resolve,15));return{ok:true,text:async()=>JSON.stringify({access_token:'new-access',refresh_token:'rotated-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'mock-user'}})}};
 vm.runInNewContext(source,{window,localStorage:local,sessionStorage:tab,fetch,AbortController,setTimeout,clearTimeout,document:{getElementById:()=>null},console,URL,Map,Date});
 const tokens=await Promise.all([window.NeonSave.accessToken(),window.NeonSave.accessToken(),window.NeonSave.accessToken()]);
 assert.deepEqual(tokens,['new-access','new-access','new-access']);assert.equal(refreshes,1,'Concurrent cloud/profile/co-op requests must share one refresh');
 assert.equal(JSON.parse((remember?local:tab).getItem(remember?'nn.remembered.session':'nn.session')).refresh_token,'rotated-refresh');
 assert.equal((remember?tab:local).getItem(remember?'nn.session':'nn.remembered.session'),null,'Session storage scope must remain unchanged');
}
(async()=>{await check(false);await check(true);console.log('PASS account session refresh: concurrent callers share one refresh, rotated tokens persist in tab or remembered scope, no live credentials used')})().catch(error=>{console.error(error);process.exitCode=1});
