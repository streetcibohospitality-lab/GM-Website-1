/* Grub Monkeys — premium mobile menu choreography.
   Keeps the entire menu visible on mobile and turns the existing tabs
   into a sticky jump/position navigator. */
(function(){
  const body=document.body;
  if(!body || body.dataset.page!=='menu') return;

  const mq=window.matchMedia('(max-width: 900px)');
  const tabs=[...document.querySelectorAll('.menu-tab[role="tab"]')];
  const panels=[...document.querySelectorAll('.menu-panel[role="tabpanel"]')];
  const tabsRail=document.getElementById('menuTabs');
  if(!tabs.length || !panels.length) return;

  const chapterData=tabs.map((tab,i)=>({
    code:tab.querySelector('.jcode')?.textContent.trim() || `A${i+1}`,
    label:tab.textContent.replace(tab.querySelector('.jcode')?.textContent || '','').trim(),
    image:tab.dataset.preview || ''
  }));

  // Build chapter artwork from assets/data already present on the page.
  panels.forEach((panel,i)=>{
    if(panel.querySelector('.gm-menu-chapter')) return;
    const data=chapterData[i];
    const chapter=document.createElement('div');
    chapter.className='gm-menu-chapter';
    chapter.setAttribute('aria-hidden','true');
    chapter.innerHTML=`
      <img class="gm-menu-chapter__image" src="${data.image}" alt="" loading="lazy" decoding="async">
      <span class="gm-menu-chapter__wipe"></span>
      <span class="gm-menu-chapter__ghost">${String(i+1).padStart(2,'0')}</span>
      <span class="gm-menu-chapter__code"><i></i>${data.code} / NOW SERVING</span>
      <h3 class="gm-menu-chapter__title"><b><span>${data.label}</span></b></h3>`;
    panel.prepend(chapter);
  });

  function setActive(index,{center=true}={}){
    tabs.forEach((tab,i)=>{
      const active=i===index;
      tab.classList.toggle('active',active);
      tab.setAttribute('aria-selected',active?'true':'false');
      tab.tabIndex=active?0:-1;
    });
    if(center && tabs[index]){
      tabs[index].scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    }
  }

  function enableMobile(){
    panels.forEach(panel=>{ panel.hidden=false; });
  }

  function restoreDesktop(){
    const selected=Math.max(0,tabs.findIndex(t=>t.getAttribute('aria-selected')==='true'));
    panels.forEach((panel,i)=>{
      const active=i===selected;
      panel.hidden=!active;
      panel.classList.toggle('active',active);
    });
  }

  function syncMode(){
    if(mq.matches) enableMobile();
    else restoreDesktop();
  }
  syncMode();
  mq.addEventListener?.('change',syncMode);

  /* A tapped tab's own scroll-to offset (just below the sticky rail) and
     the scroll tracker's "centred" definition below (28% down the
     viewport) don't land on the same point, so while the smooth scroll
     was still animating the tracker kept re-picking whichever panel
     was nearest ITS band -- usually the one before the tab that was
     actually tapped -- stomping the correct selection a moment after
     the tap. Suppressing the tracker until the scroll genuinely finishes
     lets the tap's own choice stick; a long jump (first department to
     last) can take over a second, so a short fixed guess isn't enough --
     'scrollend' is used where supported, with a generous timeout as the
     fallback for browsers without it. */
  let suppressAutoActive=false;
  let suppressTimer=null;
  function beginSuppression(){
    suppressAutoActive=true;
    clearTimeout(suppressTimer);
    const release=()=>{ suppressAutoActive=false; clearTimeout(suppressTimer); };
    window.addEventListener('scrollend',release,{once:true});
    suppressTimer=setTimeout(release,1500);
  }

  // Capture mobile tab clicks before the legacy tab switcher hides content.
  tabsRail?.addEventListener('click',e=>{
    if(!mq.matches) return;
    const tab=e.target.closest('.menu-tab');
    if(!tab) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const index=tabs.indexOf(tab);
    const target=panels[index];
    if(!target) return;
    setActive(index,{center:true});
    beginSuppression();
    const railHeight=tabsRail.getBoundingClientRect().height;
    const navOffset=62;
    const y=window.scrollY+target.getBoundingClientRect().top-railHeight-navOffset-8;
    window.scrollTo({top:y,behavior:'smooth'});
  },true);

  // Reveal choreography. Each section animates once, then stays stable.
  const sectionObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      entry.target.classList.add('gm-inview');
      sectionObserver.unobserve(entry.target);
    });
  },{threshold:.08,rootMargin:'0px 0px -10% 0px'});

  panels.forEach(panel=>sectionObserver.observe(panel));

  const groupObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      entry.target.classList.add('gm-rows-in');
      groupObserver.unobserve(entry.target);
    });
  },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('.menu-group').forEach(group=>groupObserver.observe(group));

  // Active section tracking on mobile. Uses a centre-biased observation band.
  const activeObserver=new IntersectionObserver(entries=>{
    if(!mq.matches) return;
    if(suppressAutoActive) return;
    const visible=entries
      .filter(e=>e.isIntersecting)
      .sort((a,b)=>Math.abs(a.boundingClientRect.top-innerHeight*.28)-Math.abs(b.boundingClientRect.top-innerHeight*.28));
    if(!visible.length) return;
    const index=panels.indexOf(visible[0].target);
    if(index>=0) setActive(index,{center:true});
  },{rootMargin:'-18% 0px -57% 0px',threshold:[0,.05,.2]});
  panels.forEach(panel=>activeObserver.observe(panel));

  // Very restrained image depth. One RAF for all chapter images; disabled for reduced motion.
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  let ticking=false;
  function depth(){
    ticking=false;
    if(!mq.matches || reduce.matches) return;
    document.querySelectorAll('.gm-menu-chapter.gm-depth').forEach(ch=>{
      const r=ch.getBoundingClientRect();
      const progress=((r.top+r.height*.5)-innerHeight*.5)/innerHeight;
      const y=Math.max(-8,Math.min(8,progress*-8));
      const img=ch.querySelector('.gm-menu-chapter__image');
      if(img && ch.closest('.menu-panel')?.classList.contains('gm-inview')){
        img.style.translate=`0 ${y}px`;
      }
    });
  }
  const depthObserver=new IntersectionObserver(entries=>{
    entries.forEach(e=>e.target.classList.toggle('gm-depth',e.isIntersecting));
  },{rootMargin:'25% 0px 25% 0px'});
  document.querySelectorAll('.gm-menu-chapter').forEach(ch=>depthObserver.observe(ch));
  addEventListener('scroll',()=>{
    if(ticking) return;
    ticking=true;
    requestAnimationFrame(depth);
  },{passive:true});
})();
