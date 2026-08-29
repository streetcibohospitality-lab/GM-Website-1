(function(){
  const nodes=[...document.querySelectorAll('.gm-fr-v2-reveal')];
  if(!nodes.length) return;

  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce || !('IntersectionObserver' in window)){
    nodes.forEach(node=>node.classList.add('is-in'));
    return;
  }

  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  },{
    threshold:.16,
    rootMargin:'0px 0px -8% 0px'
  });

  nodes.forEach(node=>observer.observe(node));
})();