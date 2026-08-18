
(function(){
  const form=document.getElementById('franchiseForm');
  if(!form) return;

  const SUPABASE_URL='https://wpzftlqqtuftzyfwtpkp.supabase.co';
  const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwemZ0bHFxdHVmdHp5Znd0cGtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MjkwMzQsImV4cCI6MjEwMjAwNTAzNH0.VzwizMxvAlI4KX3DOHmOTQZwFcO76X90HAhKC9rIBKc';
  const btn=document.getElementById('franchiseSubmitBtn');
  const status=document.getElementById('franchiseStatus');

  function setStatus(message,type=''){
    if(status){status.textContent=message;status.dataset.type=type;}
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    setStatus('');
    if(document.getElementById('fi-company')?.value) return;
    if(!form.reportValidity()) return;

    btn.disabled=true;
    btn.textContent='Sending…';
    setStatus('Sending your enquiry…');

    try{
      const response=await fetch(`${SUPABASE_URL}/rest/v1/franchise_enquiries`,{
        method:'POST',
        headers:{
          apikey:SUPABASE_ANON_KEY,
          Authorization:`Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type':'application/json',
          Prefer:'return=minimal'
        },
        body:JSON.stringify({
          full_name:document.getElementById('fi-name').value.trim(),
          phone:document.getElementById('fi-phone').value.trim(),
          email:document.getElementById('fi-email').value.trim(),
          city:document.getElementById('fi-city').value.trim(),
          budget:document.getElementById('fi-budget').value||null,
          message:document.getElementById('fi-message').value.trim()||null
        })
      });
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      btn.textContent='Enquiry Sent';
      btn.style.background='var(--gm-teal)';
      btn.style.color='var(--gm-grey)';
      btn.style.boxShadow='none';
      setStatus('Thanks — your enquiry was submitted.','success');
    }catch(err){
      console.error('Franchise enquiry failed',err);
      btn.disabled=false;
      btn.textContent='Submit Enquiry';
      setStatus('Could not submit right now. Please try again or contact Grub Monkeys directly.','error');
    }
  });
})();
