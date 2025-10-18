(function(){
  const STORAGE='pointage_terminal';
  const data=JSON.parse(localStorage.getItem(STORAGE)||'{}');

  const workBtn=document.getElementById('workBtn');
  const lunchBtn=document.getElementById('lunchBtn');
  const workTime=document.getElementById('workTime');
  const lunchTime=document.getElementById('lunchTime');
  const weekSummary=document.getElementById('weekSummary');
  const clearAll=document.getElementById('clearAll');

  let workInterval=null;
  let lunchInterval=null;

  function pad(n){return n<10?'0'+n:n;}
  function secondsToHms(s){return `${Math.floor(s/3600)}h${pad(Math.floor((s%3600)/60))}`;}
  function today(){return new Date().toISOString().slice(0,10);}

  function save(){ localStorage.setItem(STORAGE, JSON.stringify(data)); }

  // Chrono en direct
  function startChrono(action){
    const day=today();
    if(!data[day]) data[day]={};
    const keyStart=action+'Start';
    const keyEnd=action+'End';

    if(!data[day][keyStart]){
      data[day][keyStart]=new Date().toISOString();
      delete data[day][keyEnd];
    }
    save();
    render();

    if(action==='work'){
      if(workInterval) clearInterval(workInterval);
      workInterval=setInterval(()=>renderTime('work'),1000);
    } else {
      if(lunchInterval) clearInterval(lunchInterval);
      lunchInterval=setInterval(()=>renderTime('lunch'),1000);
    }
  }

  function stopChrono(action){
    const day=today();
    if(!data[day]) return;
    const keyStart=action+'Start';
    const keyEnd=action+'End';
    if(data[day][keyStart] && !data[day][keyEnd]){
      data[day][keyEnd]=new Date().toISOString();
      if(action==='work'){ clearInterval(workInterval); workInterval=null;}
      if(action==='lunch'){ clearInterval(lunchInterval); lunchInterval=null;}
    }
    save();
    render();
  }

  function renderTime(action){
    const day=today();
    const d=data[day]||{};
    let sec=0;
    if(d[action+'Start']){
      const start=new Date(d[action+'Start']);
      const end=d[action+'End'] ? new Date(d[action+'End']) : new Date();
      sec=(end-start)/1000;
    }
    if(action==='work') workTime.textContent=secondsToHms(sec);
    if(action==='lunch') lunchTime.textContent=secondsToHms(sec);
  }

  function render(){
    const day=today();
    const d=data[day]||{};

    // Temps
    renderTime('work');
    renderTime('lunch');

    // Boutons actifs
    workBtn.classList.toggle('active', d.workStart && !d.workEnd);
    lunchBtn.classList.toggle('active', d.lunchStart && !d.lunchEnd);

    // Résumé semaine
    weekSummary.innerHTML='';
    for(let i=0;i<7;i++){
      const wd=new Date();
      wd.setDate(wd.getDate()-wd.getDay()+i);
      const key=wd.toISOString().slice(0,10);
      const dd=data[key]||{};
      let s=0;
      if(dd.workStart && dd.workEnd){
        s=(new Date(dd.workEnd)-new Date(dd.workStart))/1000;
        if(dd.lunchStart && dd.lunchEnd)
          s-=(new Date(dd.lunchEnd)-new Date(dd.lunchStart))/1000;
      }
      const opt=document.createElement('option');
      opt.value=key;
      opt.textContent=`${key} : ${secondsToHms(s)}`;
      weekSummary.appendChild(opt);
    }
  }

  workBtn.onclick=()=>{
    const day=today();
    const d=data[day]||{};
    if(d.workStart && !d.workEnd) stopChrono('work'); else startChrono('work');
  };

  lunchBtn.onclick=()=>{
    const day=today();
    const d=data[day]||{};
    if(d.lunchStart && !d.lunchEnd) stopChrono('lunch'); else startChrono('lunch');
  };

  clearAll.onclick=()=>{
    if(confirm('Effacer toutes les données ?')){
      localStorage.removeItem(STORAGE);
      location.reload();
    }
  };

  render();
})();
