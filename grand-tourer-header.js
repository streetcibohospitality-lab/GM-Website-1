
(function(){
  const nav=document.getElementById('siteNav');
  if(!nav || !nav.classList.contains('gm-grand-nav')) return;

  const list=nav.querySelector('.nav-links');
  const links=[...nav.querySelectorAll('.nav-links a')];
  const logo=nav.querySelector('.nav-logo');
  const badge=logo?.querySelector('img');
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer=window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  let current=null;
  let hover=null;
  let lastScrollY=window.scrollY;
  let scrollRAF=0;
  let pointerRAF=0;
  let pointerX=50;
  let logoX=0;
  let logoY=0;

  function measure(link){
    if(!list || !link){
      list?.style.setProperty('--gt-marker-o','0');
      return;
    }
    const lr=list.getBoundingClientRect();
    const rr=link.getBoundingClientRect();
    const inset=Math.max(11,Math.min(18,rr.width*.19));
    list.style.setProperty('--gt-marker-x',`${rr.left-lr.left+inset}px`);
    list.style.setProperty('--gt-marker-w',`${Math.max(22,rr.width-inset*2)}px`);
    list.style.setProperty('--gt-marker-o','1');
  }

  function showCurrent(link){
    current=link||null;
    links.forEach(a=>{
      const active=a===current;
      a.classList.toggle('is-current',active);
      if(active) a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
    if(!hover) measure(current);
  }

  function restoreMarker(){
    hover=null;
    measure(current);
  }

  /* ---------------------------------------------------------
     Ignition choreography
     OPEN clears → badge settles → chrome catches → marker glides
     into place → jewel light softly illuminates.
     The header remains fully usable throughout.
     --------------------------------------------------------- */
  let ignitionStarted=false;
  function ignite(){
    if(ignitionStarted) return;
    ignitionStarted=true;

    if(reduce){
      nav.classList.add('is-ignition','is-ready','is-marker-live','is-lit');
      return;
    }

    nav.classList.add('is-ignition');
    window.setTimeout(()=>nav.classList.add('is-ready'),140);
    window.setTimeout(()=>{
      nav.classList.add('is-marker-live');
      measure(hover||current);
    },430);
    window.setTimeout(()=>nav.classList.add('is-lit'),650);
  }

  const intro=document.querySelector('.gm-door-intro');
  if(intro && !reduce){
    window.setTimeout(ignite,1520);
  }else{
    window.setTimeout(ignite,90);
  }

  /* Page-level active state. */
  const path=location.pathname.replace(/\/+$/,'') || '/';
  if(path==='/menu'){
    showCurrent(links.find(a=>a.getAttribute('href')==='/menu'));
  }else if(path==='/franchise'){
    showCurrent(links.find(a=>a.getAttribute('href')==='/franchise'));
  }else{
    showCurrent(null);
  }

  /* Red carriage previews hovered/focused destinations, then returns. */
  links.forEach(link=>{
    link.addEventListener('pointerenter',()=>{
      hover=link;
      measure(link);
    });
    link.addEventListener('pointerleave',restoreMarker);
    link.addEventListener('focus',()=>{
      hover=link;
      measure(link);
    });
    link.addEventListener('blur',restoreMarker);
  });

  /* Homepage section awareness. */
  if(path==='/' && 'IntersectionObserver' in window){
    const targets=[
      [document.getElementById('locations'),links.find(a=>a.getAttribute('href')==='#locations')],
      [document.getElementById('story'),links.find(a=>a.getAttribute('href')==='#story')]
    ].filter(([el,link])=>el&&link);

    const ratios=new Map();
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        ratios.set(entry.target,entry.isIntersecting?entry.intersectionRatio:0);
      });
      let best=null;
      let score=.20;
      targets.forEach(([el,link])=>{
        const ratio=ratios.get(el)||0;
        if(ratio>score){
          score=ratio;
          best=link;
        }
      });
      showCurrent(best);
    },{
      rootMargin:'-24% 0px -57% 0px',
      threshold:[0,.2,.35,.55,.75]
    });

    targets.forEach(([el])=>observer.observe(el));
  }

  /* ---------------------------------------------------------
     Scroll-linked chrome:
     only a subtle 14% travel and brightness change, so it feels
     like polished metal catching environmental light.
     --------------------------------------------------------- */
  function paintScroll(){
    scrollRAF=0;
    const y=lastScrollY;
    const progress=Math.max(0,Math.min(1,y/520));
    const chromeX=47+(progress*9);
    const chromeBright=1+(progress*.035);
    nav.style.setProperty('--gt-chrome-x',`${chromeX}%`);
    nav.style.setProperty('--gt-chrome-bright',chromeBright.toFixed(3));
  }

  window.addEventListener('scroll',()=>{
    lastScrollY=window.scrollY;
    if(!scrollRAF) scrollRAF=requestAnimationFrame(paintScroll);
  },{passive:true});
  paintScroll();

  /* ---------------------------------------------------------
     Pointer light + badge depth:
     max badge movement is ~1.5px. This is intentionally tiny.
     --------------------------------------------------------- */
  if(finePointer && !reduce){
    function paintPointer(){
      pointerRAF=0;
      nav.style.setProperty('--gt-sheen-x',`${pointerX}%`);
      nav.style.setProperty('--gt-logo-x',`${logoX.toFixed(2)}px`);
      nav.style.setProperty('--gt-logo-y',`${logoY.toFixed(2)}px`);
    }

    nav.addEventListener('pointerenter',()=>{
      nav.style.setProperty('--gt-sheen-o','.62');
    });

    nav.addEventListener('pointermove',event=>{
      const rect=nav.getBoundingClientRect();
      const px=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
      const py=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
      pointerX=px*100;
      logoX=(px-.5)*2.0;
      logoY=(py-.5)*1.2;
      if(!pointerRAF) pointerRAF=requestAnimationFrame(paintPointer);
    });

    nav.addEventListener('pointerleave',()=>{
      nav.style.setProperty('--gt-sheen-o','0');
      pointerX=50;
      logoX=0;
      logoY=0;
      if(!pointerRAF) pointerRAF=requestAnimationFrame(paintPointer);
    });
  }

  /* Tiny physical registration snap. */
  if(badge && badge.animate && !reduce){
    logo?.addEventListener('pointerdown',()=>{
      badge.animate(
        [
          {transform:'translate(0,0)'},
          {transform:'translate(.65px,-.45px)'},
          {transform:'translate(-.45px,.45px)'},
          {transform:'translate(0,0)'}
        ],
        {duration:140,easing:'steps(3,end)'}
      );
    });
  }

  /* Re-measure active marker after responsive/font changes. */
  const refresh=()=>measure(hover||current);
  window.addEventListener('resize',refresh,{passive:true});
  if(document.fonts?.ready) document.fonts.ready.then(refresh);
})();
