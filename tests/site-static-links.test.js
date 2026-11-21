'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ENTRY_PAGES=[
  'index.html','more/index.html','partnership/index.html','partners/index.html',
  'packages/index.html','packages/amor-checkout.html','shop/index.html',
  'creators/gallery.html','creators/natasha.html','wallet/index.html',
  'partner/index.html','partner/join/index.html'
];

function internalPath(href, parent) {
  href=href.replace(/&amp;/g,'&').trim();
  if (!href || /^(#|mailto:|tel:|data:|javascript:)/i.test(href)) return null;
  if (/^https?:\/\//i.test(href)) {
    let url;
    try{url=new URL(href);}catch(_){return null;}
    if (!/(^|\.)roamwise\.co\.in$/i.test(url.hostname)) return null;
    href=url.pathname;
  }
  const raw=href.split(/[?#]/)[0];
  if (!raw) return null;
  const loc=raw.startsWith('/') ? raw : '/'+path.posix.join(path.posix.dirname(parent),raw);
  // POSIX normalization avoids false missing paths for /foo/../bar.
  return path.posix.normalize(loc).replace(/^\//,'');
}

function existsRoute(route) {
  if (!route || route==='.') return true;
  const candidates=[route,route.replace(/\/$/,'')+'/index.html',route+'.html'];
  return candidates.some(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
}

test('home and commercial pages do not point at missing static routes',()=>{
  const broken=[];
  for(const p of ENTRY_PAGES){
    assert.ok(fs.existsSync(p),'Missing core page: '+p);
    const html=fs.readFileSync(p,'utf8');
    for(const match of html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)){
      const route=internalPath(match[1],p);
      if(route!==null && !existsRoute(route)) broken.push(p+' -> '+match[1]+' ['+route+']');
    }
  }
  assert.deepEqual(broken,[],'Missing local routes can strand a customer before booking');
});
