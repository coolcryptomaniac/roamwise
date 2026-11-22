// Capture *real* public RoamWise screens; never generate mock controls, prices, or logins.
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';

const dir=resolve('build/play-console-2026/raw-screens');
mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:390,height:694},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 // The public app's first-run welcome walkthrough obscures commerce.
 // Suppress it only in this isolated screenshot browser; production is unchanged.
 await page.addInitScript(()=>{
   try{localStorage.setItem('rw_onboarded','1');localStorage.setItem('rw_prevday',new Date().toDateString());sessionStorage.setItem('rw_intro','1');}catch(e){}
 });
 page.on('pageerror',err=>console.log('page-error:',String(err).slice(0,160)));
 const response=await page.goto('https://roamwise.co.in/',{waitUntil:'domcontentloaded',timeout:45000});
 console.log('Live homepage response:',response?.status());
 await page.waitForTimeout(2600);
 // The site's cinematic opening covers the real UI unless dismissed. Screenshots
 // must show genuine application content, never four identical intro frames.
 const skip=page.locator('#rwOpening .rw-skip');
 if(await skip.count() && await skip.isVisible()) await skip.click({timeout:5000});
 // Simulate a traveller tapping Skip. If the cinematic teardown stalls in CI,
 // remove *only* the overlay from this isolated browser's DOM; public app stays unchanged.
 await page.locator('#rwOpening').waitFor({state:'hidden',timeout:1800}).catch(()=>{});
 await page.evaluate(()=>{
   const ov=document.getElementById('rwOpening');
   if(ov){ov.querySelector('.rw-skip')?.click();ov.remove();}
 });
 if(await page.locator('#rwOpening').count() && await page.locator('#rwOpening').isVisible())
   throw new Error('Cinematic intro still covers UI: refusing misleading Play screenshots');
 const onboarding=page.locator('#rwOnboardOv.open');
 if(await onboarding.count() && await onboarding.isVisible()){
   await onboarding.locator('button[onclick*="rwOnboardDone"]').first().click({timeout:5000});
 }
 if(await page.locator('#rwOnboardOv.open').count() && await page.locator('#rwOnboardOv.open').isVisible())
   throw new Error('Onboarding walkthrough still covers UI: refusing misleading Play screenshots');
 await page.waitForTimeout(750);
 const shots=[
  ['ailon','copilotHero'],
  ['artists','rwSalesArtists'],
  ['weddings','rwSalesWeddings'],
  ['shop','rwSalesShop']
 ];
 for(const [name,id] of shots){
   const target=page.locator('#'+id);
   if(!await target.count())throw new Error('Missing section: '+id);
   const visible=await target.isVisible();
   if(!visible)throw new Error('Hidden section: '+id);
   await page.evaluate((targetId)=>{
     const el=document.getElementById(targetId);
     if(!el)return;
     let start=el;
     if(targetId!=='copilotHero'){
       let prior=el.previousElementSibling;
       while(prior && !prior.classList.contains('rw-trackheading')) prior=prior.previousElementSibling;
       if(prior)start=prior; // Include the real collection title, not a cut-off paragraph.
     }
     window.scrollTo({top:Math.max(0,start.getBoundingClientRect().top+window.scrollY-72),behavior:'instant'});
   },id);
   await page.waitForTimeout(450);
   const path=resolve(dir,name+'.png');
   await page.screenshot({path,fullPage:false,animations:'disabled'});
   console.log('real browser capture:',name);
 }
}finally{await browser.close();}
