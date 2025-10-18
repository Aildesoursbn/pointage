(function(){
  const STORAGE = 'pointage_terminal_v2';
  const pad = n => n < 10 ? '0' + n : n;
  const secondsToHms = s => `${pad(Math.floor(s/3600))}:${pad(Math.floor((s%3600)/60))}:${pad(Math.floor(s%60))}`;
  const today = () => new Date().toISOString().slice(0,10);
  const data = JSON.parse(localStorage.getItem(STORAGE) || '{}');
  const els = {
    workBtn: document.getElementById('workBtn'),
    lunchBtn: document.getElementById('lunchBtn'),
    workTimer: document.getElementById('workTimer'),
    lunchTimer: document.getElementById('lunchTimer'),
    total: document.getElementById('dailyTotal'),
    weekDropdown: document.getElementById('weekDropdown'),
    export: document.getElementById('exportCsv'),
    clear: document.getElementById('clearAll')
  };

  let timers = { work:null, lunch:null };
  let intervals = {};

  function save(){ localStorage.setItem(STORAGE, JSON.stringify(data)); }

  function toggleTimer(type){
    const day=today();
    if(!data[day]) data[day]={work:0,lunch:0};
    const d=data[day];

    if(timers[type]){ // stop
      clearInterval(intervals[type]);
      const delta=(Date.now()-timers[type])/1000;
      d[type]+=delta;
      timers[type]=null;
    } else { // start
      timers[type]=Date.now();
      intervals[type]=setInterval(()=>render(),1000);
    }
    save();
    render();
  }

  function calcDaySeconds(d){
    let s=d.work||0;
    if(timers.work) s+=(Date.now()-timers.work)/1000;
    if(d.lunch||timers.lunch){
      let l=d.lunch||0;
      if(timers.lunch) l+=(Date.now()-timers.lunch)/1000;
      s-=l;
    }
    return Math.max(0,s);
  }

  function render(){
    const day=today();
    const d=data[day]||{work:0,lunch:0};

    ['work','lunch'].forEach(type=>{
      const btn=els[type+'Btn'];
      const timer=els[type+'Timer'];
      let sec=d[type]||0;
      if(timers[type]) sec+=(Date.now()-timers[type])/1000;
      btn.classList.toggle('active', !!timers[type]);
      timer.textContent=secondsToHms(sec);
    });

    const secTotal = calcDaySeconds(d);
    els.total.textContent = `${Math.floor(secTotal/3600)}h${pad(Math.floor((secTotal%3600)/60))}`;

    els.weekDropdown.innerHTML='';
    for(let i=0;i<7;i++){
      const wd=new Date();
      wd.setDate(wd.getDate()-wd.getDay()+i);
      const key=wd.toISOString().slice(0,10);
      const dd=data[key]||{};
      const sec=calcDaySeconds(dd);
      const opt=document.createElement('option');
      opt.textContent=`${key} : ${Math.floor(sec/3600)}h${pad(Math.floor((sec%3600)/60))}`;
      els.weekDropdown.appendChild(opt);
    }
  }

  els.workBtn.onclick=()=>toggleTimer('work');
  els.lunchBtn.onclick=()=>toggleTimer('lunch');
  els.clear.onclick=()=>{ if(confirm('Effacer toutes les données ?')){ localStorage.removeItem(STORAGE); location.reload(); } };
  els.export.onclick=()=>{
    let csv='date,workSec,lunchSec,netSec\n';
    for(const [day,obj] of Object.entries(data)){
      const net=calcDaySeconds(obj);
      csv+=`${day},${Math.round(obj.work||0)},${Math.round(obj.lunch||0)},${Math.round(net)}\n`;
    }
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download='pointage.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  render();
})();
