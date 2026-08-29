
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

  /* Section links scroll without leaving a #fragment in the address bar.

     Two shapes exist. On the homepage the links are "#story"; from the menu
     and franchise pages they are "/#story", which is a genuine navigation
     and has to carry the fragment to say where to scroll on arrival. Only
     the first shape used to be intercepted, so arriving from another page
     left "grubmonkeys.in/#story" showing. Both are handled here, and a
     fragment that survives a real navigation is cleared once it has been
     acted on. */
  const smoothOK=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const onHome=location.pathname==='/'||/\/index(\.html)?$/.test(location.pathname);

  function sectionFor(fragment){
    /* A fragment can be anything a link author typed; querySelector throws
       on one that is not a valid selector, e.g. "#1963". */
    try{ return fragment && fragment!=='#' ? document.querySelector(fragment) : null; }
    catch(err){ return null; }
  }

  function scrollToSection(target,smooth){
    const top=target.getBoundingClientRect().top+window.scrollY-72;
    window.scrollTo({top,behavior:smooth?'smooth':'auto'});
  }

  function stripFragment(){
    if(location.hash) history.replaceState(null,'',location.pathname+location.search);
  }

  document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const href=a.getAttribute('href')||'';
      /* "/#order" means the homepage's order section. menu.html has a
         section of its own with that id, so matching on the fragment alone
         would scroll down the menu page instead of going home. Anything
         rooted at "/" stays a real navigation unless we are already home. */
      if(href.charAt(0)==='/' && !onHome) return;
      const fragment=href.slice(href.indexOf('#'));
      const target=sectionFor(fragment);
      if(!target) return;
      e.preventDefault();
      scrollToSection(target,smoothOK);
      stripFragment();
    });
  });

  /* Arrived with a fragment from another page: scroll to it, then tidy the
     URL. Waits for load so images and fonts have settled -- measuring the
     offset before then lands short. */
  if(location.hash && onHome){
    const landing=sectionFor(location.hash);
    if(landing){
      window.addEventListener('load',()=>{
        scrollToSection(landing,false);
        stripFragment();
      });
    }
  }

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
      /* Once the reel is known unplayable the button stays NO SIGNAL — play/pause
         events still fire on a failed element and would otherwise relabel it. */
      if(play.dataset.failed==='true') return;
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
    /* Surface an unplayable reel instead of leaving a dead PAUSE button over a
       frozen poster. The media is declared with a child <source>, and media
       errors fire on that element without bubbling, so a listener on <video>
       alone never runs — it stays here for direct-src failures, but the
       <source> listener is the one that actually catches a missing or
       undecodable MP4. networkState NO_SOURCE is the belt-and-braces case:
       some browsers reject every candidate without firing either event. */
    function tvUnavailable(){
      if(!play || play.dataset.failed==='true') return;
      play.dataset.failed='true';
      play.disabled=true;
      play.textContent='NO SIGNAL';
      play.setAttribute('aria-label','Monkey TV video is unavailable');
      if(restart) restart.disabled=true;
      if(sound) sound.disabled=true;
      if(tvShell) tvShell.classList.add('tv-no-signal');
    }
    tv.addEventListener('error',tvUnavailable);
    const tvSource=tv.querySelector('source');
    if(tvSource) tvSource.addEventListener('error',tvUnavailable);
    tv.addEventListener('loadedmetadata',()=>{ if(play){ play.dataset.failed=''; } });
    window.setTimeout(()=>{
      if(tv.networkState===HTMLMediaElement.NETWORK_NO_SOURCE && tv.readyState===0) tvUnavailable();
    },8000);
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
    const stage=document.querySelector('.counter-review-stage');
    let index=0;
    let reviewAnimating=false;
    const pad=n=>String(n).padStart(2,'0');
    if(total) total.textContent=pad(slides.length);

    function show(i,direction=1){
      if(reviewAnimating || slides.length<2) return;
      const next=(i+slides.length)%slides.length;
      if(next===index) return;

      if(reduceMotion){
        slides[index].classList.remove('active');
        index=next;
        slides[index].classList.add('active');
        if(cur) cur.textContent=pad(index+1);
        return;
      }

      reviewAnimating=true;
      stage?.classList.remove('to-next','to-prev');
      stage?.classList.add(direction>0?'to-next':'to-prev');

      const outgoing=slides[index];
      const incoming=slides[next];
      outgoing.classList.add('is-leaving');
      incoming.classList.add('is-entering','active');

      window.setTimeout(()=>{
        outgoing.classList.remove('active','is-leaving');
        incoming.classList.remove('is-entering');
        index=next;
        if(cur) cur.textContent=pad(index+1);
        stage?.classList.remove('to-next','to-prev');
        reviewAnimating=false;
      },260);
    }

    document.getElementById('prevReview')?.addEventListener('click',()=>show(index-1,-1));
    document.getElementById('nextReview')?.addEventListener('click',()=>show(index+1,1));
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

  /* The legacy flipboard cycle (CHANNEL 69 / BURGERS / WINGS / SHAKES /
     OPEN LATE on a 4.6s interval) was removed per the Interactive Diner V2
     de-duplication map: interactive-diner.js repurposes this same board into
     one daily SPECIAL OF THE DAY. Leaving the old timer running would
     have kept overwriting the special. The board markup is untouched — only
     the interval that mutated it is gone. */

  const keytag=document.getElementById('motelKeytag');
  const keyNum=document.getElementById('keyNum');
  const keyName=document.getElementById('keyName');
  const roadsideNum=document.getElementById('roadsideNum');
  const roadsideName=document.getElementById('roadsideName');
  const roadsideCity=document.getElementById('roadsideCity');
  const roadsideHours=document.getElementById('roadsideHours');
  const roadsideCall=document.getElementById('roadsideCall');
  const roadsideDirections=document.getElementById('roadsideDirections');
  const roadsidePanel=document.getElementById('roadsidePanel');
  const roadsidePhoto=roadsidePanel?.querySelector('.roadside-photo img');
  const orderDinerName=document.getElementById('orderDinerName');
  const orderDinerStatus=document.getElementById('orderDinerStatus');
  const locRows=[...document.querySelectorAll('.loc-row[data-diner]')];
  const selectedDinerKey='gm_selected_diner_v1';
  let selectedDinerSlug=null;
  try{ selectedDinerSlug=sessionStorage.getItem(selectedDinerKey); }catch(err){}
  if(!selectedDinerSlug || !locRows.some(row=>row.dataset.diner===selectedDinerSlug)) selectedDinerSlug='new-bel-road';

  const indiaParts=new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Kolkata',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  });
  const time12=value=>{
    if(!value) return '';
    const [h,m]=value.split(':').map(Number);
    const suffix=h>=12?'PM':'AM';
    const hour=(h%12)||12;
    return `${hour}:${String(m).padStart(2,'0')} ${suffix}`;
  };
  const minutes=value=>{
    if(!value) return null;
    const [h,m]=value.split(':').map(Number);
    return h*60+m;
  };
  function currentISTMinutes(){
    const parts=Object.fromEntries(indiaParts.formatToParts(new Date()).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
    return Number(parts.hour||0)*60+Number(parts.minute||0);
  }
  function statusForRow(row){
    if(!row) return {text:'HOURS UNAVAILABLE',state:'check'};
    if(row.dataset.hoursSource==='unverified') return {text:"CHECK GOOGLE FOR TODAY'S HOURS",state:'check'};
    const open=minutes(row.dataset.open), close=minutes(row.dataset.close), now=currentISTMinutes();
    if(open===null || close===null) return {text:'HOURS UNAVAILABLE',state:'check'};
    if(now>=open && now<close) return {text:`OPEN NOW · UNTIL ${time12(row.dataset.close)}`,state:'open'};
    if(now<open) return {text:`OPENS TODAY · ${time12(row.dataset.open)}`,state:'closed'};
    return {text:`CLOSED · OPENS TOMORROW ${time12(row.dataset.open)}`,state:'closed'};
  }
  function syncLocationStatuses(){
    locRows.forEach(row=>{
      const status=statusForRow(row);
      const el=row.querySelector('[data-loc-status]');
      if(!el) return;
      el.classList.remove('is-open','is-closed','is-check');
      el.classList.add(`is-${status.state}`);
      const label=el.querySelector('b');
      if(label) label.textContent=status.text;
    });
    const selected=locRows.find(row=>row.dataset.diner===selectedDinerSlug);
    if(selected) applySelectedDiner(selected,false);
  }
  function updateOrderTickets(row){
    document.querySelectorAll('[data-order-platform]').forEach(ticket=>{
      const platform=ticket.dataset.orderPlatform;
      const href=platform==='swiggy'?row.dataset.swiggy:row.dataset.zomato;
      const micro=ticket.querySelector('.counter-order-ticket__micro');
      if(href){
        ticket.href=href;
        ticket.classList.remove('is-unavailable');
        ticket.removeAttribute('aria-disabled');
      }else{
        ticket.classList.add('is-unavailable');
        ticket.setAttribute('aria-disabled','true');
      }
      if(micro) micro.textContent=`${(row.querySelector('.loc-row-name')?.textContent||'YOUR DINER').replace(' Diner','').toUpperCase()} / ${platform.toUpperCase()}`;
    });
  }
  function previewDiner(row){
    if(!row) return;
    const num=(row.querySelector('.loc-row-num')?.textContent||'01').trim();
    const name=(row.querySelector('.loc-row-name')?.textContent||'MANIPAL').trim();
    const tag=(row.querySelector('.loc-row-tag')?.textContent||'KARNATAKA').trim();
    const status=statusForRow(row);
    if(keyNum) keyNum.textContent=num;
    if(keyName) keyName.textContent=name.toUpperCase().replace(' DINER','');
    if(roadsideNum) roadsideNum.textContent=num;
    if(roadsideName) roadsideName.textContent=name.toUpperCase();
    if(roadsideCity) roadsideCity.textContent=tag.toUpperCase();
    if(roadsideHours) roadsideHours.textContent=status.text;
    if(roadsideCall){ roadsideCall.href=`tel:${row.dataset.phone||''}`; roadsideCall.textContent='CALL DINER →'; }
    if(roadsideDirections && row.dataset.directions) roadsideDirections.href=row.dataset.directions;
    if(roadsidePhoto && row.dataset.image){
      const nextSrc=row.dataset.image;
      if(roadsidePhoto.getAttribute('src')!==nextSrc){
        roadsidePhoto.src=nextSrc;
      }
      roadsidePhoto.alt=`Grub Monkeys ${name} diner`;
    }
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
  function applySelectedDiner(row,persist=true){
    if(!row) return;
    selectedDinerSlug=row.dataset.diner;
    if(persist){ try{sessionStorage.setItem(selectedDinerKey,selectedDinerSlug);}catch(err){} }
    locRows.forEach(r=>{
      const selected=r===row;
      r.classList.toggle('is-selected-diner',selected);
      const picker=r.querySelector('.loc-row-name-wrap[role="button"]');
      if(picker) picker.setAttribute('aria-pressed',selected?'true':'false');
    });
    previewDiner(row);
    const status=statusForRow(row);
    const label=(row.querySelector('.loc-row-name')?.textContent||'Your diner').trim();
    if(orderDinerName) orderDinerName.textContent=label.toUpperCase()+(row.classList.contains('featured')?' · FLAGSHIP':'');
    if(orderDinerStatus) orderDinerStatus.textContent=status.text;
    updateOrderTickets(row);
  }
  locRows.forEach(row=>{
    row.addEventListener('mouseenter',()=>previewDiner(row));
    row.addEventListener('focusin',()=>previewDiner(row));
    const picker=row.querySelector('.loc-row-name-wrap[role="button"]');
    picker?.addEventListener('click',()=>applySelectedDiner(row,true));
    picker?.addEventListener('keydown',evt=>{
      if(evt.key==='Enter' || evt.key===' '){evt.preventDefault();applySelectedDiner(row,true);}
    });
    /* On touch screens there is no hover. Make the whole location card an
       intentional selection target while preserving its Call/Order/Directions links. */
    row.addEventListener('click',evt=>{
      if(evt.target.closest('a,button,.loc-row-name-wrap')) return;
      applySelectedDiner(row,true);
    });
    row.querySelectorAll('.loc-row-links a').forEach(link=>link.addEventListener('click',()=>applySelectedDiner(row,true)));
  });
  const initialSelected=locRows.find(row=>row.dataset.diner===selectedDinerSlug) || locRows[0];
  applySelectedDiner(initialSelected,false);
  locRows.forEach(row=>{
    if(!row.dataset.image) return;
    const img=new Image();
    img.decoding='async';
    img.src=row.dataset.image;
  });
  syncLocationStatuses();
  window.setInterval(syncLocationStatuses,60000);

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

  const counterLamp=document.getElementById('counterServiceLamp');
  document.querySelectorAll('[data-order-platform]').forEach(ticket=>{
    ticket.addEventListener('pointerdown',()=>{
      ticket.classList.add('is-pressed');
      counterLamp?.classList.add('is-pulsing');
    });
    ['pointerup','pointercancel','pointerleave'].forEach(evt=>{
      ticket.addEventListener(evt,()=>{
        ticket.classList.remove('is-pressed');
        window.setTimeout(()=>counterLamp?.classList.remove('is-pulsing'),420);
      });
    });
  });

  const counterSpread=document.querySelector('.diner-counter-spread');
  if(counterSpread){
    if(reduceMotion || !('IntersectionObserver' in window)){
      counterSpread.classList.add('is-entered');
    }else{
      const counterIo=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting) return;
          counterSpread.classList.add('is-entered');
          counterIo.disconnect();
        });
      },{threshold:.28});
      counterIo.observe(counterSpread);
    }
  }

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
  const digital=document.getElementById('grubTimeDigital');
  const indiaClockParts=new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Kolkata',
    hour:'2-digit',
    minute:'2-digit',
    second:'2-digit',
    hourCycle:'h23'
  });
  const indiaClockText=new Intl.DateTimeFormat('en-IN',{
    timeZone:'Asia/Kolkata',
    hour:'numeric',
    minute:'2-digit',
    second:'2-digit',
    hour12:true
  });
  function setClock(){
    if(!h || !m || !s) return;
    const now=new Date();
    const parts=Object.fromEntries(
      indiaClockParts.formatToParts(now)
        .filter(part=>part.type!=='literal')
        .map(part=>[part.type,part.value])
    );
    const sec=Number(parts.second || 0);
    const min=Number(parts.minute || 0)+sec/60;
    const hr=(Number(parts.hour || 0)%12)+min/60;
    h.style.transform=`translateX(-50%) rotate(${hr*30}deg)`;
    m.style.transform=`translateX(-50%) rotate(${min*6}deg)`;
    s.style.transform=`translateX(-50%) rotate(${sec*6}deg)`;

    if(digital){
      digital.textContent=indiaClockText.format(now);
      digital.dateTime=now.toISOString();
      digital.setAttribute('aria-label',`Current Grub Time ${digital.textContent}, India Standard Time`);
    }
  }
  if(h&&m&&s){ setClock(); setInterval(setClock,1000); }

  document.querySelectorAll('.js-year').forEach(el=>el.textContent=new Date().getFullYear());
})();

