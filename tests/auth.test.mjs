import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import worker from '../worker/index.mjs';
const origin='https://www.lbrty.nl';
const paths=['spruit','royal-floraholland','nefit-bosch','gitp','bna'].map(s=>'/proof-of-work/'+s);
function environment(){return {CASE_PASSWORD:'test-only-password',SESSION_SECRET:'test-only-session-secret-at-least-32-characters',LOGIN_LIMITER:{limit:async()=>({success:true})},ASSETS:{fetch:async request=>new Response('ASSET '+new URL(request.url).pathname)}};}
const get=(path,env=environment(),headers={},method='GET')=>worker.fetch(new Request(origin+path,{headers,method}),env);
const post=(password='test-only-password',next=paths[0],env=environment(),headers={})=>worker.fetch(new Request(origin+'/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded',...headers},body:new URLSearchParams({password,next})}),env);
async function cookie(env=environment()){const r=await post(undefined,undefined,env);assert.equal(r.status,200);return r.headers.get('Set-Cookie').split(';')[0];}
test('all five case pages are blocked before login, including HEAD',async()=>{
 for(const p of paths){for(const method of ['GET','HEAD']){const r=await get(p,undefined,{},method);assert.equal(r.status,401);assert.match(r.headers.get('Cache-Control'),/no-store/);if(method==='GET'){const body=await r.text();assert.match(body,/Enter your password/);assert.doesNotMatch(body,/Project details/);}}}
});
test('correct login sets a signed secure HttpOnly cookie; cases and private images then load',async()=>{
 const env=environment(),r=await post(undefined,undefined,env);assert.equal(r.status,200);assert.equal((await r.json()).location,paths[0]);
 const header=r.headers.get('Set-Cookie');for(const flag of ['__Host-','HttpOnly','Secure','SameSite=Lax','Path=/'])assert.ok(header.includes(flag));
 const headers={Cookie:header.split(';')[0]};
 for(const p of paths){const response=await get(p,env,headers);assert.equal(response.status,200);assert.match(await response.text(),/Project details/);}
 const image=await get('/assets/work/spruit-00.webp',env,headers);assert.equal(image.status,200);assert.match(image.headers.get('Cache-Control'),/no-store/);
});
test('wrong passwords, forged or expired cookies, changed password and missing secrets fail closed',async()=>{
 assert.equal((await post('wrong')).status,401);
 assert.equal((await get(paths[0],undefined,{Cookie:'caseGateOk=1'})).status,401);
 assert.equal((await get(paths[0],undefined,{Cookie:'__Host-lbrty_session=1000000000.'+'a'.repeat(64)})).status,401);
 const env=environment(),c=await cookie(env);assert.equal((await get(paths[0],env,{Cookie:c.slice(0,-1)+(c.endsWith('0')?'1':'0')})).status,401);
 env.CASE_PASSWORD='changed';assert.equal((await get(paths[0],env,{Cookie:c})).status,401);
 assert.equal((await get(paths[0],{})).status,503);assert.equal((await post(undefined,undefined,{})).status,503);
});
test('case images cannot bypass authentication through encoding, legacy aliases or traversal',async()=>{
 for(const p of ['/assets/work/spruit-00.webp','/assets//work/spruit-00.webp','/assets/%77ork/spruit-00.webp','/assets/x%2f..%2fwork/spruit-00.webp'])assert.equal((await get(p)).status,401,p);
 for(const p of ['/assets/%2577ork/spruit-00.webp','/worker/content.mjs','/scripts/build.mjs','/docs/case-migration.md'])assert.equal((await get(p)).status,404,p);
 const r=await get('/cases/royal-flora-holland.html');assert.equal(r.status,308);assert.equal(r.headers.get('Location'),'/proof-of-work/royal-floraholland');
 assert.equal((await get('/proof-of-work/spruit/')).headers.get('Location'),paths[0]);
});
test('login rejects cross-origin submissions and enforces rate limits; redirect target is allowlisted',async()=>{
 assert.equal((await post(undefined,undefined,undefined,{Origin:'https://evil.example'})).status,403);
 const env=environment();env.LOGIN_LIMITER.limit=async()=>({success:false});assert.equal((await post(undefined,undefined,env)).status,429);
 const r=await post(undefined,'https://evil.example');assert.equal((await r.json()).location,paths[0]);
});
test('public homepage stays public; build excludes case HTML and source manifests',async()=>{
 assert.equal((await get('/')).status,200);
 await assert.rejects(stat(new URL('../dist/cases/spruit.html',import.meta.url)));
 await assert.rejects(stat(new URL('../dist/assets/case-assets.json',import.meta.url)));
});
