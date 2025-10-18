(function(){
  const pad=n=>n<10?'0'+n:n;
  const timeStr=d=>pad(d.getHours())+':'+pad(d.getMinutes());
  const secondsToHms=s=>{
    const h=Math.floor(s/3600);
    const m=Math.floor((s%3600)/60);
    return `${h}h${pad(m)}`;
  };
  const today=()=>new Date().toISOString().slice(0,10);

  const workBtn=document.getElementById('workBtn');
  const lunchBtn=document.getElementById('lunchBtn');
  const workStatus=document.getElementById('workStatus');
  const lunchStatus=document.getElementById('lunchStatus');
  const dailyTotal=document.getElementById('dailyTotal');
  const weekSummary=document.getElementById('weekSummary');
  const exportCsvBtn=document.getElementById('exportCsv');
  const clearAllBtn=document.getElementById('clearAll');

  const STORAGE='pointage_terminal';
  let data=loadData();

  function loadData(){ try{ return JSON.parse(localStorage.getItem(STORAGE))||{}; } catch(e){ return {}; } }
  function saveData(){ localStorage.setItem(STORAGE, JSON.stringify(data)); }

  function punchEffect(btn){
    btn.classList.add('punched');
    const txt=btn.textContent;
    btn.textContent='✓';
    setTimeout(()=>{ btn.classList.remove('punched'); btn.textContent=txt; },400);
  }

  function toggle(action){
    const day=today();
    if(!data[day]) data[day]={};

    const startKey=action+'Start';
    const endKey=action+'End';
    const btn = action==='work'?workBtn:lunchBtn;

    if(!data[day][startKey] || data[day][endKey]){
      // début → bouton actif
      data[day][startKey] = new Date().toISOString();
      delete data[day][endKey];
      btn.classList.add('active');
    } else {
      // fin → bouton normal
      data[day][endKey] = new Date().toISOString();
      btn.classList.remove('active');
    }

    saveData();
    render();
  }

  workBtn.addEventListener('click', ()=>{ toggle('work'); punchEffect(workBtn); });
  lunchBtn.addEventListener('click', ()=>{ toggle('lunch'); punchEffect(lunchBtn); });
  exportCsvBtn.addEventListener('click', exportCSV);
  clearAllBtn.addEventListener('click', clearAll);

  function render(){
    const day=today();
    const dayData=data[day]||{};

    // statut Travail
    workStatus.textContent=dayData.workStart?`Début: ${timeStr(new Date(dayData.workStart))}`:'Aucun enregistrement';
    if(dayData.workStart && dayData.workEnd) workStatus.textContent += ` - Fin: ${timeStr(new Date(dayData.workEnd))}`;

    // statut Déjeuner
    lunchStatus.textContent=dayData.lunchStart?`Début: ${timeStr(new Date(dayData.lunchStart))}`:'Aucun enregistrement';
    if(dayData.lunchStart && dayData.lunchEnd) lunchStatus.textContent += ` - Fin: ${timeStr(new Date(dayData.lunchEnd))}`;

    // temps travail net
    let dailySec=0;
    if(dayData.workStart && dayData.workEnd){
      dailySec = (new Date(dayData.workEnd)-new Date(dayData.workStart))/1000;
      if(dayData.lunchStart && dayData.lunchEnd) dailySec -= (new Date(dayData.lunchEnd)-new Date(dayData.lunchStart))/1000;
      dailySec = Math.max(0,dailySec);
    }
    dailyTotal.textContent = secondsToHms(dailySec);

    // boutons actifs si temps en cours
    if(dayData.workStart && !dayData.workEnd) workBtn.classList.add('active'); else workBtn.classList.remove('active');
    if(dayData.lunchStart && !dayData.lunchEnd) lunchBtn.classList.add('active'); else lunchBtn.classList.remove('active');

    // résumé semaine
    weekSummary.innerHTML='';
    for(let i=0;i<7;i++){
      const d=new Date();
      d.setDate(d.getDate()-d.getDay()+i);
      const dayKey=d.toISOString().slice(0,10);
      const dd=data[dayKey]||{};
      let s=0;
      if(dd.workStart && dd.workEnd){
        s=(new Date(dd.workEnd)-new Date(dd.workStart))/1000;
        if(dd.lunchStart && dd.lunchEnd) s -= (new Date(dd.lunchEnd)-new Date(dd.lunchStart))/1000;
        s=Math.max(0,s);
      }
      const li=document.createElement('li');
      li.textContent = `${dayKey} : ${secondsToHms(s)}`;
      weekSummary.appendChild(li);
    }
  }

  function exportCSV(){
    if(!confirm("Exporter toutes les données en CSV ?")) return;
    let csv='date,workStart,workEnd,lunchStart,lunchEnd,dureeSec\n';
    for(const [day,obj] of Object.entries(data)){
      let dur=0;
      if(obj.workStart && obj.workEnd){
        dur=(new Date(obj.workEnd)-new Date(obj.workStart))/1000;
        if(obj.lunchStart && obj.lunchEnd) dur-=(new Date(obj.lunchEnd)-new Date(obj.lunchStart))/1000;
        dur=Math.max(0,dur);
      }
      csv += `${day},${obj.workStart||''},${obj.workEnd||''},${obj.lunchStart||''},${obj.lunchEnd||''},${Math.round(dur)}\n`;
    }
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='pointage.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function clearAll(){
    if(!confirm("Effacer toutes les données ?")) return;
    data={};
    saveData();
    render();
  }

  render();
})();
