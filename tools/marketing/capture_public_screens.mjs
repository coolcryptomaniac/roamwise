// Capture *real* public RoamWise screens; never generate mock controls, prices, or logins.
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';

const dir=resolve('build/play-console-2026/raw-screens');
mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:390,height:694},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 page.on('pageerror',err=>console.log('page-error:',String(err).slice(0,160)));
 const response=await page.goto('https://roamwise.co.in/',{waitUntil:'domcontentloaded',timeout:45000});
 console.log('Live homepage response:',response?.status());
 await page.waitForTimeout(2600);
 // The site's cinematic opening covers the real UI unless dismissed. Screenshots
 // must show genuine application content, never four identical intro frames.
 const skip=page.locator('#rwOpening .rw-skip');
 if(await skip.count() && await skip.isVisible()) await skip.click({timeout:5000});
 await page.locator('#rwOpening').waitFor({state:'hidden',timeout:14000}).catch(()=>{});
 if(await page.locator('#rwOpening').count() && await page.locator('#rwOpening').isVisible())
   throw new Error('Cinematic intro still covers UI: refusing misleading Play screenshots');
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
     if(el)window.scrollTo({top:Math.max(0,el.getBoundingClientRect().top+window.scrollY-116),behavior:'instant'});
   },id);
   await page.waitForTimeout(450);
   const path=resolve(dir,name+'.png');
   await page.screenshot({path,fullPage:false,animations:'disabled'});
   console.log('real browser capture:',name);
 }
}finally{await browser.close();}
