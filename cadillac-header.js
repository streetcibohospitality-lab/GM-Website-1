
(function(){
  const nav=document.getElementById('siteNav');
  if(!nav || !nav.classList.contains('gm-cadillac-nav')) return;

  const list=nav.querySelector('.nav-links');
  const links=[...nav.querySelectorAll('.nav-links a')];
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(reduce){
    nav.classList.add('is-powered');
  }else{
    requestAnimationFrame(()=>requestAnimationFrame(()=>nav.classList.add('is-powered')));
  }

  function measure(link){
    if(!list || !link){
      list?.style.setProperty('--gm-marker-visible','0');
      return;
    }
    const listRect=list.getBoundingClientRect();
    const linkRect=link.getBoundingClientRect();
    const inset=Math.max(10,Math.min(18,linkRect.width*.18));
    const x=linkRect.left-listRect.left+inset;
    const w=Math.max(22,linkRect.width-inset*2);
    list.style.setProperty('--gm-marker-x',`${x}px`);
    list.style.setProperty('--gm-marker-w',`${w}px`);
    list.style.setProperty('--gm-marker-visible','1');
  }

  function setCurrent(link){
    links.forEach(a=>{
      a.classList.toggle('is-current',a===link);
      if(a===link) a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
    measure(link);
  }

  const path=location.pathname.replace(/\/+$/,'') || '/';
  if(path==='/menu'){
    setCurrent(links.find(a=>a.getAttribute('href')==='/menu'));
  }else if(path==='/franchise'){
    setCurrent(links.find(a=>a.getAttribute('href')==='/franchise'));
  }else{
    measure(null);
  }

  // Homepage section awareness: only relevant nav items illuminate.
  if(path==='/' && 'IntersectionObserver' in window){
    const targets=[
      [document.getElementById('locations'),links.find(a=>a.getAttribute('href')==='#locations')],
      [document.getElementById('story'),links.find(a=>a.getAttribute('href')==='#story')]
    ].filter(([el,link])=>el&&link);

    const ratios=new Map();
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>ratios.set(entry.target,entry.isIntersecting?entry.intersectionRatio:0));
      let best=null;
      let score=.18;
      targets.forEach(([el,link])=>{
        const r=ratios.get(el)||0;
        if(r>score){score=r;best=link}
      });
      if(best) setCurrent(best);
      else{
        links.forEach(a=>{
          a.classList.remove('is-current');
          a.removeAttribute('aria-current');
        });
        measure(null);
      }
    },{
      rootMargin:'-24% 0px -56% 0px',
      threshold:[0,.18,.35,.55,.75]
    });

    targets.forEach(([el])=>io.observe(el));
  }

  // Recalculate chrome marker on responsive changes/font settling.
  const refresh=()=>measure(links.find(a=>a.classList.contains('is-current'))||null);
  window.addEventListener('resize',refresh,{passive:true});
  if(document.fonts?.ready) document.fonts.ready.then(refresh);

  // Tiny physical registration snap on logo press; navigation is never delayed.
  const logo=nav.querySelector('.nav-logo');
  if(logo && !reduce && logo.animate){
    logo.addEventListener('pointerdown',()=>{
      logo.animate(
        [
          {transform:'translate(0,0)'},
          {transform:'translate(.7px,-.4px)'},
          {transform:'translate(-.5px,.5px)'},
          {transform:'translate(0,0)'}
        ],
        {duration:150,easing:'steps(3,end)'}
      );
    });
  }
})();
