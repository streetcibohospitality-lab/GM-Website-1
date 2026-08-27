
(function(){
  const form=document.getElementById('franchiseForm');
  if(!form) return;

  /* -------------------------------------------------------------
     Enquiries are emailed, not stored. Web3Forms relays the POST to
     the address registered against the access key; no database, so
     nothing to pause, no RLS to keep correct, and no personal data
     sitting in a table indefinitely.

     ACCESS KEY: paste the key from web3forms.com below. The key only
     identifies the destination mailbox -- it is safe in client-side
     code and cannot be used to read anything.

     To move to another provider, change these two constants and the
     JSON body sent below; nothing else here is specific to Web3Forms.
     ------------------------------------------------------------- */
  const FORM_ENDPOINT='https://api.web3forms.com/submit';
  const FORM_ACCESS_KEY='c6229879-4e6c-46ed-b734-7a976fa5689a';

  /* Shown when the relay is unreachable, so a franchise lead always has
     somewhere to go rather than a dead end. */
  const FALLBACK_CONTACT='+91 63661 66696';
  const btn=document.getElementById('franchiseSubmitBtn');
  const status=document.getElementById('franchiseStatus');
  const formReadyAt=performance.now();
  const RATE_KEY='gmFranchiseLastSubmitAt';
  const MIN_FILL_MS=1200;
  const RESUBMIT_MS=30000;

  function setStatus(message,type=''){
    if(status){status.textContent=message;status.dataset.type=type;}
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    setStatus('');
    if(document.getElementById('fi-company')?.value) return;
    if(performance.now()-formReadyAt<MIN_FILL_MS){
      setStatus('Please take a moment to review your details before submitting.','error');
      return;
    }
    const lastSubmit=Number(sessionStorage.getItem(RATE_KEY)||0);
    if(lastSubmit && Date.now()-lastSubmit<RESUBMIT_MS){
      setStatus('Your enquiry was just submitted. Please wait a moment before sending another.','error');
      return;
    }
    if(!form.reportValidity()){
      /* reportValidity() pops the browser's own bubble on a single field, which
         a screen reader user may never receive. Name the outstanding fields in
         the live region too, and move focus to the first one. */
      const invalid=[...form.querySelectorAll(':invalid')].filter(el=>!el.closest('.hp-field'));
      const names=invalid
        .map(el=>(form.querySelector('label[for="'+el.id+'"]')||{}).textContent)
        .filter(Boolean).map(t=>t.trim());
      if(names.length){
        setStatus('Please complete '+names.length+' required field'+(names.length>1?'s':'')+': '+names.join(', ')+'.','error');
      }
      if(invalid[0]) invalid[0].focus();
      return;
    }

    /* If the site is deployed before the access key is pasted in, every
       submission would post to the relay, be rejected, and come back as a
       generic "try again" that never succeeds. Detect the placeholder and
       send the enquirer straight to the phone number instead. */
    if(!FORM_ACCESS_KEY || FORM_ACCESS_KEY.indexOf('PASTE_YOUR')===0){
      console.error('Franchise form: FORM_ACCESS_KEY is not set in franchise.js.');
      setStatus('Our enquiry form is being set up. Please call us on '+FALLBACK_CONTACT+' and we will take your details.','error');
      return;
    }

    btn.disabled=true;
    btn.textContent='Sending…';
    setStatus('Sending your enquiry…');

    try{
      const v=id=>(document.getElementById(id)||{}).value||'';
      const name=v('fi-name').trim().slice(0,80);
      const city=v('fi-city').trim().slice(0,80);
      const response=await fetch(FORM_ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'application/json',Accept:'application/json'},
        body:JSON.stringify({
          access_key:FORM_ACCESS_KEY,
          /* subject and from_name are what the inbox shows at a glance */
          subject:`Franchise enquiry — ${name}${city?' · '+city:''}`,
          from_name:'Grub Monkeys Website',
          name:name,
          phone:v('fi-phone').trim().slice(0,24),
          email:v('fi-email').trim().slice(0,120),
          city:city,
          budget:v('fi-budget').slice(0,40)||'Not specified',
          message:v('fi-message').trim().slice(0,800)||'(no message)'
        })
      });
      /* Treat it as sent only on an explicit success:true. Web3Forms
         answers 200 with {success:false} for a bad or missing key, and a
         proxy error page or captive portal can return a 200 that is not
         JSON at all. Anything short of a positive acknowledgement has to
         surface as a failure -- telling someone their franchise enquiry
         was sent when it was not is the one outcome worth avoiding. */
      let payload=null;
      try{ payload=await response.json(); }catch(err){ /* not JSON */ }
      if(!response.ok || !payload || payload.success!==true){
        throw new Error((payload&&payload.message)||`HTTP ${response.status}`);
      }
      sessionStorage.setItem(RATE_KEY,String(Date.now()));
      form.reset();
      btn.textContent='Enquiry Sent';
      btn.style.background='var(--gm-teal)';
      btn.style.color='var(--gm-grey)';
      btn.style.boxShadow='none';
      setStatus('Thanks — your enquiry was submitted.','success');
    }catch(err){
      console.error('Franchise enquiry failed',err);
      btn.disabled=false;
      btn.textContent='Submit Enquiry';
      setStatus('Could not send your enquiry right now. Please try again, or call us on '+FALLBACK_CONTACT+'.','error');
    }
  });
})();

