import test from 'node:test';import assert from 'node:assert/strict';import {instagramUrl} from '../creators/social-links.mjs';
test('normalizes bare creator handle',()=>assert.equal(instagramUrl('@vaidehi.yadav'),'https://www.instagram.com/vaidehi.yadav/'));
test('normalizes Instagram path rather than internal relative route',()=>assert.equal(instagramUrl('instagram.com/khushi_sharma'),'https://www.instagram.com/khushi_sharma/'));
test('rejects unsafe and unrelated links',()=>{assert.equal(instagramUrl('javascript:alert(1)'),'');assert.equal(instagramUrl('https://evil.example/u'),'')});
