/* ============================================================
   GRUB MONKEYS — INTERACTIVE DINER PATCH V2
   Visuals/motion live in CSS. JS only creates semantic markup,
   manages state, session identity, and interaction triggers.
   Load after the existing V11 scripts and after KOT 063 if present.
   ============================================================ */
(function(){
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  function safeStore(store, key, value){
    try{
      if(arguments.length===2) return store.getItem(key);
      store.setItem(key,value);
      return value;
    }catch(e){ return null; }
  }

  /* ----------------------------------------------------------
     1. DINER SESSION ID
     One session identity is reused in KOT, receipt, TV and order.
     ---------------------------------------------------------- */
  const sessionKey = 'gm_diner_session_v2';
  let session = null;
  try{ session = JSON.parse(safeStore(sessionStorage,sessionKey) || 'null'); }catch(e){}
  if(!session || !session.label || !session.number){
    const labels=['TABLE','BOOTH','COUNTER'];
    const numbers=['04','08','12','27','36','63'];
    session={
      label:labels[Math.floor(Math.random()*labels.length)],
      number:Math.random()<.28?'63':numbers[Math.floor(Math.random()*numbers.length)]
    };
    safeStore(sessionStorage,sessionKey,JSON.stringify(session));
  }
  const sessionText = `${session.label} ${session.number}`;

  function addSessionChip(container, className=''){
    if(!container || container.querySelector('.gm-session-chip')) return;
    const chip=document.createElement('span');
    chip.className=`gm-session-chip ${className}`.trim();
    chip.dataset.gmSession='';
    chip.textContent=sessionText;
    container.appendChild(chip);
  }
  $$('[data-gm-session]').forEach(el=>el.textContent=sessionText);

  // Existing KOT 063: replace the fixed WEB-063 only. Do not add another printer.
  const kotSessionRow = $('#kotTerminal .kot-meta span:nth-child(2)');
  if(kotSessionRow) kotSessionRow.innerHTML=`SESSION <b>${sessionText}</b>`;

  // Existing menu receipt: append one session line, only once.
  const receipt = $('#receiptCard');
  if(receipt && !receipt.querySelector('.gm-session-receipt-line')){
    const line=document.createElement('div');
    line.className='gm-session-receipt-line';
    line.style.cssText='margin-top:8px;font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;';
    line.textContent=`SESSION · ${sessionText}`;
    const thanks=receipt.querySelector('.receipt-thanks');
    if(thanks) receipt.insertBefore(line,thanks); else receipt.appendChild(line);
  }

  // TV overlay + order section reuse same session identity.
  addSessionChip($('.crt-foot'));
  addSessionChip($('#order > div:first-child'));

  /* ----------------------------------------------------------
     2. FIRST-VISIT OPEN SIGN
     First visit only; under 600ms and never shown again locally.
     ---------------------------------------------------------- */
  const isHome = !!$('#signature') && !!$('#order');
  if(isHome && !reduceMotion){
    const seenKey='gm_open_sign_seen_v2';
    const seen=safeStore(localStorage,seenKey);
    if(!seen){
      safeStore(localStorage,seenKey,'1');
      const intro=document.createElement('div');
      intro.className='gm-door-intro';
      intro.setAttribute('aria-hidden','true');
      intro.innerHTML=`
        <div class="gm-open-hanger">
          <div class="gm-open-sign">
            <strong>OPEN</strong>
            <small>${sessionText} · GRUB MONKEYS</small>
          </div>
        </div>`;
      document.body.appendChild(intro);
      setTimeout(()=>intro.classList.add('is-leaving'),340);
      setTimeout(()=>intro.remove(),590);
    }
  }

  /* ----------------------------------------------------------
     3. WHAT SHOULD I ORDER? — NEW, NOT PRESENT IN V11
     Uses actual menu item names from the current menu build.
     ---------------------------------------------------------- */
  const signature=$('#signature');
  if(isHome && signature && !$('#gmFortuneMachine')){
    const section=document.createElement('section');
    section.className='gm-fortune-section';
    section.id='gmFortuneMachine';
    section.innerHTML=`
      <div class="gm-fortune-shell">
        <div class="gm-fortune-copy">
          <span class="gm-machine-code">COUNTER 63 / HOUSE PICK</span>
          <h2>What Should<br><em>I Order?</em></h2>
          <p>Set your hunger level, pick your lane and pull the selector. The diner machine will throw you a combo.</p>
        </div>
        <div class="gm-fortune-machine">
          <div class="gm-fortune-controls">
            <div class="gm-fortune-group" data-group="hunger">
              <span>How hungry?</span>
              <div class="gm-selector-row">
                <button class="gm-selector-btn" type="button" data-value="hungry" aria-pressed="true">Hungry</button>
                <button class="gm-selector-btn" type="button" data-value="very" aria-pressed="false">Very Hungry</button>
                <button class="gm-selector-btn" type="button" data-value="destroy" aria-pressed="false">Destroy Me</button>
              </div>
            </div>
            <div class="gm-fortune-group" data-group="protein">
              <span>Pick your lane</span>
              <div class="gm-selector-row">
                <button class="gm-selector-btn" type="button" data-value="veg" aria-pressed="true">Veg</button>
                <button class="gm-selector-btn" type="button" data-value="chicken" aria-pressed="false">Chicken</button>
                <button class="gm-selector-btn" type="button" data-value="other" aria-pressed="false">Other</button>
              </div>
            </div>
            <button class="gm-fortune-pull" type="button">Pull The Selector ↓</button>
          </div>
          <div class="gm-card-slot" aria-hidden="true"></div>
          <div class="gm-fortune-card-window">
            <article class="gm-fortune-card" aria-live="polite">
              <strong>Ready When You Are.</strong>
              <ul><li>Pick your hunger.</li><li>Pick your lane.</li><li>Pull the selector.</li></ul>
              <small>${sessionText} · MACHINE READY</small>
            </article>
          </div>
        </div>
      </div>`;
    signature.insertAdjacentElement('afterend',section);

    const recs={
      veg:{
        hungry:['Classic Veg','Salted Fries'],
        very:['Melted Mozzarella Veg','Dirty Fries','PBJ Shake'],
        destroy:['Flamin Cottage Burger','Dirty Fries','PBJ Shake']
      },
      chicken:{
        hungry:['Original Burger','Salted Fries'],
        very:['Korean Kong','Dirty Fries','PBJ Shake'],
        destroy:['Korean Kong','Southwest Fried Chicken Fries','PBJ Shake']
      },
      other:{
        hungry:['Fish O Filet','Salted Fries'],
        very:['The Carnivore','Dirty Fries','PBJ Shake'],
        destroy:['Caribbean Shrimp Burger','Dirty Fries','PBJ Shake']
      }
    };
    const state={hunger:'hungry',protein:'veg'};
    $$('.gm-fortune-group',section).forEach(group=>{
      $$('.gm-selector-btn',group).forEach(btn=>btn.addEventListener('click',()=>{
        $$('.gm-selector-btn',group).forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
        state[group.dataset.group]=btn.dataset.value;
      }));
    });
    $('.gm-fortune-pull',section).addEventListener('click',()=>{
      const card=$('.gm-fortune-card',section);
      const items=recs[state.protein][state.hunger];
      const title=state.hunger==='destroy'?'FULL MONKEY MODE':state.hunger==='very'?'BIG APPETITE PICK':'HOUSE PICK';
      card.innerHTML=`<strong>${title}</strong><ul>${items.map(item=>`<li>${item}</li>`).join('')}</ul><small>${sessionText} · <a href="menu.html" style="color:inherit;font-weight:900">VIEW MENU →</a></small>`;
      $('.gm-fortune-machine',section).classList.remove('is-dispensing');
      void $('.gm-fortune-machine',section).offsetWidth;
      $('.gm-fortune-machine',section).classList.add('is-dispensing');
    });
  }

  /* ----------------------------------------------------------
     4. SAUCE HEAT METER — NEW MENU UTILITY
     Curated heat grouping must be kitchen-verified before launch.
     ---------------------------------------------------------- */
  const wingsPanel=$('#m1');
  if(wingsPanel && !$('#gmHeatMeter')){
    const heat=document.createElement('section');
    heat.className='gm-heat-meter';
    heat.id='gmHeatMeter';
    heat.innerHTML=`
      <div class="gm-heat-head">
        <strong>Sauce Heat Meter</strong>
        <small>Mild → Hot → Monkey Business</small>
      </div>
      <img class="gm-heat-shot" src="images/food/02-wing-sauce-action.jpeg" alt="Grub Monkeys wings being tossed in sauce" width="1122" height="1402" loading="lazy" decoding="async">
      <div class="gm-gauge">
        <div class="gm-gauge-arc" aria-hidden="true"></div>
        <div class="gm-gauge-needle" aria-hidden="true"></div>
        <div class="gm-gauge-center" aria-hidden="true"></div>
        <span class="gm-gauge-label mild">Mild</span>
        <span class="gm-gauge-label hot">Hot</span>
        <span class="gm-gauge-label monkey">Monkey Business</span>
      </div>
      <label>
        <span class="sr-only">Wing heat level</span>
        <input class="gm-heat-range" type="range" min="0" max="3" step="1" value="0" aria-describedby="gmHeatResult">
      </label>
      <div class="gm-heat-result" id="gmHeatResult" aria-live="polite"><b>Mild</b><p>Maple Glazed · Teriyaki · Creamy Butter Garlic · Garlic Parmesan</p></div>`;
    wingsPanel.prepend(heat);
    const range=$('.gm-heat-range',heat);
    const gauge=$('.gm-gauge',heat);
    const result=$('.gm-heat-result',heat);
    const levels=[
      {name:'Mild',angle:-72,flavours:'Maple Glazed · Teriyaki · Creamy Butter Garlic · Garlic Parmesan'},
      {name:'Warm',angle:-28,flavours:'Texas BBQ · Carolina Gold · Honey Buffalo · Citrus Pepper'},
      {name:'Hot',angle:22,flavours:'Peri Peri Dry · Buffalo Sauce · Sriracha Blaze · Nashville · Thai Chilli'},
      {name:'Monkey Business',angle:70,flavours:'Ghost Pepper · Mango Habanero · Honey Gochujang'}
    ];
    function setHeat(){
      const level=levels[Number(range.value)];
      gauge.style.setProperty('--gm-heat-angle',`${level.angle}deg`);
      result.innerHTML=`<b>${level.name}</b><p>${level.flavours}</p>`;
      const names=level.flavours.split(' · ');
      $$('.menu-row.multi',wingsPanel).forEach(row=>{
        const text=(row.textContent||'').toLowerCase();
        row.classList.toggle('gm-heat-match',names.some(name=>text.includes(name.toLowerCase())));
      });
    }
    range.addEventListener('input',setHeat);
    setHeat();
  }

  /* Deep-link from the counter tray to existing menu tabs. */
  const tabParam=new URLSearchParams(location.search).get('tab');
  if(tabParam){
    const tabMap={fries:'menu-tab-0',wings:'menu-tab-1',burgers:'menu-tab-5',shakes:'menu-tab-7'};
    const tab=document.getElementById(tabMap[tabParam]);
    if(tab){ setTimeout(()=>{tab.click();tab.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'center'});},80); }
  }

  /* ----------------------------------------------------------
     5. COUNTER TRAY — NEW, REUSES ORDER SECTION
     ---------------------------------------------------------- */
  const order=$('#order');
  if(order && !$('.gm-counter-tray',order)){
    const tray=document.createElement('div');
    tray.className='gm-counter-tray';
    tray.innerHTML=`
      <div class="gm-tray-ticket"><span>${sessionText}</span><span>PICK A TRAY ITEM</span></div>
      <div class="gm-tray-items">
        <button type="button" class="gm-tray-item" data-tab="burgers">Burgers</button>
        <button type="button" class="gm-tray-item" data-tab="fries">Fries</button>
        <button type="button" class="gm-tray-item" data-tab="shakes">Shakes</button>
      </div>`;
    order.appendChild(tray);
    $$('.gm-tray-item',tray).forEach(btn=>btn.addEventListener('click',()=>{location.href=`menu.html?tab=${encodeURIComponent(btn.dataset.tab)}`;}));
    if('IntersectionObserver' in window && !reduceMotion){
      const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){tray.classList.add('in');io.disconnect();}}),{threshold:.25});
      io.observe(order);
    }else tray.classList.add('in');
  }

  /* ----------------------------------------------------------
     6. ORDER STATUS BOARD — NEW, very short conversion feedback
     ---------------------------------------------------------- */
  if(order && !$('.gm-order-status',order)){
    const board=document.createElement('div');
    board.className='gm-order-status';
    board.setAttribute('role','status');
    board.setAttribute('aria-live','polite');
    board.innerHTML=`<div class="gm-order-status-head"><span>KITCHEN STATUS</span><span>${sessionText}</span></div><div class="gm-order-status-line">ORDER RECEIVED</div>`;
    order.appendChild(board);
    const line=$('.gm-order-status-line',board);
    $$('#order .order-actions a[href*="swiggy"],#order .order-actions a[href*="zomato"]').forEach(link=>{
      link.addEventListener('click',e=>{
        if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
        e.preventDefault();
        const href=link.href;
        let popup=null;
        if(!reduceMotion){
          try{ popup=window.open('about:blank','_blank'); if(popup) popup.opener=null; }catch(err){}
        }
        board.classList.add('show');
        const stages=['ORDER RECEIVED','GRILL ON','MONKEY APPROVED'];
        const step=reduceMotion?25:220;
        stages.forEach((stage,i)=>setTimeout(()=>{line.textContent=stage;},i*step));
        const delay=reduceMotion?80:700;
        setTimeout(()=>{
          if(popup && !popup.closed){ try{popup.location.href=href;}catch(err){location.href=href;} }
          else location.href=href;
        },delay);
      });
    });
  }

  /* ----------------------------------------------------------
     7. JUKEBOX SELECTOR — UPGRADE EXISTING JUKEBOX ONLY
     Only A1 has a verified feed in the current project. Other slots
     are intentionally disabled rather than faking different music.
     Claude may enable them when approved feed URLs are supplied.
     ---------------------------------------------------------- */
  const jukePlayer=$('#gmJukeboxPlayer');
  const mixcloud=$('.mixcloud-player',jukePlayer||document);
  if(jukePlayer && mixcloud && !$('.gm-juke-selector',jukePlayer)){
    const selector=document.createElement('div');
    selector.className='gm-juke-selector';
    selector.innerHTML=`
      <button type="button" class="gm-juke-select" data-code="A1" aria-pressed="true">A1 · Classic Rock</button>
      <button type="button" class="gm-juke-select" data-code="A2" aria-pressed="false" aria-disabled="true">A2 · Add Mix</button>
      <button type="button" class="gm-juke-select" data-code="B1" aria-pressed="false" aria-disabled="true">B1 · Add Mix</button>
      <button type="button" class="gm-juke-select" data-code="B2" aria-pressed="false" aria-disabled="true">B2 · Add Mix</button>
      <div class="gm-juke-selection-note">A1 uses the currently approved Mixcloud feed. Add real feed URLs before enabling A2/B1/B2.</div>`;
    jukePlayer.insertBefore(selector,mixcloud);
    $$('.gm-juke-select',selector).forEach(btn=>btn.addEventListener('click',()=>{
      if(btn.getAttribute('aria-disabled')==='true') return;
      $$('.gm-juke-select',selector).forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
      // Reload the verified feed only on explicit user selection; never autoplay.
      const src=mixcloud.getAttribute('src');
      mixcloud.setAttribute('src','about:blank');
      setTimeout(()=>mixcloud.setAttribute('src',src),reduceMotion?0:90);
    }));
  }

  /* ----------------------------------------------------------
     8. PHOTO BOOTH MODE — UPGRADE EXISTING GRUB IRL PHOTOS
     ---------------------------------------------------------- */
  const social=$('#gallery');
  const socialStrip=$('.social-strip',social||document);
  if(social && socialStrip && !$('#gmPhotoBoothStage')){
    const head=$('.social-head',social);
    if(head && !$('.gm-photobooth-trigger',head)){
      const trigger=document.createElement('button');
      trigger.className='gm-photobooth-trigger';
      trigger.type='button';
      trigger.textContent='PHOTO BOOTH';
      head.appendChild(trigger);

      const stage=document.createElement('div');
      stage.className='gm-photobooth-stage';
      stage.id='gmPhotoBoothStage';
      const imgs=$$('img',socialStrip).slice(0,4);
      stage.innerHTML=`<div class="gm-booth-machine"><div class="gm-booth-flash" aria-hidden="true"></div><div class="gm-photo-strip">${imgs.map(img=>`<img src="${img.getAttribute('src')}" alt="${(img.getAttribute('alt')||'Grub Monkeys diner photo').replace(/"/g,'&quot;')}">`).join('')}</div></div>`;
      socialStrip.insertAdjacentElement('afterend',stage);
      trigger.addEventListener('click',()=>{
        stage.classList.add('open');
        stage.classList.remove('shooting','done');
        void stage.offsetWidth;
        if(reduceMotion){stage.classList.add('done');return;}
        stage.classList.add('shooting');
        setTimeout(()=>{stage.classList.remove('shooting');stage.classList.add('done');},1450);
      });
    }
  }

  /* ----------------------------------------------------------
     9. SPECIAL OF THE DAY — REUSE V11 FLIPBOARD, NO SECOND BOARD
     Clone detaches it from V11's old cycling interval, then chooses
     one curated special once per session.
     ---------------------------------------------------------- */
  const oldBoard=$('#flipboard');
  if(oldBoard){
    const boardBand=oldBoard.closest('.flipboard-band');
    const currentSpecialKey='gm_session_special_v2';
    const specials=['KOREAN KONG','DIRTY FRIES','PBJ SHAKE'];
    let special=safeStore(sessionStorage,currentSpecialKey);
    if(!special || !specials.includes(special)){
      special=specials[Math.floor(Math.random()*specials.length)];
      safeStore(sessionStorage,currentSpecialKey,special);
    }
    // Detach visible board from the legacy interval without touching the old source at runtime.
    const newBoard=oldBoard.cloneNode(true);
    oldBoard.replaceWith(newBoard);
    newBoard.removeAttribute('data-messages');
    if(boardBand){
      boardBand.classList.add('gm-special-board');
      const title=$('.flipboard-copy strong',boardBand); if(title) title.textContent='Special Of The Day';
      const kicker=$('.flip-kicker',boardBand); if(kicker) kicker.textContent='MECHANICAL BOARD';
    }
    const current=$('#flipCurrent',newBoard);
    const next=$('#flipNext',newBoard);
    if(current && next){
      current.textContent='TODAY';
      next.textContent=special;
      if(reduceMotion){current.textContent=special;}
      else setTimeout(()=>{
        newBoard.classList.add('flipping');
        setTimeout(()=>{current.textContent=special;newBoard.classList.remove('flipping');},620);
      },350);
    }
  }

  /* ----------------------------------------------------------
     10. KOT TEAR-OFF — EXTEND EXISTING KOT, NO SECOND RECEIPT
     ---------------------------------------------------------- */
  const kot=$('#kotTerminal');
  const tear=$('#kotTerminal .kot-tear');
  if(kot && tear){
    tear.setAttribute('role','button');
    tear.setAttribute('tabindex','0');
    tear.setAttribute('aria-label','Tear off the KOT action coupon');
    const doTear=()=>{
      if(!kot.classList.contains('is-printed')) return;
      kot.classList.remove('is-torn');
      void kot.offsetWidth;
      kot.classList.add('is-torn');
    };
    tear.addEventListener('click',doTear);
    tear.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();doTear();}});
    $('#kotPrintButton')?.addEventListener('click',()=>kot.classList.remove('is-torn'));
  }

  /* ----------------------------------------------------------
     11. CONDIMENT DETAILS — NEW CSS OBJECTS, ONE LOCATION ONLY
     ---------------------------------------------------------- */
  if(order && !$('.gm-condiment-pair',order)){
    const pair=document.createElement('div');
    pair.className='gm-condiment-pair';
    pair.setAttribute('aria-label','Diner condiment details');
    pair.innerHTML=`<button type="button" class="gm-condiment ketchup" aria-label="Ketchup bottle">K</button><button type="button" class="gm-condiment mustard" aria-label="Mustard bottle">M</button>`;
    const actions=$('.order-actions',order);
    if(actions) order.insertBefore(pair,actions); else order.appendChild(pair);
  }

  /* ----------------------------------------------------------
     12. PICK YOUR BOOTH — REMOVED AS A DUPLICATE
     V11 already has an interactive motel key/location selector.
     We only add a picked state to that existing object.
     ---------------------------------------------------------- */
  const motel=$('#motelKeytag');
  if(motel){
    $$('.loc-row').forEach(row=>{
      ['mouseenter','focusin','click'].forEach(evt=>row.addEventListener(evt,()=>{
        motel.classList.add('gm-location-picked');
      }));
    });
  }
})();
