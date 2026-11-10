/* Rebuild Capacitor webDir from tracked public web assets, never stale www.
 * Requires git; excludes secrets, admin tooling, worker code and native sources.
 */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'www');
const dirs=['partner','properties','transport','experiences','travel','trips','creator','payments','support','staff','public','data','locales','i18n','shop','embed','packages','treks','music','js','css','assets','images','fonts','icons','creators','partners','nomads','books','kainchi','events','maps','stay','stays','rooms','booking','artist','artists','features','platform-v5','nmims','pilgrimage','weddings','privacy','terms','pro','wallet','auth','legal','offline','manifest'];
const rootExt=/\.(?:html|css|js|mjs|json|png|jpg|jpeg|webp|svg|gif|ico|woff2?|ttf|webmanifest|txt|xml)$/i;
const files=cp.execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'buffer'}).toString('utf8').split('\0').filter(Boolean);
const allow=f=>{const parts=f.split('/');if(parts.some(x=>x.startsWith('.')||x==='node_modules'||x==='www'))return false;if(parts.length===1)return rootExt.test(f)&&!/(?:package|lock|capacitor|firebase|firestore|tsconfig|eslint|wrangler|service-account|credentials|secret|test|config\.local)/i.test(f);return dirs.includes(parts[0])&&!/(?:\.test\.|\.spec\.|\.env|secret|credentials|service-account)/i.test(f);};
const selected=files.filter(allow).filter(f=>fs.existsSync(path.join(root,f))&&fs.statSync(path.join(root,f)).isFile());
if(!selected.includes('index.html'))throw Error('index.html missing');
fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
for(const f of selected){const target=path.join(dest,f);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,f),target);}
for(const required of ['index.html','shop/index.html','shop/checkout.js','embed/ailon-tusk.js','packages/index.html','treks/index.html'])if(!fs.existsSync(path.join(dest,required)))throw Error('Required Android page missing: '+required);
console.log('Android web assets synced:',selected.length,'tracked public files');
