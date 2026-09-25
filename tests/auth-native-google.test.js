const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../js/boot/auth-init.js'),'utf8');
const start=source.indexOf('function rwGoogleErrorText(');
const end=source.indexOf('function loginGoogle(',start);
assert.ok(start>=0&&end>start,'extract the production native Google helpers');

function helpers(){
  const context={
    Error,
    friendly:e=>String(e&&e.message||'Something went wrong.'),
    rwIsNativePlatform:()=>true
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start,end),context);
  return context;
}

function response(token='google-id-token'){
  return {credential:{idToken:token}};
}

test('Android Google sign-in uses Credential Manager first',async()=>{
  const h=helpers(),calls=[];
  const plugin={signInWithGoogle:options=>{calls.push({...options});return Promise.resolve(response());}};
  assert.equal(await h.rwNativeGoogleIdToken(plugin),'google-id-token');
  assert.deepEqual(calls,[{skipNativeAuth:true,useCredentialManager:true}]);
});

test('generic Credential Manager failure retries once with legacy Google Sign-In',async()=>{
  const h=helpers(),calls=[];
  const plugin={signInWithGoogle:options=>{
    calls.push({...options});
    return options.useCredentialManager
      ? Promise.reject(Object.assign(new Error('Something went wrong'),{code:'GetCredentialUnknownException'}))
      : Promise.resolve(response('legacy-id-token'));
  }};
  assert.equal(await h.rwNativeGoogleIdToken(plugin),'legacy-id-token');
  assert.deepEqual(calls,[
    {skipNativeAuth:true,useCredentialManager:true},
    {skipNativeAuth:true,useCredentialManager:false}
  ]);
});

test('user cancellation does not open a second chooser',async()=>{
  const h=helpers();let calls=0;
  const plugin={signInWithGoogle:()=>{calls++;return Promise.reject(Object.assign(new Error('Sign in cancelled'),{code:'12501'}));}};
  await assert.rejects(h.rwNativeGoogleIdToken(plugin),/cancelled/);
  assert.equal(calls,1);
  assert.equal(h.rwGoogleError({code:'12501',message:'cancelled'}),'Google sign-in was cancelled.');
});

test('OAuth certificate failures produce an actionable Android message',async()=>{
  const h=helpers();let calls=0;
  const plugin={signInWithGoogle:options=>{
    calls++;
    return Promise.reject(options.useCredentialManager
      ? Object.assign(new Error('Something went wrong'),{code:'GetCredentialUnknownException'})
      : Object.assign(new Error('ApiException: 10:'),{code:'DEVELOPER_ERROR'}));
  }};
  let failure;
  try{await h.rwNativeGoogleIdToken(plugin);}catch(e){failure=e;}
  assert.equal(calls,2);
  assert.match(h.rwGoogleError(failure),/unavailable in this version/);
  assert.match(h.rwGoogleError(failure),/Email sign-in still works/);
});

test('native account linking shares the resilient token helper',()=>{
  assert.match(source,/if\(native\)\{job=rwNativeGoogleIdToken\(native\)/);
  assert.doesNotMatch(source,/native\.signInWithGoogle\(\{skipNativeAuth:true\}\)/);
});
