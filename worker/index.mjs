import {pages,login} from './content.mjs';
const COOKIE='__Host-lbrty_session';
const TTL=8*60*60;
const enc=new TextEncoder();
const security={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY'};
const privateHeaders={...security,'Cache-Control':'private, no-store','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow'};
const html=(body,status=200)=>new Response(body,{status,headers:{...privateHeaders,'Content-Type':'text/html; charset=utf-8'}});
const json=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{...privateHeaders,'Content-Type':'application/json; charset=utf-8',...extra}});
const redirect=path=>new Response(null,{status:308,headers:{...security,'Location':path,'Cache-Control':'no-store'}});
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const hex=a=>Array.from(new Uint8Array(a),b=>b.toString(16).padStart(2,'0')).join('');
async function digest(s){return new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s)));}
async function equals(a,b){const [x,y]=await Promise.all([digest(a),digest(b)]);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;}
async function key(env){return crypto.subtle.importKey('raw',enc.encode(env.SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function sign(payload,env){return hex(await crypto.subtle.sign('HMAC',await key(env),enc.encode(payload)));}
const configured=env=>typeof env.CASE_PASSWORD==='string'&&env.CASE_PASSWORD.length>0&&typeof env.SESSION_SECRET==='string'&&env.SESSION_SECRET.length>=32;
async function payload(env,expires){return `${expires}.${hex(await digest(env.CASE_PASSWORD))}`;}
async function authenticated(request,env){
 if(!configured(env))return false;
 const token=request.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
 if(!token)return false;
 const match=/^(\d{10})\.([0-9a-f]{64})$/.exec(token);if(!match)return false;
 const expires=Number(match[1]),now=Math.floor(Date.now()/1000);
 if(expires<=now||expires>now+TTL)return false;
 return equals(match[2],await sign(await payload(env,expires),env));
}
function canonical(path){
 if(path.endsWith('/'))path=path.slice(0,-1);
 if(path.endsWith('.html'))path=path.slice(0,-5);
 if(path.startsWith('/cases/'))path='/proof-of-work/'+path.slice(7);
 if(path==='/proof-of-work/royal-flora-holland')path='/proof-of-work/royal-floraholland';
 return Object.hasOwn(pages,path)?path:null;
}
const nextPath=value=>canonical(value||'')||'/proof-of-work/spruit';
async function loginRequest(request,env){
 if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Please reload the login page and try again.'},403);
 if(!configured(env)||!env.LOGIN_LIMITER)return json({error:'Login is temporarily unavailable.'},503);
 if(!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))return json({error:'Invalid request.'},415);
 if(Number(request.headers.get('Content-Length'))>2048)return json({error:'Invalid request.'},413);
 const limited=await env.LOGIN_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});
 if(!limited.success)return json({error:'Too many attempts. Please try again in a minute.'},429,{'Retry-After':'60'});
 const body=await request.text();if(body.length>2048)return json({error:'Invalid request.'},413);
 const fields=new URLSearchParams(body);
 if(!await equals(fields.get('password')||'',env.CASE_PASSWORD))return json({error:'Incorrect password. Please try again.'},401);
 const expires=Math.floor(Date.now()/1000)+TTL;
 const cookie=`${COOKIE}=${expires}.${await sign(await payload(env,expires),env)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TTL}`;
 return json({location:nextPath(fields.get('next'))},200,{'Set-Cookie':cookie});
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);let path;
  try{
   const decoded=decodeURIComponent(url.pathname);
   if(/[\\%?#]/.test(decoded))throw new Error('Invalid path');
   path=new URL(decoded.replace(/\/{2,}/g,'/'),url.origin).pathname;
  }catch{return new Response('Not found',{status:404,headers:security});}
  if(path==='/auth/session')return request.method==='GET'?json({authenticated:await authenticated(request,env)}):new Response(null,{status:405,headers:privateHeaders});
  if(path==='/auth/login')return request.method==='POST'?loginRequest(request,env):new Response('Method not allowed',{status:405,headers:{...privateHeaders,Allow:'POST'}});
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{...privateHeaders,Allow:'GET, HEAD'}});
  let response;
  const target=canonical(path);
  if(target&&path!==target)return redirect(target+url.search);
  if(path==='/login')response=html(login.replaceAll('{{NEXT}}',escape(nextPath(url.searchParams.get('next')))));
  else if(target){
   if(!configured(env))response=html('<!doctype html><html lang="en"><title>Temporarily unavailable</title><p>Case access is temporarily unavailable. Please contact ask@lbrty.nl.</p></html>',503);
   else response=await authenticated(request,env)?html(pages[target]):html(login.replaceAll('{{NEXT}}',escape(target)),401);
  } else if((path==='/assets/work'||path.startsWith('/assets/work/'))){
   if(!await authenticated(request,env))return new Response('Unauthorized',{status:401,headers:privateHeaders});
   const asset=await env.ASSETS.fetch(new Request(new URL(path,url.origin),request));
   response=new Response(asset.body,asset);for(const [k,v] of Object.entries(privateHeaders))response.headers.set(k,v);
  }else if(path==='/'||path==='/index.html'||path==='/style.css'||path.startsWith('/assets/')){
   response=await env.ASSETS.fetch(new Request(new URL(path,url.origin),request));
   response=new Response(response.body,response);for(const [k,v] of Object.entries(security))response.headers.set(k,v);
  }else response=new Response('Not found',{status:404,headers:security});
  return request.method==='HEAD'?new Response(null,response):response;
 }
};
