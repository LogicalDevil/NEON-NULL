/* Public pilot cards, server-issued gifts and accepted-friend presence. */
(()=>{'use strict';
let bridge,panel,resume,previousFocus,epoch=0,activeTarget=null,card=null,avatar='preset:0',busy=false,pulseBusy=false,pulseTimer=0,lastPulse=0,pendingGift=null,giftDraft=null,searchEpoch=0,wallet={weapon:0,operator:0};
const $=id=>panel.querySelector('#np-'+id),api=(a,p={})=>window.NeonSave.profile(a,p),uid=()=>window.NeonSave?.session()?.user?.id,shown=()=>!!panel&&!panel.hidden;
const node=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n},button=(text,fn)=>{const b=node('button',text,'btn');b.type='button';b.onclick=fn;return b};
const label=s=>({ingame:'In Game',online:'Online',offline:'Offline',hidden:'Status Private'})[s]||'Status Unavailable';
function message(text){$('status').textContent=text}
async function perform(fn){if(busy)return;busy=true;controls();try{await fn()}catch(e){message(e.message||'Request failed')}finally{busy=false;controls()}}
function controls(){if(!panel)return;for(const b of panel.querySelectorAll('button,input,textarea,select'))b.disabled=busy;$('close').disabled=busy;for(const kind of ['weapon','operator'])$('open-'+kind).disabled=busy||!wallet[kind]}
function drawAvatar(host,value){host.replaceChildren();if(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value||'')&&value.length<=65536){const img=document.createElement('img');img.src=value;img.alt='Pilot profile picture';host.append(img)}else{const symbols=['◈','◉','⬡','✦','⌁','▲','✧','⊞'];host.textContent=symbols[Number(String(value).split(':')[1])%8]||symbols[0]}}
async function load(target){const turn=++epoch;message('Loading pilot profile…');$('body').hidden=true;$('inbox').hidden=true;card=null;giftDraft=null;$('gift-confirmation').hidden=true;const result=await api('get',target?{target}:{});if(turn!==epoch||!shown())return;card=result;avatar=result.avatar;activeTarget=result.id;$('name').textContent='@'+result.username;$('presence').textContent=label(result.presence)+(result.mode&&result.presence==='ingame'?' · '+result.mode:'');$('bio').textContent=result.description||'No pilot description yet.';$('scrap').textContent=result.scrap===null?'Scrap balance private':Number(result.scrap).toLocaleString()+' banked scrap · cloud-saved balance';drawAvatar($('avatar'),avatar);$('badges').replaceChildren(...(result.badges||[]).map(b=>node('span',b,'np-badge')));$('editor').hidden=!result.own;$('gift-form').hidden=result.own;$('gift-fields').hidden=true;$('gift-status').textContent='Checking developer gifting access…';$('description').value=result.description||'';$('show-scrap').checked=result.show_scrap;$('body').hidden=false;message(result.own?'Your profile is visible to discoverable players and accepted friends.':'Pilot profile');if(result.own)await inbox(turn);else await verifyGifting(turn)}
async function open(target,section){if(!panel)return;if(!shown()){previousFocus=document.activeElement;resume=bridge.suspend?.();panel.hidden=false;$('close').focus()}if(!uid()){message('Sign in through Accounts & Saves to use profiles and gifts.');$('body').hidden=true;$('inbox').hidden=true;return}try{await load(target);if(section==='gifts'&&shown()&&!$('inbox').hidden){$('inbox').scrollIntoView({block:'start'});$('inbox').focus()}}catch(e){message(e.message)}}
function close(){if(!panel||busy)return;epoch++;searchEpoch++;panel.hidden=true;resume?.();resume=null;previousFocus?.focus?.();window.dispatchEvent(new Event('nn:menu-focus'))}
async function inbox(turn=epoch){
  const data=await api('inbox');
  if(turn!==epoch||!shown())return;
  wallet={weapon:data.weapon,operator:data.operator};
  $('inbox').hidden=false;
  $('wallet').textContent=`Gift inventory · ${data.weapon} weapon cases · ${data.operator} cosmetics crates`;
  const available=$('gifts'),history=$('gift-history');
  available.replaceChildren();
  history.replaceChildren();
  const gifts=data.gifts||[];
  for(const gift of gifts){
    const row=node('article','','np-gift');
    row.append(node('strong',`${gift.quantity} ${gift.kind==='weapon'?'weapon cases':'cosmetics crates'} from @${gift.sender}`),node('p',gift.note||''));
    if(gift.claimed){
      row.append(node('small','Claimed'));
      history.append(row);
      continue;
    }
    const claim=button('Claim Gift',()=>perform(async()=>{
      await api('claim',{id:gift.id});
      await inbox();
      message('Gift claimed. Open your cases below.');
    }));
    claim.classList.add('btn-primary');
    row.append(claim);
    available.append(row);
  }
  const count=gifts.filter(gift=>!gift.claimed).length;
  $('gift-history-panel').hidden=!history.childElementCount;
  if(!count)available.append(node('p','You have no unclaimed gifts.','np-empty'));
  publishGiftCount(count);
  controls();
}
function publishGiftCount(count){
  for(const entry of document.querySelectorAll('[data-neon-gifts]')){
    entry.textContent=entry.dataset.neonGifts+(count?' · '+count:'');
  }
}
async function refreshGiftCount(){
  const account=uid();
  if(!account){publishGiftCount(0);return}
  try{
    const result=await api('inbox');
    if(uid()===account)publishGiftCount((result.gifts||[]).filter(gift=>!gift.claimed).length);
  }catch{/* Opening the inbox shows the service error. */}
}
async function upload(file){if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024)throw Error('Choose a PNG, JPEG or WebP picture under 2 MB');const image=await createImageBitmap(file);try{if(image.width>8192||image.height>8192)throw Error('Picture dimensions are too large');const c=document.createElement('canvas');c.width=c.height=128;const size=Math.min(image.width,image.height);c.getContext('2d').drawImage(image,(image.width-size)/2,(image.height-size)/2,size,size,0,0,128,128);const value=c.toDataURL('image/png');if(value.length>65536)throw Error('Picture is too detailed. Choose a simpler image.');avatar=value;drawAvatar($('avatar'),avatar);message('Picture ready. Save Profile to publish it.')}finally{image.close()}}
async function giftRequest(data,action='gift'){
  const raw=document.getElementById('nd-server')?.value.trim()||document.getElementById('nc-url')?.value.trim()||location.origin;
  let server;
  try{server=new URL(raw)}catch{throw Error('Enter the game server URL in Developer Studio.')}
  if(server.protocol!=='https:'&&!(server.protocol==='http:'&&['localhost','127.0.0.1'].includes(server.hostname)))throw Error('Set your HTTPS server URL in Developer Studio first');
  if(server.username||server.password||server.search||server.hash||server.pathname!=='/')throw Error('Use the game server origin only');

  const token=await window.NeonSave.accessToken();
  let response;
  try{
    response=await fetch(server.origin+'/api/developer/'+action,{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
      body:JSON.stringify(data),
      signal:AbortSignal.timeout(10000)
    });
  }catch(error){
    if(error.name==='TimeoutError')throw Error('The game server timed out. Open '+server.origin+'/health and retry once it responds.');
    if(!(error instanceof TypeError))throw error;
    if(location.origin!==server.origin){
      const error=Error('The gift server could not be reached from this page. Open the hosted game and sign in there.');
      error.hostedGame=server.origin;
      throw error;
    }
    throw Error('Could not reach the gift service. Check '+server.origin+'/health and confirm the Render deployment is live.');
  }

  let result;
  try{result=await response.json()}catch{throw Error('This server does not provide the gifting API. Deploy the updated multiplayer folder to Render and check the game server URL.')}
  if(!response.ok)throw Error(result.error||'Gift service unavailable');
  return result;
}
async function verifyGifting(turn=epoch){$('hosted-game').hidden=true;$('gift-fields').hidden=true;$('gift-status').textContent='Verifying your account on the game server…';try{const result=await giftRequest({},'access');if(turn!==epoch||!shown()||card?.own)return;if(!result.granted)throw Error('Developer access was not granted');if(result.giftingConfigured===false)throw Error('Developer access verified. Add SUPABASE_SERVICE_ROLE_KEY to the Render service environment to enable gifting.');$('gift-fields').hidden=false;$('gift-status').textContent='Developer access verified. Choose a case type and quantity below.'}catch(error){if(turn!==epoch||!shown())return;if(error.hostedGame){$('hosted-game').href=error.hostedGame;$('hosted-game').hidden=false}$('gift-status').textContent=error.name==='TimeoutError'?'Server timed out. Check the server URL in Developer Studio, then retry.':error.message||'Could not verify gifting access'}}
async function pulse(force=false,offline=false){if(!uid()||pulseBusy||(!force&&Date.now()-lastPulse<24000))return;lastPulse=Date.now();pulseBusy=true;try{const current=bridge.presence?.()||{state:'online',mode:''};await api('pulse',offline||document.hidden?{state:'offline'}:current)}catch{/* Missing migration/network does not interrupt play; presence expires. */}finally{pulseBusy=false}}
function init(options){bridge=options;panel=document.createElement('section');panel.id='np-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','np-title');panel.innerHTML=`<div class="np-shell"><header><h2 id="np-title">Pilot Profile</h2><button class="btn" id="np-mine">My Profile & Gifts</button><button class="btn" id="np-refresh">Refresh</button><button class="btn" id="np-close">Back</button></header><button class="btn btn-primary" id="np-signin">Sign In / Switch Account</button><p id="np-status" role="status" aria-live="polite"></p><section id="np-body" hidden><div class="np-card"><div id="np-avatar" class="np-avatar"></div><div><h3 id="np-name"></h3><span id="np-presence"></span><p id="np-bio"></p><p id="np-scrap"></p><div id="np-badges"></div></div></div><details id="np-editor"><summary>Edit Profile</summary><label>Profile picture · cropped to 128 × 128<input id="np-file" type="file" accept="image/png,image/jpeg,image/webp"></label><div id="np-presets"></div><label>Description · 280 characters<textarea id="np-description" maxlength="280" rows="4" class="form-control"></textarea></label><label><input id="np-show-scrap" type="checkbox"> Show cloud-saved scrap on my profile</label><button class="btn btn-primary" id="np-save" data-profile-action>Save Profile</button><p class="text-small">Badges reflect saved milestones. Presence sharing is optional in Social → Settings. Only accepted friends can see your activity.</p></details><section id="np-gift-form" hidden><h3>Developer Gift</h3><p id="np-gift-status" role="status"></p><a class="btn" id="np-hosted-game" target="_blank" rel="noopener noreferrer" hidden>Open Hosted Game</a><button class="btn" id="np-gift-verify">Verify Developer Access for Gifting</button><div id="np-gift-fields" hidden><label>Case type<select id="np-kind"><option value="weapon">Weapon skin case</option><option value="operator">Cosmetics crate</option></select></label><label>Quantity · 1–100<input id="np-quantity" type="number" min="1" max="100" value="1"></label><label>Gift message<input id="np-note" maxlength="160" class="form-control"></label><button class="btn btn-primary" id="np-send">Review Gift</button><div id="np-gift-confirmation" class="np-confirmation" hidden><div id="np-confirm-avatar" class="np-avatar"></div><div><h4 id="np-confirm-name"></h4><p id="np-confirm-summary"></p><p id="np-confirm-note"></p><button class="btn btn-primary" id="np-confirm-send">Send Gift</button><button class="btn" id="np-confirm-cancel">Edit Gift</button></div></div><p class="text-small">Server-authorized developers only. Limit: 1,000 cases per developer per 24 hours. Retries reuse the same gift ID.</p></div></section></section><section id="np-inbox" tabindex="-1" hidden><h3>Gift Inbox</h3><p id="np-wallet"></p><div class="np-actions"><button class="btn" id="np-open-weapon" data-profile-action>Open Gifted Weapon Case</button><button class="btn" id="np-open-operator" data-profile-action>Open Gifted Cosmetics Crate</button></div><p class="text-small">Gift cases use the normal case odds, cost no scrap, and grant collection ownership. Duplicate gifts give no scrap refund. Open them from the main menu.</p><div id="np-gifts"></div><details id="np-gift-history-panel" hidden><summary>Claimed history</summary><div id="np-gift-history"></div></details></section></div>`;options.root.append(panel);
const style=node('style');style.textContent=`#np-panel{position:fixed;inset:0;overflow:auto;z-index:16000;background:#edf3f6;color:#244053;padding:clamp(12px,3vw,32px);box-sizing:border-box}#np-panel[hidden],#np-panel [hidden]{display:none!important}.np-shell{max-width:980px;margin:auto}#np-panel header,.np-actions,#np-presets{display:flex;gap:10px;flex-wrap:wrap;align-items:center}#np-panel h2{margin-right:auto}#np-panel section,#np-editor{margin:18px 0;padding:20px;background:#fff;border:1px solid #bdcdd8;border-radius:12px}.np-card{display:flex;gap:24px;align-items:center}.np-avatar{width:128px;height:128px;flex-shrink:0;border-radius:16px;background:#233f50;color:#dcc38c;font:72px 'NN Chakra',sans-serif;display:grid;place-items:center;overflow:hidden}.np-avatar img{width:100%;height:100%;object-fit:cover}#np-bio,.np-gift p{white-space:pre-wrap;overflow-wrap:anywhere}#np-panel label{display:block;margin:14px 0;font-size:14px}#np-panel input[type=number],#np-panel select{padding:10px}.np-badge{display:inline-block;padding:5px 10px;margin:4px;border:1px solid #ac9156;background:#f6f0e2;border-radius:6px;font-size:12px}.np-gift{padding:16px 0;border-top:1px solid #d1dbe2}#np-panel summary{cursor:pointer;font-weight:600}#np-description{resize:vertical}@media(max-width:520px){.np-card{align-items:flex-start;flex-direction:column}#np-panel section{padding:12px}}`;options.root.append(style);
for(let i=0;i<8;i++)$('presets').append(button('Avatar '+(i+1),()=>{avatar='preset:'+i;drawAvatar($('avatar'),avatar)}));$('signin').onclick=()=>window.NeonSave.switchAccount();$('close').onclick=close;$('mine').onclick=()=>open();$('refresh').onclick=()=>open(activeTarget);$('file').onchange=e=>perform(()=>upload(e.target.files[0]));$('save').onclick=()=>perform(async()=>{if(!card?.own)throw Error('Edit your own profile only');await api('update',{avatar,description:$('description').value,show_scrap:$('show-scrap').checked});await load();message('Profile saved.');});
$('gift-verify').onclick=()=>perform(()=>verifyGifting());$('send').onclick=()=>{
  const quantity=Number($('quantity').value);
  if(!card||card.own||!activeTarget){message('Open another pilot’s profile first');return}
  if(!Number.isInteger(quantity)||quantity<1||quantity>100){message('Choose 1–100 cases');return}
  giftDraft={target:activeTarget,kind:$('kind').value,quantity,note:$('note').value};
  drawAvatar($('confirm-avatar'),card.avatar);
  $('confirm-name').textContent='Send to @'+card.username;
  $('confirm-summary').textContent=quantity+(giftDraft.kind==='weapon'?' weapon skin case(s)':' cosmetics crate(s)');
  $('confirm-note').textContent=giftDraft.note;
  $('confirm-send').textContent='Send Gift';
  $('gift-confirmation').hidden=false;
  $('confirm-send').focus();
};
$('confirm-cancel').onclick=()=>{
  $('gift-confirmation').hidden=true;
  giftDraft=null;
  $('send').focus();
};
$('confirm-send').onclick=()=>perform(async()=>{
  if(!giftDraft||giftDraft.target!==activeTarget)throw Error('Review the gift before sending');
  const signature=JSON.stringify([uid(),giftDraft]);
  if(!pendingGift||pendingGift.signature!==signature)pendingGift={signature,requestId:crypto.randomUUID()};
  $('confirm-send').textContent='Sending…';
  message('Sending gift…');
  try{
    const receipt=await giftRequest({...giftDraft,requestId:pendingGift.requestId});
    if(!receipt.ok)throw Error('The server did not confirm delivery. Retry this gift.');
  }catch(error){
    $('confirm-send').textContent='Retry Send';
    throw error;
  }
  pendingGift=null;
  giftDraft=null;
  $('gift-confirmation').hidden=true;
  $('note').value='';
  message('Gift sent. The recipient can claim it in My Profile & Gifts.');
});
for(const kind of ['weapon','operator'])$('open-'+kind).onclick=()=>perform(async()=>{const reward=await window.NeonSave.openGiftCase(kind);await inbox();message(`${reward.reward.rarity} · ${reward.reward.name}${reward.duplicate?' · already owned':' · added to your collection'}`)});
const addEntry=parent=>{if(!parent)return;const entry=button('My Profile & Gifts',()=>open());entry.dataset.neonGifts='My Profile & Gifts';parent.append(entry)};addEntry(document.querySelector('#wb-menu .menu-actions'));addEntry(document.getElementById('nn-account-panel'));addEntry(document.getElementById('nn-settings-username'));refreshGiftCount();
panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'){const nodes=[...panel.querySelectorAll('button,input,textarea,select,summary')].filter(n=>!n.disabled&&n.getClientRects().length),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}});panel.addEventListener('keyup',e=>e.stopPropagation());
pulseTimer=setInterval(()=>pulse(),25000);setTimeout(()=>pulse(),2000);document.addEventListener('visibilitychange',()=>pulse(false,document.hidden));window.addEventListener('nn:social-settings',()=>pulse(true));window.addEventListener('nn:account-leaving',()=>{clearInterval(pulseTimer);epoch++;});window.addEventListener('pagehide',()=>{clearInterval(pulseTimer);epoch++;});}
window.NeonProfiles={init,open,close,isOpen:shown,refreshGiftCount,presenceLabel:label,pulse,stats:()=>({open:shown(),busy,heartbeat:!!pulseTimer})};
})();
