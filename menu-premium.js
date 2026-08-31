/* Grub Monkeys — premium menu refinement, desktop-safe.
   <=900px: continuous editorial menu. >=901px: original menu restored. */
(function(){
  const body=document.body;
  if(!body || body.dataset.page!=='menu') return;

  const mq=window.matchMedia('(max-width: 900px)');
  const tabs=[...document.querySelectorAll('.menu-tab[role="tab"]')];
  const panels=[...document.querySelectorAll('.menu-panel[role="tabpanel"]')];
  const tabsRail=document.getElementById('menuTabs');
  if(!tabs.length || !panels.length || !tabsRail) return;

  const heroImg=document.querySelector('.menu-page-hero > img');
  const abs=(src)=>{try{return new URL(src,document.baseURI).href}catch{return src||''}};
  const heroSrc=heroImg ? abs(heroImg.getAttribute('src')) : '';

  const chapterData=tabs.map((tab,i)=>{
    const code=tab.querySelector('.jcode')?.textContent.trim() || `A${i+1}`;
    return {code,label:tab.textContent.replace(code,'').trim(),image:tab.dataset.preview || ''};
  });

  let mobileActive=false;
  let observers=[];
  let indicator=null;
  let railResize=null;

  /* A tapped tab's own scroll-to offset (just below the sticky rail) and
     the scroll tracker's "centred" definition below (28% down the
     viewport) don't land on the same point, so while the smooth scroll
     was still animating the tracker kept re-picking whichever panel was
     nearest ITS band -- usually the one before the tab that was actually
     tapped -- stomping the correct selection a moment after the tap.
     Suppressing the tracker until the scroll genuinely finishes lets the
     tap's own choice stick; a long jump (first department to last) can
     take over a second, so a short fixed guess isn't enough --
     'scrollend' is used where supported, with a timeout fallback. */
  let suppressAutoActive=false;
  let suppressTimer=null;
  function beginSuppression(){
    suppressAutoActive=true;
    clearTimeout(suppressTimer);
    const release=()=>{ suppressAutoActive=false; clearTimeout(suppressTimer); };
    window.addEventListener('scrollend',release,{once:true});
    suppressTimer=setTimeout(release,1500);
  }

  function updateIndicator(index){
    if(!mq.matches || !indicator || !tabs[index]) return;
    const tab=tabs[index];
    indicator.style.width=`${tab.offsetWidth}px`;
    indicator.style.transform=`translate3d(${tab.offsetLeft}px,0,0)`;
  }

  function setActive(index,{center=true}={}){
    tabs.forEach((tab,i)=>{
      const active=i===index;
      tab.classList.toggle('active',active);
      tab.setAttribute('aria-selected',active?'true':'false');
      tab.tabIndex=active?0:-1;
    });
    updateIndicator(index);
    if(center && tabs[index] && mq.matches){
      tabs[index].scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    }
  }

  function buildChapter(panel,i){
    if(panel.querySelector(':scope > .gm-menu-chapter')) return;
    const data=chapterData[i];
    const repeatsHero=data.image && abs(data.image)===heroSrc;
    const chapter=document.createElement('div');
    chapter.className=`gm-menu-chapter${repeatsHero?' gm-menu-chapter--type':''}`;
    chapter.setAttribute('aria-hidden','true');
    chapter.innerHTML=`
      ${repeatsHero?'':`<img class="gm-menu-chapter__image" src="${data.image}" alt="" loading="lazy" decoding="async">`}
      <span class="gm-menu-chapter__wipe"></span>
      <span class="gm-menu-chapter__ghost">${String(i+1).padStart(2,'0')}</span>
      <span class="gm-menu-chapter__code"><i></i>${data.code} / DEPARTMENT</span>
      <h3 class="gm-menu-chapter__title"><b><span>${data.label}</span></b></h3>`;
    panel.prepend(chapter);
  }

  function onRailClick(e){
    if(!mq.matches) return;
    const tab=e.target.closest('.menu-tab');
    if(!tab) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const index=tabs.indexOf(tab);
    const target=panels[index];
    if(index<0 || !target) return;
    setActive(index,{center:true});
    beginSuppression();
    const railHeight=tabsRail.getBoundingClientRect().height || 0;
    const y=window.scrollY+target.getBoundingClientRect().top-railHeight-66;
    window.scrollTo({top:y,behavior:'smooth'});
  }

  function initMobile(){
    if(mobileActive) return;
    mobileActive=true;

    indicator=document.createElement('span');
    indicator.className='gm-menu-rail-indicator';
    indicator.setAttribute('aria-hidden','true');
    tabsRail.prepend(indicator);

    panels.forEach((panel,i)=>{
      panel.hidden=false;
      panel.classList.remove('switching');
      buildChapter(panel,i);
    });

    const sectionObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting) return;
        entry.target.classList.add('gm-inview');
        sectionObserver.unobserve(entry.target);
      });
    },{threshold:.08,rootMargin:'0px 0px -12% 0px'});
    panels.forEach(p=>sectionObserver.observe(p));
    observers.push(sectionObserver);

    const activeObserver=new IntersectionObserver(entries=>{
      if(!mq.matches) return;
      if(suppressAutoActive) return;
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>
        Math.abs(a.boundingClientRect.top-innerHeight*.28)-Math.abs(b.boundingClientRect.top-innerHeight*.28));
      if(!visible.length) return;
      const index=panels.indexOf(visible[0].target);
      if(index>=0) setActive(index,{center:true});
    },{rootMargin:'-18% 0px -58% 0px',threshold:[0,.05,.2]});
    panels.forEach(p=>activeObserver.observe(p));
    observers.push(activeObserver);

    const selected=Math.max(0,tabs.findIndex(t=>t.getAttribute('aria-selected')==='true'));
    requestAnimationFrame(()=>updateIndicator(selected));
    railResize=()=>updateIndicator(Math.max(0,tabs.findIndex(t=>t.getAttribute('aria-selected')==='true')));
    addEventListener('resize',railResize,{passive:true});
  }

  function teardownMobile(){
    if(!mobileActive) return;
    mobileActive=false;
    observers.forEach(o=>o.disconnect());
    observers=[];
    if(railResize) removeEventListener('resize',railResize);
    railResize=null;
    indicator?.remove();
    indicator=null;

    panels.forEach(panel=>{
      panel.querySelector(':scope > .gm-menu-chapter')?.remove();
      panel.classList.remove('gm-inview');
    });

    let selected=tabs.findIndex(t=>t.getAttribute('aria-selected')==='true');
    if(selected<0) selected=0;
    tabs.forEach((tab,i)=>{
      const active=i===selected;
      tab.classList.toggle('active',active);
      tab.setAttribute('aria-selected',active?'true':'false');
      tab.tabIndex=active?0:-1;
    });
    panels.forEach((panel,i)=>{
      const active=i===selected;
      panel.hidden=!active;
      panel.classList.toggle('active',active);
    });
  }

  tabsRail.addEventListener('click',onRailClick,true);
  function sync(){mq.matches?initMobile():teardownMobile();}
  sync();
  mq.addEventListener?.('change',sync);
})();
