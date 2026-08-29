(function(){
  const expansion=document.getElementById('gmExpansion');
  if(!expansion) return;

  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce || !('IntersectionObserver' in window)){
    expansion.classList.add('is-live');
    return;
  }

  const observer=new IntersectionObserver((entries)=>{
    const entry=entries[0];
    if(!entry || !entry.isIntersecting) return;
    expansion.classList.add('is-live');
    observer.disconnect();
  },{
    threshold:.18,
    rootMargin:'0px 0px -7% 0px'
  });

  observer.observe(expansion);
})();
