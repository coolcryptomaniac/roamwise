import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {isPublicPartner,tierOf} from '../map/map-core.mjs';

const read = p => fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('premium Ailon and cards are retained and mobile header gives Settings a distinct action',()=>{
 const home=read('index.html'),css=read('design/home-mobile-recovery.css'),js=read('js/ui/home-mobile-recovery.js');
 assert.match(home,/id="copilotHero"/);
 assert.match(home,/id="rwSettingsShortcut"/);
 assert.match(css,/#rwSettingsShortcut\{display:inline-flex!important/);
 assert.match(css,/#copilotHero #heroInput/);
 assert.match(css,/#rwSalesCarousels \.rw-sales-card/);
 assert.match(js,/link\.toggleAttribute\('hidden',visible\)/);
 assert.match(home,/home-mobile-recovery\.js/);
 assert.match(home,/home-mobile-recovery\.css/);
});
test('home has useful partner self-registration, founder, corporate and visible group actions',()=>{
 const home=read('index.html'),quick=read('js/ui/home-quick-access.js');
 for(const s of ['/partner/join/','/creators/join-artist.html','/corporate/','/local-business/','/network/match/','/pricing.html','/about.html'])
   assert.ok(home.includes(s),s);
 assert.match(home,/id="rwPartnerFrontdoors"/);
 assert.match(quick,/label: 'Group chat'/);
 assert.match(quick,/label: 'Group planning'/);
 assert.match(quick,/label: 'TrailMesh'/);
 assert.match(home,/id="rwHomeFooter"/);
});
test('MOU-checked self-listings survive Firestore merge into the app directory',()=>{
 const source=read('js/misc/partners.js');
 const win={RW_PARTNER_SEED:[],rwStayPublicEligible:p=>p?.listingReady===true && (
  p?.verified==='signed'||(p?.verified==='self-listed'&&p?.enquiryOnly===true&&p?.selfListed?.mouVersion==='RW-PMOU-2026-09-27-V4')
 )};
 const ctx={window:win,lsGet:()=>'',lsSet:()=>{},document:{},console};vm.createContext(ctx);vm.runInContext(source,ctx);
 const ready={id:'p_x',cat:'stay',zone:'Almora',name:'Test Homestay',verified:'self-listed',listingReady:true,enquiryOnly:true,selfListed:{mouVersion:'RW-PMOU-2026-09-27-V4'}};
 assert.equal(ctx.rwPartnersMerge([ready]).length,1);
 assert.equal(ctx.rwPartnersMerge([{...ready,enquiryOnly:false}]).length,0);
});
test('stay cards draw self-listed public MOU records from live Firestore source without paid route',()=>{
 const source=read('partner/stays-hub.js');
 assert.match(source,/root\.RW_PARTNERS/);
 assert.match(source,/RW_STAYS_PUBLIC_LIVE/);
 assert.match(source,/selfListed\.mouVersion===\x27RW-PMOU-2026-09-27-V4\x27/);
 assert.match(source,/dynamic\.concat\(seed\)/);
 assert.match(source,/p\.enquiryOnly\?\{\}:live\[p\.id\]/);
 assert.match(source,/Enquiry only/);
 const good={cat:'stay',name:'Test',zone:'Almora',verified:'self-listed',enquiryOnly:true,listingReady:true,selfListed:{mouVersion:'RW-PMOU-2026-09-27-V4'}};
 assert.equal(isPublicPartner(good),true);
 assert.equal(tierOf(good).enquiryOnly,true);
 assert.equal(tierOf(good).label,'New on RoamWise');
 assert.equal(isPublicPartner({...good,enquiryOnly:false}),false);
 assert.equal(isPublicPartner({...good,selfListed:null}),false);
});
