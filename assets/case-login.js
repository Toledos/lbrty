(() => {
  const overlay=document.getElementById('gateOverlay');
  if(!overlay)return;
  const input=document.getElementById('gateInput');
  const submit=document.getElementById('gateSubmit');
  const error=document.getElementById('gateError');
  const next=document.getElementById('gateNext');
  const standalone=document.body.classList.contains('login-page');
  let previousFocus;
  function close(){
    if(standalone){location.href='/';return;}
    overlay.style.display='none';overlay.setAttribute('aria-hidden','true');
    document.body.style.overflow='';previousFocus?.focus();
  }
  document.getElementById('gateCancel')?.addEventListener('click',event=>{event.preventDefault();close();});
  document.addEventListener('click',async event=>{
    const link=event.target.closest('.protected-link');if(!link)return;
    event.preventDefault();const target=new URL(link.href,location.origin).pathname;
    try{const r=await fetch('/auth/session',{cache:'no-store'});if(r.ok&&(await r.json()).authenticated){location.href=target;return;}}catch{}
    previousFocus=link;next.value=target;error.style.display='none';input.value='';
    overlay.style.display='flex';overlay.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';input.focus();
  });
  submit.addEventListener('click',async()=>{
    if(submit.disabled)return;
    submit.disabled=true;submit.textContent='Please wait...';error.style.display='none';
    try{
      const response=await fetch('/auth/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password:input.value,next:next.value})});
      const data=await response.json();
      if(!response.ok){error.textContent=data.error||'Login is temporarily unavailable.';error.style.display='block';input.select();return;}
      location.href=data.location;
    }catch{error.textContent='Login is temporarily unavailable. Please try again.';error.style.display='block';}
    finally{submit.disabled=false;submit.textContent='Submit';}
  });
  input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();submit.click();}});
  document.addEventListener('keydown',event=>{
    if(overlay.getAttribute('aria-hidden')==='true')return;
    if(event.key==='Escape'){close();return;}
    if(event.key==='Tab'){
      const items=[...overlay.querySelectorAll('button:not([disabled]),input:not([type="hidden"]),a[href]')];
      const first=items[0],last=items.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  if(standalone)input.focus();
})();