/* GRUB MONKEYS — KOT 069 hero printer interaction */
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
      href:'/menu'
    },
    {
      title:'WING DEPARTMENT',
      lines:['START SAFE → MAPLE GLAZED','TURN IT UP → PERI PERI','GO FULL MONKEY → GHOST PEPPER'],
      note:'20+ FLAVOURS. PICK YOUR DAMAGE.',
      cta:'SEE THE WINGS',
      href:'/menu'
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
    contentEl.innerHTML=`<strong class="kot-ticket-title">${safe(ticket.title)}</strong>${ticket.lines.map(line=>`<p>${safe(line)}</p>`).join('')}<strong class="kot-house-rule">${safe(ticket.note)}</strong>`;
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

/* GRUB MONKEYS — vinyl storage reveal around jukebox */
(function(){
  const field=document.querySelector('.juke-vinyl-field');
  const rack=document.getElementById('vinylRack');
  const records=document.getElementById('vinylRackRecords');
  if(!field || !rack || !records) return;

  function setOpen(open){
    field.classList.toggle('is-open',open);
    rack.setAttribute('aria-expanded',String(open));
    records.setAttribute('aria-hidden',String(!open));
    const subtitle=rack.querySelector('.vinyl-rack__subtitle');
    if(subtitle) subtitle.textContent=open ? 'TAP TO CLOSE' : 'TAP TO OPEN';
  }

  setOpen(false);

  rack.addEventListener('click',()=>{
    setOpen(!field.classList.contains('is-open'));
  });

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && field.classList.contains('is-open')) setOpen(false);
  });
})();
