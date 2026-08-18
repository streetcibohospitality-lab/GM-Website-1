
(function(){
  document.documentElement.classList.remove('no-js');
  const nav=document.getElementById('siteNav');
  const menu=document.getElementById('mobileMenu');
  const toggle=document.getElementById('mobileMenuToggle');
  const closeBtn=document.getElementById('mobileMenuClose');
  let lastFocused=null;

  function setNavState(){ if(nav) nav.classList.toggle('scrolled',window.scrollY>40); }
  setNavState();
  window.addEventListener('scroll',setNavState,{passive:true});

  function openMenu(){
    if(!menu||!toggle) return;
    lastFocused=document.activeElement;
    menu.classList.add('open');
    menu.setAttribute('aria-hidden','false');
    toggle.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-label','Close menu');
    document.body.classList.add('menu-open');
    const focusable=menu.querySelector('a,button');
    if(focusable) focusable.focus();
  }
  function closeMenu(restore=true){
    if(!menu||!toggle) return;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden','true');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Open menu');
    document.body.classList.remove('menu-open');
    if(restore && lastFocused && typeof lastFocused.focus==='function') lastFocused.focus();
  }
  if(toggle) toggle.addEventListener('click',()=>menu && menu.classList.contains('open')?closeMenu():openMenu());
  if(closeBtn) closeBtn.addEventListener('click',()=>closeMenu());
  if(menu){
    menu.addEventListener('click',e=>{ if(e.target.closest('a')) closeMenu(false); });
    menu.addEventListener('keydown',e=>{
      if(e.key==='Escape'){ e.preventDefault(); closeMenu(); return; }
      if(e.key==='Tab'){
        const items=[...menu.querySelectorAll('a,button')].filter(el=>!el.disabled && el.offsetParent!==null);
        if(!items.length) return;
        const first=items[0],last=items[items.length-1];
        if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
      }
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const href=a.getAttribute('href');
      if(!href||href==='#') return;
      const target=document.querySelector(href);
      if(!target) return;
      e.preventDefault();
      const top=target.getBoundingClientRect().top+window.scrollY-72;
      window.scrollTo({top,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    });
  });

  const revealEls=document.querySelectorAll('.reveal');
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if('IntersectionObserver' in window && !reduceMotion){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.animate([
            {opacity:0,transform:'translateY(14px)'},
            {opacity:1,transform:'translateY(0)'}
          ],{duration:520,easing:'cubic-bezier(0.22,1,0.36,1)',fill:'none'});
          io.unobserve(entry.target);
        }
      });
    },{threshold:.12,rootMargin:'0px 0px -48px 0px'});
    revealEls.forEach(el=>io.observe(el));
  }

  const tv=document.getElementById('monkeyTvVideo');
  const play=document.getElementById('tvPlay');
  const restart=document.getElementById('tvRestart');
  const tvShell=document.querySelector('.crt-tv');
  const crtScreen=document.querySelector('.crt-screen');
  const tvSection=document.getElementById('monkey-tv');
  const neonSign=document.getElementById('onAirSign');
  const channels=[...document.querySelectorAll('.tv-channel')];
  const sound=document.getElementById('tvSound');
  let tvStarted=false;
  let tvAutoBooted=false;
  let tvUserPaused=false;
  function syncPlayLabel(){
    if(play && tv) {
      play.textContent=tv.paused?'PLAY':'PAUSE';
      play.setAttribute('aria-label',tv.paused?'Play Monkey TV':'Pause Monkey TV');
    }
  }
  function pulsePower(){
    if(tvShell && !reduceMotion){
      tvShell.classList.add('powering');
      setTimeout(()=>tvShell.classList.remove('powering'),260);
    }
  }
  function pulseChannelSwitch(){
    if(crtScreen && !reduceMotion){
      crtScreen.classList.remove('switching');
      void crtScreen.offsetWidth;
      crtScreen.classList.add('switching');
      setTimeout(()=>crtScreen.classList.remove('switching'),180);
    }
  }
  if(tv){
    tv.addEventListener('play',syncPlayLabel);
    tv.addEventListener('pause',syncPlayLabel);
    tv.addEventListener('error',()=>{ if(play){ play.disabled=true; play.textContent='VIDEO'; } });
    if(play) play.addEventListener('click',async()=>{
      if(tv.paused){
        tvUserPaused=false;
        if(!tvStarted) pulsePower();
        tvStarted=true;
        try{ await tv.play(); }catch(e){}
      }else{
        tvUserPaused=true;
        tv.pause();
      }
    });
    /* Sound stays off until the visitor explicitly asks for it — never auto-unmuted. */
    if(sound){
      const syncSoundLabel=()=>{
        sound.textContent=tv.muted?'SOUND OFF':'SOUND ON';
        sound.setAttribute('aria-pressed',tv.muted?'false':'true');
        sound.setAttribute('aria-label',tv.muted?'Turn Monkey TV sound on':'Turn Monkey TV sound off');
      };
      sound.addEventListener('click',()=>{ tv.muted=!tv.muted; syncSoundLabel(); });
      tv.addEventListener('volumechange',syncSoundLabel);
      syncSoundLabel();
    }
    /* Pause when the tab is hidden; resume only if the visitor didn't pause it. */
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){ if(!tv.paused) tv.pause(); }
      else if(!tvUserPaused && tvAutoBooted) tv.play().catch(()=>{});
    });
    if(restart) restart.addEventListener('click',()=>{pulseChannelSwitch(); tv.currentTime=0; if(!tv.paused) tv.play().catch(()=>{});});
    channels.forEach(btn=>btn.addEventListener('click',()=>{
      channels.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const time=Number(btn.dataset.time||0);
      const jump=()=>{
        if(Number.isFinite(time)) tv.currentTime=time;
        tv.play().catch(()=>{});
      };
      pulseChannelSwitch();
      if(reduceMotion) jump();
      else setTimeout(jump,90);
    }));
    if('IntersectionObserver' in window){
      const tvio=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting && !tvAutoBooted){
            tvAutoBooted=true;
            if(neonSign) neonSign.classList.add('warm');
            pulsePower();
            setTimeout(()=>{ if(!tvUserPaused) tv.play().then(()=>{tvStarted=true;}).catch(()=>{}); },120);
          } else if(entry.isIntersecting && tvAutoBooted && !tvUserPaused && tv.paused){
            /* Returning to the TV resumes playback unless the visitor paused it. */
            tv.play().catch(()=>{});
          } else if(!entry.isIntersecting && !tv.paused) tv.pause();
        });
      },{threshold:.35});
      if(tvSection) tvio.observe(tvSection); else tvio.observe(tv);
    } else if(neonSign) {
      neonSign.classList.add('warm');
    }
    syncPlayLabel();
  } else if(neonSign) {
    if('IntersectionObserver' in window){
      const neonIo=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('warm');neonIo.unobserve(entry.target);}})},{threshold:.4});
      neonIo.observe(neonSign);
    } else neonSign.classList.add('warm');
  }

  const slides=[...document.querySelectorAll('.review-slide')];
  if(slides.length){
    const cur=document.getElementById('reviewCur');
    const total=document.getElementById('reviewTotal');
    let index=0;
    const pad=n=>String(n).padStart(2,'0');
    if(total) total.textContent=pad(slides.length);
    function show(i){
      slides[index].classList.remove('active');
      index=(i+slides.length)%slides.length;
      slides[index].classList.add('active');
      if(cur) cur.textContent=pad(index+1);
    }
    document.getElementById('prevReview')?.addEventListener('click',()=>show(index-1));
    document.getElementById('nextReview')?.addEventListener('click',()=>show(index+1));
  }

  function buildBulbs(container,count){
    if(!container||container.children.length) return;
    for(let i=0;i<count;i++){const b=document.createElement('span');b.className='bulb';b.style.setProperty('--i',i);container.appendChild(b);}
  }
  buildBulbs(document.getElementById('bulbsTop'),10);
  buildBulbs(document.getElementById('bulbsBottom'),10);
  const dinerSign=document.getElementById('dinerSign');
  if(dinerSign && 'IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('lit');io.unobserve(entry.target);}});
    },{threshold:.5}); io.observe(dinerSign);
  } else if(dinerSign) dinerSign.classList.add('lit');

  const receipt=document.getElementById('receiptCard');
  const receiptWrap=document.getElementById('receiptPrinterWrap');
  if(receipt && 'IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){ if(receiptWrap) receiptWrap.classList.add('printing'); entry.target.classList.add('in'); io.unobserve(entry.target);}});
    },{threshold:.35}); io.observe(receipt);
  } else if(receipt) { if(receiptWrap) receiptWrap.classList.add('printing'); receipt.classList.add('in'); }



  const sigWindow=document.getElementById('sigWindowItem');
  if(sigWindow && 'IntersectionObserver' in window){
    const blindIo=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('blind-open');blindIo.unobserve(entry.target);}});
    },{threshold:.4});
    blindIo.observe(sigWindow);
  } else if(sigWindow) sigWindow.classList.add('blind-open');

  /* The legacy flipboard cycle (CHANNEL 63 / BURGERS / WINGS / SHAKES /
     OPEN LATE on a 4.6s interval) was removed per the Interactive Diner V2
     de-duplication map: interactive-diner.js repurposes this same board into
     one per-session SPECIAL OF THE DAY. Leaving the old timer running would
     have kept overwriting the special. The board markup is untouched — only
     the interval that mutated it is gone. */

  const keytag=document.getElementById('motelKeytag');
  const keyNum=document.getElementById('keyNum');
  const keyName=document.getElementById('keyName');
  const roadsideNum=document.getElementById('roadsideNum');
  const roadsideName=document.getElementById('roadsideName');
  const roadsideCity=document.getElementById('roadsideCity');
  const roadsideDirections=document.getElementById('roadsideDirections');
  const roadsidePanel=document.getElementById('roadsidePanel');
  const locRows=[...document.querySelectorAll('.loc-row')];
  function setKeyFromRow(row){
    if(!row) return;
    locRows.forEach(r=>r.classList.toggle('active-key', r===row));
    const num=(row.querySelector('.loc-row-num')?.textContent||'01').trim();
    const name=(row.querySelector('.loc-row-name')?.textContent||'MANIPAL').trim().toUpperCase();
    const city=(row.querySelector('.loc-row-tag')?.textContent||'KARNATAKA').trim().toUpperCase();
    const directions=row.querySelector('.loc-link.outline');
    if(keyNum) keyNum.textContent=num;
    if(keyName) keyName.textContent=name.replace(' DINER','');
    if(roadsideNum) roadsideNum.textContent=num;
    if(roadsideName) roadsideName.textContent=name;
    if(roadsideCity) roadsideCity.textContent=city;
    if(roadsideDirections && directions) roadsideDirections.href=directions.href;
    if(roadsidePanel && !reduceMotion){
      roadsidePanel.animate([{transform:'translateY(3px)',opacity:.9},{transform:'translateY(0)',opacity:1}],{duration:220,easing:'ease-out'});
    }
    if(keytag && !reduceMotion){
      keytag.classList.remove('swing');
      void keytag.offsetWidth;
      keytag.classList.add('swing');
      setTimeout(()=>keytag.classList.remove('swing'),820);
    }
  }
  locRows.forEach((row,i)=>{
    ['mouseenter','focusin','click'].forEach(evt=>row.addEventListener(evt,()=>setKeyFromRow(row)));
    if(i===0) setKeyFromRow(row);
  });

  const socialStrip=document.querySelector('.social-strip');
  if(socialStrip && 'IntersectionObserver' in window && !reduceMotion){
    const socialIo=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('mounted');socialIo.unobserve(entry.target);}})},{threshold:.22});
    socialIo.observe(socialStrip);
  } else if(socialStrip) socialStrip.classList.add('mounted');

  const bellWrap=document.getElementById('orderBellWrap');
  function ringBell(){
    if(!bellWrap) return;
    bellWrap.classList.remove('ring');
    void bellWrap.offsetWidth;
    bellWrap.classList.add('ring');
    setTimeout(()=>bellWrap.classList.remove('ring'),760);
  }
  bellWrap?.addEventListener('click', ringBell);
  bellWrap?.addEventListener('mouseenter', ()=>{ if(window.innerWidth>767) ringBell(); }, {passive:true});

  const coinTrigger=document.getElementById('coinTrigger');
  const jukeboxPlayer=document.getElementById('gmJukeboxPlayer');
  const mixcloudPlayer=document.querySelector('.mixcloud-player');
  coinTrigger?.addEventListener('click',()=>{
    if(!jukeboxPlayer) return;
    jukeboxPlayer.classList.remove('coin-drop');
    void jukeboxPlayer.offsetWidth;
    jukeboxPlayer.classList.add('coin-drop');
    setTimeout(()=>jukeboxPlayer.classList.remove('coin-drop'),900);
    mixcloudPlayer?.scrollIntoView({block:'nearest', inline:'nearest', behavior:reduceMotion?'auto':'smooth'});
    mixcloudPlayer?.focus?.();
  });

  const h=document.getElementById('clockHour');
  const m=document.getElementById('clockMinute');
  const s=document.getElementById('clockSecond');
  function setClock(){
    if(!h || !m || !s) return;
    const now=new Date();
    const sec=now.getSeconds();
    const min=now.getMinutes()+sec/60;
    const hr=(now.getHours()%12)+min/60;
    h.style.transform=`translateX(-50%) rotate(${hr*30}deg)`;
    m.style.transform=`translateX(-50%) rotate(${min*6}deg)`;
    s.style.transform=`translateX(-50%) rotate(${sec*6}deg)`;
  }
  if(h&&m&&s){ setClock(); setInterval(setClock,1000); }

  document.querySelectorAll('.js-year').forEach(el=>el.textContent=new Date().getFullYear());
})();

