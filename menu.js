
(function(){
  const tabs=[...document.querySelectorAll('.menu-tab[role="tab"]')];
  if(!tabs.length) return;
  const panels=[...document.querySelectorAll('.menu-panel[role="tabpanel"]')];
  const preview=document.getElementById('menuPreviewImg');

  function activate(tab,{focus=false}={}){
    tabs.forEach(t=>{
      const selected=t===tab;
      t.classList.toggle('active',selected);
      t.setAttribute('aria-selected',selected?'true':'false');
      t.tabIndex=selected?0:-1;
      if(selected){
        t.classList.remove('kick');
        void t.offsetWidth;
        t.classList.add('kick');
        setTimeout(()=>t.classList.remove('kick'),220);
      }
      const panel=document.getElementById(t.getAttribute('aria-controls'));
      if(panel){
        panel.classList.toggle('active',selected);
        panel.hidden=!selected;
        if(selected){
          panel.classList.remove('switching');
          void panel.offsetWidth;
          panel.classList.add('switching');
          setTimeout(()=>panel.classList.remove('switching'),300);
        }
      }
    });
    if(preview && tab.dataset.preview){
      preview.classList.remove('switching');
      void preview.offsetWidth;
      preview.classList.add('switching');
      preview.src=tab.dataset.preview;
      preview.alt=`Preview for ${tab.textContent.trim()}`;
      setTimeout(()=>preview.classList.remove('switching'),320);
    }
    if(focus) tab.focus();
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>activate(tab));
    tab.addEventListener('focus',()=>{if(preview && tab.dataset.preview) preview.src=tab.dataset.preview;});
    tab.addEventListener('keydown',e=>{
      let next=null;
      if(e.key==='ArrowRight') next=tabs[(i+1)%tabs.length];
      else if(e.key==='ArrowLeft') next=tabs[(i-1+tabs.length)%tabs.length];
      else if(e.key==='Home') next=tabs[0];
      else if(e.key==='End') next=tabs[tabs.length-1];
      if(next){e.preventDefault();activate(next,{focus:true});}
    });
  });
  panels.forEach((p,i)=>p.hidden=i!==0);
})();
