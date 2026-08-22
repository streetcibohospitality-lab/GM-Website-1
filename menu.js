
(function(){
  const tabs=[...document.querySelectorAll('.menu-tab[role="tab"]')];
  if(!tabs.length) return;
  const panels=[...document.querySelectorAll('.menu-panel[role="tabpanel"]')];
  const preview=document.getElementById('menuPreviewImg');
  const previewCode=document.getElementById('menuPreviewCode');
  const previewLabel=document.getElementById('menuPreviewLabel');

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
    const code=tab.querySelector('.jcode')?.textContent.trim() || '';
    const label=tab.textContent.replace(code,'').trim();
    if(previewCode) previewCode.textContent=code;
    if(previewLabel) previewLabel.textContent=label.toUpperCase();
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


/* MENU PAGE — selected diner ordering context */
(function(){
  const nameEl=document.getElementById('menuOrderDinerName');
  const statusEl=document.getElementById('menuOrderDinerStatus');
  const swiggy=document.querySelector('[data-menu-order-platform="swiggy"]');
  const zomato=document.querySelector('[data-menu-order-platform="zomato"]');
  if(!nameEl || !statusEl || !swiggy || !zomato) return;

  const diners={
    'manipal':{
      label:'MANIPAL — THE OG',
      open:'12:30',close:'22:30',verified:true,
      swiggy:'',
      zomato:'https://www.zomato.com/manipal/grub-monkeys-vidyaratna-nagar'
    },
    'mysore':{
      label:'MYSORE DINER',
      open:'12:00',close:'22:00',verified:true,
      swiggy:'https://www.swiggy.com/restaurants/959068/dineout',
      zomato:'https://www.zomato.com/mysore/grub-monkeys-gokulam'
    },
    'new-bel-road':{
      label:'NEW BEL ROAD · FLAGSHIP',
      open:'11:45',close:'22:30',verified:true,
      swiggy:'https://www.swiggy.com/city/bangalore/grub-monkeys-new-bel-road-rest466237',
      zomato:'https://www.zomato.com/bangalore/grub-monkeys-new-bel-road-bangalore'
    },
    'koramangala':{
      label:'KORAMANGALA 8TH BLOCK',
      open:'',close:'',verified:false,
      swiggy:'https://www.swiggy.com/city/bangalore/grub-monkeys-koramangala-rest1069518',
      zomato:'https://www.zomato.com/bangalore/grub-monkeys-koramangala-8th-block-bangalore/order'
    },
    'moodbidri':{
      label:'MOODBIDRI DINER',
      open:'11:00',close:'22:30',verified:true,
      swiggy:'https://www.swiggy.com/city/mangaluru/grub-monkeys-moodbidri-rest1236541',
      zomato:''
    },
    'mangalore':{
      label:'MANGALORE DINER',
      open:'12:00',close:'22:30',verified:true,
      swiggy:'https://www.swiggy.com/city/mangaluru/grub-monkeys-lalbagh-falnir-rest1257104',
      zomato:'https://www.zomato.com/mangalore/grub-monkeys-bendoor/order'
    }
  };

  const selectedKey='gm_selected_diner_v1';
  let slug='new-bel-road';
  try{
    const saved=sessionStorage.getItem(selectedKey);
    if(saved && diners[saved]) slug=saved;
  }catch(err){}

  const diner=diners[slug] || diners['new-bel-road'];

  function mins(value){
    if(!value) return null;
    const [h,m]=value.split(':').map(Number);
    return h*60+m;
  }
  function time12(value){
    const [h,m]=value.split(':').map(Number);
    return `${(h%12)||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
  }
  function nowISTMinutes(){
    const parts=Object.fromEntries(
      new Intl.DateTimeFormat('en-GB',{
        timeZone:'Asia/Kolkata',
        hour:'2-digit',
        minute:'2-digit',
        hourCycle:'h23'
      }).formatToParts(new Date())
      .filter(part=>part.type!=='literal')
      .map(part=>[part.type,part.value])
    );
    return Number(parts.hour||0)*60+Number(parts.minute||0);
  }
  function getStatus(){
    if(!diner.verified) return "CHECK GOOGLE FOR TODAY'S HOURS";
    const open=mins(diner.open), close=mins(diner.close), now=nowISTMinutes();
    if(now>=open && now<close) return `OPEN NOW · UNTIL ${time12(diner.close)}`;
    if(now<open) return `OPENS TODAY · ${time12(diner.open)}`;
    return `CLOSED · OPENS TOMORROW ${time12(diner.open)}`;
  }
  function platform(link,href){
    if(href){
      link.href=href;
      link.hidden=false;
      link.removeAttribute('aria-disabled');
    }else{
      link.hidden=true;
      link.setAttribute('aria-disabled','true');
      link.removeAttribute('href');
    }
  }
  function sync(){
    nameEl.textContent=diner.label;
    statusEl.textContent=getStatus();
    platform(swiggy,diner.swiggy);
    platform(zomato,diner.zomato);
  }

  sync();
  window.setInterval(()=>{ statusEl.textContent=getStatus(); },60000);
})();
