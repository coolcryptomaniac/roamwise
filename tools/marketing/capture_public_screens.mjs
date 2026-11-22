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
 await page.waitForTimeout(3000);
 const shots=[
  ['ailon','copilotHero'],
  ['artists','rwSalesArtists'],
  ['weddings','rwSalesWeddings'],
  ['shop','rwSalesShop']
 ];
 for(const [name,id] of shots){
   const target=page.locator('#'+id);
   if(!await target.count()){console.log('missing section:',id);continue;}
   const visible=await target.isVisible();
   if(!visible){console.log('section hidden:',id);continue;}
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
