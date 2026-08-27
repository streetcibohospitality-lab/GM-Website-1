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
      setTimeout(()=>intro.classList.add('is-leaving'),1150);
      setTimeout(()=>intro.remove(),1500);
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
          <p>Pick your appetite and your lane. Every pull is a fresh menu pick — the hungrier you are, the bigger the order.</p>
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
              <small class="gm-hunger-guide">1 pick · 2 picks · 4 picks</small>
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

    /*
       Recommendation engine
       ---------------------
       Pools are curated only from item names present in menu.html.
       Appetite changes both the type and number of recommendations:
       - Hungry:      1 lighter main
       - Very Hungry: 1 main + 1 side
       - Destroy Me:  1 feast main + 1 side + 1 extra + 1 shake/drink

       The result is randomized on first view, on every selector click,
       and every time the visitor pulls the selector again.
    */
    const menuPools={
      veg:{
        lightMain:[
          'Classic Veg','Herb & Chilli','Deep Fried Veg','BBQ Cottage Cheese',
          'Peri Peri Cottage 🌶','Cheesy Potatoes','Fried Mushroom & Potato'
        ],
        main:[
          'Grilled Cottage','Melted Mozzarella Veg','Coles Cottage',
          'Herb Chilly Mushroom Burger','Pot & Shrooms Burger','Herbivore',
          'Alfredo Cottage Cheese & Veggies','Batter Fried Cottage',
          'Thai Sandwich Cottage','Creamy Burnt Garlic Cottage',
          "Flamin' Quesso 🌶🌶🌶",'Creamy Burnt Garlic Cheese'
        ],
        feastMain:[
          'Flamin Cottage Burger 🌶🌶🌶','Herbivore','Pot & Shrooms Burger',
          'Raging Pot-aah-to 🌶🌶🌶','Alfredo Cottage Cheese & Veggies',
          'Melted Mozzarella Veg'
        ],
        side:[
          'Dirty Fries','Wild West','Cheese & Chipotle','Thundering Fries',
          'Fries Mexicana','Loaded Nachos','Peri Peri Fried Corn 🌶',
          'Jalapeño Pops','Potato Wedges','Pizza Fingers','Classic Mac'
        ],
        extra:[
          'Loaded Nachos','Classic Mac','Pizza Fingers','Dirty Fries',
          'Peri Peri Fried Mushroom 🌶','Caesar Salad'
        ]
      },
      chicken:{
        lightMain:[
          'Original Burger','Spicy Pulled Chicken 🌶','Batter Fried Chicken',
          'Chicken Mince','Classic Dog','Cheese Dog',
          'Spicy Grill Chicken & Cheddar 🌶','Smoked Chicken & Ranch'
        ],
        main:[
          'The Afrikaan 🌶','Nashville 🌶','Rush Hour','Bexr Kexr',
          'Hot Garlic Chicken 🌶','Dirty Dog','Chilli Dog 🌶','Texan Dog',
          'Chicken Bacon Lettuce Tomato (BLT)','Buffalo Chicken 🌶',
          'Chicken Chilly 🌶','Spicy Grill Chicken & Cheddar Cheese'
        ],
        feastMain:[
          'Korean Kong','Boston Burger','The Fire House 🌶🌶🌶',
          'Spitfire Thighs 🌶🌶🌶','Spitfire Dawg 🌶🌶🌶'
        ],
        side:[
          'Chickpop Fries','Chicken & Cheese','Loaded Fries',
          'Southwest Fried Chicken Fries','Fried Chicken Salad',
          'Buffalo Chicken 🌶','Chicken Chilly 🌶'
        ],
        extra:[
          'Wings — Honey Gochujang','Wings — Texas BBQ',
          'Wings — Lemon Pepper Ranch','Wings — Sriracha Blaze',
          'Chicken Strips — Wildfire Tenders','Chicken Strips — Buffalo Strips',
          'Southwest Fried Chicken Fries'
        ]
      },
      other:{
        lightMain:[
          'Fish O Filet','Fried Shrimp Wrap','Honey Roasted Salami',
          'Cajun Fried Shrimp 🌶','Prawn Pesto','African Janga 🌶'
        ],
        main:[
          'Caribbean Shrimp Burger','Honey Fire Shrimp','Pesto Shrimp',
          'Fish & Chips','Flamin Shrimps 🌶','Shrimp & Cheese',
          'Creamy Shrimp & Chicken Ham','The Carnivore'
        ],
        feastMain:[
          'Jaws And Claws','Angry Nemo 🌶🌶🌶','All Meat Po-Daddy',
          'The Carnivore','Caribbean Shrimp Burger','Fish & Chips'
        ],
        side:[
          'Seafood Nachos',"Pepper'd Fish & Lime",'Prawn Salsa & Cheese',
          'African Janga 🌶','Flamin Shrimps 🌶','Shrimp & Cheese'
        ],
        extra:[
          'Seafood Nachos','Prawn Salsa & Cheese','Pesto Shrimp',
          'African Janga 🌶','Flamin Shrimps 🌶','Fish & Chips'
        ]
      }
    };

    const drinkPool=[
      'PBJ (Peanut Butter Jelly)','Muddy Strawberry','Cotton Candy',
      'Walnut Brownie Shake','Chocolate Malt','Nutto Coffee',
      'Virgin Mojito','Berry Cherry','Peach Passion'
    ];

    const plans={
      hungry:[['lightMain','MAIN']],
      very:[['main','MAIN'],['side','SIDE']],
      destroy:[['feastMain','MAIN'],['side','SIDE'],['extra','EXTRA'],['drink','SHAKE / DRINK']]
    };

    const state={hunger:'hungry',protein:'veg'};
    const lastResults=new Map();

    const laneNames={veg:'VEG',chicken:'CHICKEN',other:'OTHER'};
    const titleNames={hungry:'HOUSE PICK',very:'BIG APPETITE PICK',destroy:'FULL MONKEY MODE'};

    function randomInt(max){
      if(max<=1) return 0;
      if(window.crypto?.getRandomValues){
        const bucket=new Uint32Array(1);
        window.crypto.getRandomValues(bucket);
        return bucket[0]%max;
      }
      return Math.floor(Math.random()*max);
    }

    function choose(pool,used){
      const available=pool.filter(item=>!used.has(item));
      const source=available.length?available:pool;
      return source[randomInt(source.length)];
    }

    function buildResult(){
      const lane=menuPools[state.protein];
      const plan=plans[state.hunger];
      const used=new Set();
      const picks=[];

      plan.forEach(([poolName,role])=>{
        const pool=poolName==='drink'?drinkPool:lane[poolName];
        const item=choose(pool,used);
        if(item){
          used.add(item);
          picks.push({role,item});
        }
      });

      return picks;
    }

    function freshResult(){
      const key=`${state.protein}:${state.hunger}`;
      let picks=buildResult();
      let signature=picks.map(pick=>pick.item).join('|');
      let attempts=0;

      while(signature===lastResults.get(key) && attempts<10){
        picks=buildResult();
        signature=picks.map(pick=>pick.item).join('|');
        attempts+=1;
      }

      lastResults.set(key,signature);
      return picks;
    }

    function dispense(){
      const card=$('.gm-fortune-card',section);
      const machine=$('.gm-fortune-machine',section);
      const pull=$('.gm-fortune-pull',section);
      const picks=freshResult();
      const count=picks.length;
      const lane=laneNames[state.protein];
      const title=titleNames[state.hunger];

      const cardSpace=count>=4?330:count===2?255:215;
      machine.style.setProperty('--gm-fortune-card-space',`${cardSpace}px`);
      machine.dataset.pickCount=String(count);

      card.innerHTML=`
        <strong>${title}</strong>
        <div class="gm-fortune-result-meta">${count} MENU PICK${count===1?'':'S'} · ${lane}</div>
        <ul>${picks.map(pick=>`<li><span>${pick.role}</span><b>${pick.item}</b></li>`).join('')}</ul>
        <small>${sessionText} · RANDOMIZED FROM THE CURRENT MENU · <a href="/menu" style="color:inherit;font-weight:900">VIEW MENU →</a></small>`;

      machine.classList.remove('is-dispensing');
      void machine.offsetWidth;
      machine.classList.add('is-dispensing');
      pull.textContent='PULL AGAIN ↻';
    }

    $$('.gm-fortune-group',section).forEach(group=>{
      $$('.gm-selector-btn',group).forEach(btn=>btn.addEventListener('click',()=>{
        $$('.gm-selector-btn',group).forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
        state[group.dataset.group]=btn.dataset.value;
        dispense();
      }));
    });

    $('.gm-fortune-pull',section).addEventListener('click',dispense);

    // The machine should always have a real recommendation visible.
    // Start with a randomized Hungry + Veg pick, then refresh on every interaction.
    window.setTimeout(dispense,180);
  }

  /* ----------------------------------------------------------
     4. SAUCE HEAT METER — approved live-CSS instrument.
     Heat grouping comes from the brand's own heat graphic
     (red/top = hottest, green/bottom = mildest) and matches the
     twenty Wings - Rs.220 flavours on this page exactly.
     Production never auto-cycles: the visitor drives the level.
     ---------------------------------------------------------- */
  const wingsPanel=$('#m1');
  if(wingsPanel && !$('#gmHeatMeter')){
    const heat=document.createElement('section');
    heat.className='gm-sauce-meter';
    heat.id='gmHeatMeter';
    heat.dataset.level='0';
    heat.setAttribute('aria-labelledby','gmSauceMeterTitle');
    heat.innerHTML=`
      <header class="gm-sauce-meter__head">
        <div>
          <p class="gm-sauce-meter__eyebrow">GRUB MONKEYS · SAUCE CONTROL 063</p>
          <h3 id="gmSauceMeterTitle">Pick your heat.</h3>
        </div>
        <div class="gm-sauce-meter__live" aria-hidden="true">
          <span class="gm-sauce-meter__live-dot"></span>
          LIVE
        </div>
      </header>
      <div class="gm-sauce-meter__grid">
        <figure class="gm-sauce-meter__photo">
          <img src="images/food/02-wing-sauce-action.jpeg" alt="Glazed chicken wing being dipped into sauce" width="1122" height="1402" loading="lazy" decoding="async">
          <figcaption class="gm-sauce-meter__photo-label">
            <span>WING TEST</span>
            <strong>SAUCE / 063</strong>
          </figcaption>
        </figure>
        <div class="gm-sauce-meter__instrument" aria-label="Interactive sauce heat meter">
          <span class="gm-sauce-meter__screw gm-sauce-meter__screw--1" aria-hidden="true"></span>
          <span class="gm-sauce-meter__screw gm-sauce-meter__screw--2" aria-hidden="true"></span>
          <span class="gm-sauce-meter__screw gm-sauce-meter__screw--3" aria-hidden="true"></span>
          <span class="gm-sauce-meter__screw gm-sauce-meter__screw--4" aria-hidden="true"></span>
          <div class="gm-sauce-meter__dial-wrap">
            <div class="gm-sauce-meter__dial" aria-hidden="true">
              <div class="gm-sauce-meter__ticks"></div>
              <div class="gm-sauce-meter__segment gm-sauce-meter__segment--mild"></div>
              <div class="gm-sauce-meter__segment gm-sauce-meter__segment--warm"></div>
              <div class="gm-sauce-meter__segment gm-sauce-meter__segment--hot"></div>
              <div class="gm-sauce-meter__segment gm-sauce-meter__segment--monkey"></div>
              <span class="gm-sauce-meter__dial-label gm-sauce-meter__dial-label--mild">MILD</span>
              <span class="gm-sauce-meter__dial-label gm-sauce-meter__dial-label--warm">WARM</span>
              <span class="gm-sauce-meter__dial-label gm-sauce-meter__dial-label--hot">HOT</span>
              <span class="gm-sauce-meter__dial-label gm-sauce-meter__dial-label--monkey">MONKEY<br>BUSINESS</span>
              <div class="gm-sauce-meter__needle" id="gmSauceNeedle"></div>
              <div class="gm-sauce-meter__hub"><span>63</span></div>
            </div>
            <div class="gm-sauce-meter__glass" aria-hidden="true"></div>
          </div>
          <div class="gm-sauce-meter__buttons" role="group" aria-label="Choose a sauce heat level">
            <button class="gm-sauce-meter__level is-active" type="button" data-level="0" aria-pressed="true"><i aria-hidden="true"></i><span>MILD</span></button>
            <button class="gm-sauce-meter__level" type="button" data-level="1" aria-pressed="false"><i aria-hidden="true"></i><span>WARM</span></button>
            <button class="gm-sauce-meter__level" type="button" data-level="2" aria-pressed="false"><i aria-hidden="true"></i><span>HOT</span></button>
            <button class="gm-sauce-meter__level" type="button" data-level="3" aria-pressed="false"><i aria-hidden="true"></i><span>MONKEY<br>BUSINESS</span></button>
          </div>
          <div class="gm-sauce-meter__printer" aria-live="polite" aria-atomic="true">
            <div class="gm-sauce-meter__slot" aria-hidden="true"><span></span></div>
            <article class="gm-sauce-meter__ticket" id="gmSauceTicket">
              <div class="gm-sauce-meter__ticket-top">
                <span>HEAT LEVEL</span>
                <span>ORDER 063</span>
              </div>
              <h4 id="gmSauceLevelName">MILD</h4>
              <ul id="gmSauceFlavourList"></ul>
              <footer>
                <span>5 FLAVOURS</span>
                <span>MONKEY APPROVED</span>
              </footer>
            </article>
          </div>
        </div>
      </div>
      <p class="gm-sauce-meter__hint">
        Pick a heat level. The needle swings live and the flavour ticket reprints.
      </p>`;
    wingsPanel.prepend(heat);

    const ticket=$('#gmSauceTicket',heat);
    const levelName=$('#gmSauceLevelName',heat);
    const list=$('#gmSauceFlavourList',heat);
    const buttons=$$('.gm-sauce-meter__level',heat);

    /* HEAT-DATA.md is the source of truth for the flavours and their order,
       which must not be reordered. Names are reproduced as supplied --
       including "Carolina Gold (BBQ & Must)" -- with one deliberate
       exception: HEAT-DATA.md spells it "Carribean", corrected to
       "Caribbean" here and across menu.html on request. The rest of the
       site already used the correct spelling, so this also settles a
       disagreement between the menu and the random-order feature. */
    const levels=[
      {name:'MILD',angle:-160,accent:'#00DDC2',
        flavours:['Cheese Sauce','Thai Chilli','Honey Buffalo','Teriyaki','Maple Glazed']},
      {name:'WARM',angle:-118,accent:'#E5A12A',
        flavours:['Caribbean Dry','Creamy Butter Garlic','Lemon Pepper Ranch','Sesame Thai Glaze Lemon','Carolina Gold (BBQ & Must)']},
      {name:'HOT',angle:-62,accent:'#E95C22',
        flavours:['Nashville','Texas BBQ','Citrus Pepper','Lemon Chilli Dry','Peri Peri Dry']},
      {name:'MONKEY BUSINESS',angle:-20,accent:'#EB0000',
        flavours:['Ghost Pepper','Spicy Strawberry','Honey Gochujang','Buffalo Sauce','Sriracha Blaze']}
    ];

    function renderFlavours(items){
      list.replaceChildren(...items.map(flavour=>{
        const li=document.createElement('li');
        li.textContent=flavour;
        return li;
      }));
    }

    function animateTicket(){
      if(reduceMotion) return;
      ticket.classList.remove('is-printing');
      void ticket.offsetWidth;
      ticket.classList.add('is-printing');
      window.setTimeout(()=>ticket.classList.remove('is-printing'),560);
    }

    /* The menu lists three flavours per row, so a row can straddle two heat
       levels; highlighting whichever rows contain the selected flavours is
       still the fastest way to find the sauce in the list below. Parentheticals
       are stripped because the menu prints "Carolina Gold" without the suffix. */
    function highlightRows(flavours){
      const names=flavours.map(f=>f.replace(/\s*\(.*\)\s*/,'').trim().toLowerCase());
      $$('.menu-row.multi',wingsPanel).forEach(row=>{
        const text=(row.textContent||'').toLowerCase();
        row.classList.toggle('gm-heat-match',names.some(name=>text.includes(name)));
      });
    }

    function setLevel(index,animate){
      const safeIndex=Math.max(0,Math.min(levels.length-1,Number(index)));
      const data=levels[safeIndex];
      heat.dataset.level=String(safeIndex);
      heat.style.setProperty('--gm-sm-needle',`${data.angle}deg`);
      heat.style.setProperty('--gm-sm-active',data.accent);
      levelName.textContent=data.name;
      renderFlavours(data.flavours);
      buttons.forEach((button,buttonIndex)=>{
        const active=buttonIndex===safeIndex;
        button.classList.toggle('is-active',active);
        button.setAttribute('aria-pressed',active?'true':'false');
      });
      highlightRows(data.flavours);
      if(animate) animateTicket();
    }

    buttons.forEach(button=>{
      button.addEventListener('click',()=>setLevel(button.dataset.level,true));
    });

    setLevel(0,false);
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
    $$('.gm-tray-item',tray).forEach(btn=>btn.addEventListener('click',()=>{location.href=`/menu?tab=${encodeURIComponent(btn.dataset.tab)}`;}));
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
    $$('#order [data-order-platform],#order .order-actions a[href*="swiggy"],#order .order-actions a[href*="zomato"]').forEach(link=>{
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
     Only A1 has a verified feed in the current project. The other slots use
     the real `disabled` attribute rather than aria-disabled alone, so they
     are not keyboard-reachable dead controls, and they carry customer-facing
     copy rather than an authoring note. Enable them by giving each a real
     Mixcloud feed URL — never by faking different music.
     ---------------------------------------------------------- */
  const jukePlayer=$('#gmJukeboxPlayer');
  const mixcloud=$('.mixcloud-player',jukePlayer||document);
  if(jukePlayer && mixcloud && !$('.gm-juke-selector',jukePlayer)){
    const selector=document.createElement('div');
    selector.className='gm-juke-selector';
    selector.innerHTML=`
      <button type="button" class="gm-juke-select" data-code="A1" aria-pressed="true">A1 · Classic Rock</button>
      <button type="button" class="gm-juke-select" data-code="A2" aria-pressed="false" disabled>A2 · Coming Soon</button>
      <button type="button" class="gm-juke-select" data-code="B1" aria-pressed="false" disabled>B1 · Coming Soon</button>
      <button type="button" class="gm-juke-select" data-code="B2" aria-pressed="false" disabled>B2 · Coming Soon</button>
      <div class="gm-juke-selection-note">More mixes are being cut. A1 is spinning now.</div>`;
    jukePlayer.insertBefore(selector,mixcloud);
    $$('.gm-juke-select',selector).forEach(btn=>btn.addEventListener('click',()=>{
      if(btn.disabled) return;
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
     one curated special for each IST calendar day.
     ---------------------------------------------------------- */
  const oldBoard=$('#flipboard');
  if(oldBoard){
    const boardBand=oldBoard.closest('.flipboard-band');
    const specials=['KOREAN KONG','DIRTY FRIES','PBJ SHAKE'];

    // Daily, deterministic IST pick: every visitor sees the same special for
    // the same India calendar date. We derive the sequence from a fixed epoch
    // and prevent consecutive repeats without relying on local/session storage.
    const istDateParts=()=>{
      const parts=new Intl.DateTimeFormat('en-GB',{
        timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'
      }).formatToParts(new Date());
      return Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
    };
    const hashDay=(ordinal)=>{
      let x=(ordinal + 0x9e3779b9) | 0;
      x ^= x >>> 16; x=Math.imul(x,0x21f0aaad);
      x ^= x >>> 15; x=Math.imul(x,0x735a2d97);
      x ^= x >>> 15;
      return x >>> 0;
    };
    const d=istDateParts();
    const epoch=Date.UTC(2024,0,1);
    const today=Date.UTC(d.year,d.month-1,d.day);
    const dayIndex=Math.max(0,Math.floor((today-epoch)/86400000));
    let selected=hashDay(0)%specials.length;
    for(let n=1;n<=dayIndex;n++){
      let candidate=hashDay(n)%specials.length;
      if(candidate===selected) candidate=(candidate+1+(hashDay(n+7001)%(specials.length-1)))%specials.length;
      if(candidate===selected) candidate=(candidate+1)%specials.length;
      selected=candidate;
    }
    const special=specials[selected];
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
  if(order && !$('.gm-condiment-pair',order) && !order.classList.contains('counter-order-main')){
    const pair=document.createElement('div');
    pair.className='gm-condiment-pair';
    pair.setAttribute('aria-label','Diner condiment details');
    pair.innerHTML=`<button type="button" class="gm-condiment ketchup" aria-label="Ketchup bottle">K</button><button type="button" class="gm-condiment mustard" aria-label="Mustard bottle">M</button>`;
    /* Insert against .order-actions' own parent rather than assuming it is a
       direct child of #order. The Order + Hungry Yet consolidation wrapped it
       in .order-band__top, which made order.insertBefore(pair, actions) throw
       NotFoundError and abort the rest of this script — taking the condiment
       bottles and the motel keytag's picked state down with it. */
    const actions=$('.order-actions',order);
    if(actions && actions.parentNode) actions.parentNode.insertBefore(pair,actions);
    else order.appendChild(pair);
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