/* GRUB MONKEYS — KOT 063 hero printer interaction */
(function(){
  const terminal=document.getElementById('kotTerminal');
  const button=document.getElementById('kotPrintButton');
  const timeEl=document.getElementById('kotTime');
  const numberEl=document.getElementById('kotNumber');
  const contentEl=document.getElementById('kotTicketContent');
  const actionEl=document.getElementById('kotTicketAction');
  const statusEl=document.getElementById('kotPrintStatus');
  if(!terminal||!button||!contentEl||!actionEl) return;

  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tickets=[
    {
      title:'FIRST TIME HERE?',
      lines:['1 × KOREAN KONG','1 × DIRTY FRIES','1 × PBJ SHAKE'],
      note:'HOUSE RULE: COME HUNGRY.',
      cta:'VIEW THE FULL MENU',
      href:'menu.html'
    },
    {
      title:'WING DEPARTMENT',
      lines:['START SAFE → MAPLE GLAZED','TURN IT UP → PERI PERI','GO FULL MONKEY → GHOST PEPPER'],
      note:'20+ FLAVOURS. PICK YOUR DAMAGE.',
      cta:'SEE THE WINGS',
      href:'menu.html'
    },
    {
      title:'YOUR TABLE IS READY.',
      lines:['RED BOOTHS','CHECKERBOARD FLOORS','BIG BURGERS · LOUD ROCK'],
      note:'BORN IN MANIPAL. RAISED ACROSS KARNATAKA.',
      cta:'FIND A DINER',
      href:'#locations'
    },
    {
      title:'MONKEY\'S PICK',
      lines:['KOREAN KONG','DIRTY FRIES','PBJ SHAKE'],
      note:'DON\'T OVERTHINK IT. ORDER APPROVED.',
      cta:'ORDER ONLINE',
      href:'#order'
    }
  ];

  let index=0;
  let printing=false;
  let hasPrinted=false;

  function liveTime(){
    return new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(new Date());
  }
  function renderTicket(ticket){
    const safe=(s)=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
    contentEl.innerHTML=`<h3>${safe(ticket.title)}</h3>${ticket.lines.map(line=>`<p>${safe(line)}</p>`).join('')}<strong class="kot-house-rule">${safe(ticket.note)}</strong>`;
    actionEl.innerHTML=`${safe(ticket.cta)} <span>→</span>`;
    actionEl.setAttribute('href',ticket.href);
    if(timeEl) timeEl.textContent=liveTime();
    if(numberEl) numberEl.textContent=`#${String(63+index).padStart(3,'0')}`;
  }
  function setStatus(text){if(statusEl) statusEl.textContent=text;}

  function printTicket(){
    if(printing) return;
    printing=true;

    const start=()=>{
      renderTicket(tickets[index]);
      terminal.classList.remove('is-resetting','is-printed');
      terminal.classList.add('is-printing');
      button.setAttribute('aria-expanded','true');
      setStatus('PRINTING...');

      const finishDelay=reduced?40:1120;
      window.setTimeout(()=>{
        terminal.classList.remove('is-printing');
        terminal.classList.add('is-printed');
        setStatus('KOT READY · PRINT ANOTHER');
        button.querySelector('strong').textContent='PRINT ANOTHER KOT';
        button.querySelector('small').textContent='FRESH PICK FROM THE KITCHEN';
        hasPrinted=true;
        printing=false;
        index=(index+1)%tickets.length;
      },finishDelay);
    };

    if(hasPrinted){
      terminal.classList.remove('is-printed','is-printing');
      terminal.classList.add('is-resetting');
      setStatus('RESETTING...');
      window.setTimeout(start,reduced?20:330);
    } else start();
  }

  button.addEventListener('click',printTicket);
  if(timeEl) timeEl.textContent=liveTime();
})();
