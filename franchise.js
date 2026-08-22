
(function(){
  const form=document.getElementById('franchiseForm');
  if(!form) return;

  const SUPABASE_URL='https://wpzftlqqtuftzyfwtpkp.supabase.co';
  const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwemZ0bHFxdHVmdHp5Znd0cGtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MjkwMzQsImV4cCI6MjEwMjAwNTAzNH0.VzwizMxvAlI4KX3DOHmOTQZwFcO76X90HAhKC9rIBKc';
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

    btn.disabled=true;
    btn.textContent='Sending…';
    setStatus('Sending your enquiry…');

    try{
      const response=await fetch(`${SUPABASE_URL}/rest/v1/franchise_enquiries`,{
        method:'POST',
        headers:{
          apikey:SUPABASE_ANON_KEY,
          Authorization:`Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type':'application/json',
          Prefer:'return=minimal'
        },
        body:JSON.stringify({
          full_name:document.getElementById('fi-name').value.trim().slice(0,80),
          phone:document.getElementById('fi-phone').value.trim().slice(0,24),
          email:document.getElementById('fi-email').value.trim().slice(0,120),
          city:document.getElementById('fi-city').value.trim().slice(0,80),
          budget:(document.getElementById('fi-budget').value||'').slice(0,40)||null,
          message:document.getElementById('fi-message').value.trim().slice(0,800)||null
        })
      });
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
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
      setStatus('Could not submit right now. Please try again or contact Grub Monkeys directly.','error');
    }
  });
})();

/* FRANCHISE — Option B / Vibe Check video controls */
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