/* FRANCHISE — Hero portrait Vibe Check video controls */
(function(){
  const video=document.getElementById('gmFrVibeVideo');
  const screen=document.getElementById('gmFrVibeScreen');
  const screenToggle=document.getElementById('gmFrVibeScreenToggle');
  const playButton=document.getElementById('gmFrVibePlay');
  const soundButton=document.getElementById('gmFrVibeSound');
  const restartButton=document.getElementById('gmFrVibeRestart');
  if(!video || !screen || !screenToggle || !playButton || !soundButton || !restartButton) return;

  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let userPaused=reduceMotion;

  function sync(){
    const paused=video.paused;
    screen.classList.toggle('is-paused',paused);
    playButton.textContent=paused?'PLAY':'PAUSE';
    screenToggle.querySelector('span').textContent=paused?'▶':'Ⅱ';
    screenToggle.setAttribute('aria-label',paused?'Play vibe check video':'Pause vibe check video');
    soundButton.textContent=video.muted?'SOUND ON':'SOUND OFF';
    soundButton.setAttribute('aria-pressed',String(!video.muted));
  }

  async function playVideo(){
    userPaused=false;
    try{ await video.play(); }catch(err){ userPaused=true; }
    sync();
  }

  function pauseVideo(){
    userPaused=true;
    video.pause();
    sync();
  }

  function togglePlayback(){
    if(video.paused) playVideo();
    else pauseVideo();
  }

  playButton.addEventListener('click',togglePlayback);
  screenToggle.addEventListener('click',togglePlayback);

  soundButton.addEventListener('click',async()=>{
    video.muted=!video.muted;
    if(video.paused && !userPaused){
      try{ await video.play(); }catch(err){}
    }
    sync();
  });

  restartButton.addEventListener('click',async()=>{
    video.currentTime=0;
    userPaused=false;
    try{ await video.play(); }catch(err){}
    sync();
  });

  video.addEventListener('play',sync);
  video.addEventListener('pause',sync);
  video.addEventListener('volumechange',sync);

  if(reduceMotion){
    video.removeAttribute('autoplay');
    video.pause();
  }else{
    video.muted=true;
    video.play().catch(()=>{ userPaused=true; sync(); });
  }

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      if(!video.paused) video.pause();
    }else if(!userPaused && !reduceMotion){
      video.play().catch(()=>{});
    }
  });

  sync();
})();
