const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
test('Capacitor webDir can be built from latest site and includes critical features',()=>{
 cp.execFileSync(process.execPath,['tools/build-android-www.cjs'],{stdio:'pipe'});
 const required=['index.html','app.js','shop/index.html','shop/checkout.js','embed/ailon-tusk.js','packages/index.html','treks/index.html'];
 for(const p of required)assert.ok(fs.existsSync('www/'+p),'missing '+p);
 const web=fs.readFileSync('www/shop/checkout.js','utf8'),src=fs.readFileSync('shop/checkout.js','utf8');assert.equal(web,src);
});
