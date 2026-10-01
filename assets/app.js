(() => {
  const DATA = 'data/public-data.json';
  let data = null;
  const qs = new URLSearchParams(location.search);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const num = (v,d=0) => v == null || Number.isNaN(Number(v)) ? '—' : Number(v).toLocaleString('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d});
  const fmt = (v,d=0) => num(v,d);
  const pct = v => v == null || Number.isNaN(Number(v)) ? '—' : `${num(v,1)}%`;
  const signed = (v,d=0) => v == null || Number.isNaN(Number(v)) ? '—' : `${Number(v)>0?'+':''}${num(v,d)}`;
  const cls = v => v == null ? 'muted' : Number(v)>0 ? 'up' : Number(v)<0 ? 'down' : 'flat';
  const dateLabel = x => { if(!x) return '—'; const d=new Date(`${x}T00:00:00`); return d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}); };
  const dateShort = x => { if(!x) return '—'; const d=new Date(`${x}T00:00:00`); return d.toLocaleDateString('id-ID',{day:'numeric',month:'short'}); };
  const reportHref = (key,scope,metric,sort) => { const p=new URLSearchParams({report:key}); if(scope) p.set('scope',scope); if(metric) p.set('metric',metric); if(sort) p.set('sort',sort); return `report.html?${p}`; };

  const navGroups = () => {
    const groups={}; (data.nav_order||[]).forEach(n=>groups[n]=[]);
    Object.entries(data.reports_meta||{}).forEach(([k,c])=>(groups[c.nav]??=[]).push([k,c]));
    return groups;
  };

  const nav = (activeNav=null) => {
    const el=document.getElementById('categoryNav'); if(!el) return;
    const groups=navGroups();
    el.innerHTML=(data.nav_order||[]).map(n=>{
      const x=groups[n]?.[0];
      return x?`<a class="category-tab ${activeNav===n?'active':''}" href="${reportHref(x[0],x[1].scopes?.[0],x[0]==='tring'?'nasabah':null)}">${esc(n)}</a>`:'';
    }).join('');
  };

  function home(){
    document.title='Monitoring Laporan Area Senen';
    document.getElementById('topDate').textContent=dateLabel(data.latest);
    document.getElementById('heroDate').textContent=dateLabel(data.latest);
    nav();
    const grid=document.getElementById('categoryGrid'); const groups=navGroups();
    grid.innerHTML=(data.nav_order||[]).map(navName=>{
      const items=groups[navName]||[]; if(!items.length)return '';
      const first=items[0];
      const links=items.flatMap(([k,c])=>k==='tring'
        ?Object.entries(c.metrics||{}).map(([m,mc])=>`<a href="${reportHref(k,'outlet',m)}">${esc(mc.title)}<b>→</b></a>`)
        :[`<a href="${reportHref(k,c.scopes?.[0])}">${esc(c.title)}<b>→</b></a>`]
      ).join('');
      return `<article class="category-card"><div class="category-card-head"><div><span>${esc(navName)}</span><h2>${esc(navName)}</h2></div><a href="${reportHref(first[0],first[1].scopes?.[0],first[0]==='tring'?'nasabah':null)}">Buka →</a></div><div class="mini-links">${links}</div></article>`;
    }).join('');
  }

  function metricCards(){
    const arr=data.insights?.TRING||[];
    return `<section class="metric-cards">${arr.map(c=>{
      const p=c.percent==null?0:Math.min(100,Math.max(0,Number(c.percent)));
      return `<a class="metric-card ${c.metric===currentMetric?'active':''}" href="${reportHref('tring','outlet',c.metric)}"><div class="donut" style="--p:${Number(p).toFixed(2)}"><div><b>${pct(c.percent)}</b><span>dari target</span></div></div><div><small>TRING</small><h3>${esc(c.title)}</h3><strong>${fmt(c.current,0)}</strong><span>Target ${fmt(c.target,0)}</span></div></a>`;
    }).join('')}</section>`;
  }

  function kpiCards(activeKey){
    const arr=data.insights?.['PROGRES KPI']||[];
    return `<section class="kpi-cards">${arr.map(c=>`<a class="kpi-card ${activeKey===c.key?'active':''}" href="${reportHref(c.key,(data.reports_meta[c.key]?.scopes||[])[0])}"><div class="kpi-head"><span>${esc(c.title)}</span><i>›</i></div>${c.has_comparison?`<div class="kpi-moves"><div class="up"><b>${c.up}</b><span>Bertumbuh</span></div><div class="down"><b>${c.down}</b><span>Berkurang</span></div><div class="flat"><b>${c.flat}</b><span>Tetap</span></div><div class="move-total"><b>${signed(c.sum_dtd,2)}</b><span>Total DTD</span></div></div>`:`<div class="kpi-pending">Baseline tersimpan · menunggu tanggal berikutnya</div>`}</a>`).join('')}</section>`;
  }

  function tableFlags(key,cfg){
    return {
      isTarget:['target','deposito','nasabah','osl'].includes(cfg.kind)||key==='tring',
      isAchievement:['nasabah_baru','nasabah_aktif','deposito_monitoring','tring'].includes(key),
      showMtd:['nasabah_aktif','nasabah_baru','osl_rata_emas','omset_emas','deposito_monitoring'].includes(key),
      showYtd:['osl_rata_emas','omset_emas','deposito_monitoring'].includes(key)
    };
  }

  function table(key,cfg,v){
    if(cfg.kind==='mulia') return muliaTable(v);
    const {isTarget,isAchievement,showMtd,showYtd}=tableFlags(key,cfg);
    let h='<th>NO</th><th>'+(v.scope==='cabang'?'CABANG':'OUTLET')+'</th>';
    if(isTarget) h+='<th>TARGET TAHUNAN</th>';
    if(showMtd||showYtd){
      if(showYtd)h+='<th>TAHUN LALU</th>';
      if(showMtd)h+='<th>BULAN LALU</th>';
      h+=`<th>${esc(dateLabel(v.left_date))}</th><th>${esc(dateLabel(v.right_date))}</th><th>DTD</th><th>DTD %</th>`;
      if(showMtd)h+='<th>MTD</th><th>MTD %</th>';
      if(showYtd)h+='<th>YTD</th><th>YTD %</th>';
      if(isAchievement)h+='<th>PENCAPAIAN</th>';
    } else {
      if(key==='osl_rata_emas')h+='<th>TAHUN LALU</th>';
      h+=`<th>${esc(dateLabel(v.left_date))}</th><th>${esc(dateLabel(v.right_date))}</th><th>DTD</th>`;
      if(isTarget)h+='<th>PENCAPAIAN</th>'; else if(key==='osl_rata_emas')h+='<th>YOY</th>';
    }
    const body=(v.rows||[]).map((r,i)=>{
      let x=`<tr><td>${i+1}</td><td class="left">${esc(r.unit_key)}</td>`;
      if(isTarget)x+=`<td class="num">${fmt(r.target,cfg.decimals)}</td>`;
      if(showMtd||showYtd){
        if(showYtd)x+=`<td class="num">${fmt(r.prior_year,0)}</td>`;
        if(showMtd)x+=`<td class="num">${fmt(r.last_month,0)}</td>`;
        x+=`<td class="num">${fmt(r.left,0)}</td><td class="num blank">${fmt(r.right,0)}</td><td class="num ${cls(r.dtd)}">${signed(r.dtd,0)}</td><td class="num ${cls(r.dtd_pct)}">${pct(r.dtd_pct)}</td>`;
        if(showMtd)x+=`<td class="num ${cls(r.mtd)}">${signed(r.mtd,0)}</td><td class="num ${cls(r.mtd_pct)}">${pct(r.mtd_pct)}</td>`;
        if(showYtd)x+=`<td class="num ${cls(r.ytd)}">${signed(r.ytd,0)}</td><td class="num ${cls(r.ytd_pct)}">${pct(r.ytd_pct)}</td>`;
        if(isAchievement)x+=`<td class="num ${Number(r.achievement_pct)>=100?'up':'down'}">${fmt(r.right??r.left,0)} / ${pct(r.achievement_pct)}</td>`;
      } else {
        if(key==='osl_rata_emas')x+=`<td class="num">${fmt(r.prior_year,0)}</td>`;
        x+=`<td class="num">${fmt(r.left,cfg.decimals)}</td><td class="num blank">${fmt(r.right,cfg.decimals)}</td><td class="num ${cls(r.dtd)}">${signed(r.dtd,cfg.decimals)}</td>`;
        if(isTarget)x+=`<td class="num ${Number(r.achievement_pct)>=100?'up':'down'}">${fmt(r.right??r.left,0)} / ${pct(r.achievement_pct)}</td>`;
        else if(key==='osl_rata_emas')x+=`<td class="num ${cls(r.yoy_pct)}">${pct(r.yoy_pct)}</td>`;
      }
      return x+'</tr>';
    }).join('');
    return `<div class="table-scroll"><table class="report-table" id="reportTable"><thead><tr>${h}</tr></thead><tbody>${body}</tbody>${tableFooter(key,cfg,v)}</table></div>`;
  }

  function tableFooter(key,cfg,v){
    const {isTarget,isAchievement,showMtd,showYtd}=tableFlags(key,cfg);
    const rows=v.rows||[];
    const sum=k=>rows.reduce((a,r)=>a+(Number(r[k])||0),0);
    const totalTarget=rows.reduce((a,r)=>a+(r.target==null?0:Number(r.target)),0);
    const totalPriorYear=rows.reduce((a,r)=>a+(r.prior_year==null?0:Number(r.prior_year)),0);
    const totalLastMonth=rows.reduce((a,r)=>a+(r.last_month==null?0:Number(r.last_month)),0);
    const totalLeft=rows.reduce((a,r)=>a+(r.left==null?0:Number(r.left)),0);
    const totalRight=rows.reduce((a,r)=>a+(r.right==null?0:Number(r.right)),0);
    const hasRight=rows.some(r=>r.right!=null);
    const totalDtd=rows.reduce((a,r)=>a+(r.dtd==null?0:Number(r.dtd)),0);
    const currentTotal=hasRight?totalRight:totalLeft;
    const achievementTotal=totalTarget>0?currentTotal/totalTarget*100:null;
    const totalMtdCalc=currentTotal-totalLastMonth;
    const totalYtdCalc=currentTotal-totalPriorYear;
    const mtdPctTotal=totalLastMonth!==0?(currentTotal/totalLastMonth-1)*100:null;
    const ytdPctTotal=totalPriorYear!==0?(currentTotal/totalPriorYear-1)*100:null;
    let h='<tfoot><tr><td></td><td class="left">TOTAL</td>';
    if(isTarget)h+=`<td class="num">${fmt(totalTarget,cfg.decimals)}</td>`;
    if(showMtd||showYtd){
      if(showYtd)h+=`<td class="num">${fmt(totalPriorYear,0)}</td>`;
      if(showMtd)h+=`<td class="num">${fmt(totalLastMonth,0)}</td>`;
      h+=`<td class="num">${fmt(totalLeft,0)}</td><td class="num">${hasRight?fmt(totalRight,0):'—'}</td><td class="num ${cls(totalDtd)}">${v.has_comparison?signed(totalDtd,0):'—'}</td><td class="num">${v.has_comparison&&Math.abs(totalLeft)>1e-12?pct((totalRight/totalLeft-1)*100):'—'}</td>`;
      if(showMtd)h+=`<td class="num ${cls(totalMtdCalc)}">${signed(totalMtdCalc,0)}</td><td class="num ${cls(mtdPctTotal)}">${pct(mtdPctTotal)}</td>`;
      if(showYtd)h+=`<td class="num ${cls(totalYtdCalc)}">${signed(totalYtdCalc,0)}</td><td class="num ${cls(ytdPctTotal)}">${pct(ytdPctTotal)}</td>`;
      if(isAchievement)h+=`<td class="num ${Number(achievementTotal)>=100?'up':'down'}">${fmt(currentTotal,0)} / ${pct(achievementTotal)}</td>`;
    } else {
      if(key==='osl_rata_emas')h+=`<td class="num">${fmt(totalPriorYear,cfg.decimals)}</td>`;
      h+=`<td class="num">${fmt(totalLeft,cfg.decimals)}</td><td class="num">${hasRight?fmt(totalRight,cfg.decimals):'—'}</td><td class="num ${cls(totalDtd)}">${v.has_comparison?signed(totalDtd,cfg.decimals):'—'}</td>`;
      if(isTarget)h+=`<td class="num">${fmt(currentTotal,0)} / ${pct(achievementTotal)}</td>`;
      else if(key==='osl_rata_emas')h+='<td class="num">—</td>';
    }
    return h+'</tr></tfoot>';
  }

  function muliaTable(v){
    const dates=v.dates||[];
    const rows=v.rows||[];
    let h='<th>NO</th><th>KODE OUTLET</th><th>NAMA CABANG</th><th>NAMA OUTLET</th>'+dates.map(d=>`<th>${esc(dateShort(d))}</th>`).join('')+'<th>GRAND TOTAL</th>';
    const totals=dates.map(d=>rows.reduce((a,r)=>a+(Number(r.series?.[d])||0),0));
    const grand=rows.reduce((a,r)=>a+dates.reduce((x,d)=>x+(Number(r.series?.[d])||0),0),0);
    const b=rows.map((r,i)=>{const gt=dates.reduce((a,d)=>a+(Number(r.series?.[d])||0),0);const cells=dates.map(d=>{const n=Number(r.series?.[d]||0);return `<td>${n?fmt(n,0):'—'}</td>`}).join('');return `<tr><td>${i+1}</td><td>${esc(r.code||'')}</td><td>${esc(r.branch||'')}</td><td class="left">${esc(r.unit_name)}</td>${cells}<td class="num"><strong>${fmt(gt,0)}</strong></td></tr>`}).join('');
    return `<div class="table-scroll"><table class="report-table mulia-table" id="reportTable"><thead><tr>${h}</tr></thead><tbody>${b}</tbody><tfoot><tr><td colspan="4">GRAND TOTAL</td>${totals.map(n=>`<td>${fmt(n,0)}</td>`).join('')}<td class="num">${fmt(grand,0)}</td></tr></tfoot></table></div>`;
  }

  function kpiBranchFlyer(v){
    const rows=[...(v.rows||[])].sort((a,b)=>(Number(b.right??b.left??0)-Number(a.right??a.left??0))||String(a.unit_name).localeCompare(String(b.unit_name),'id'));
    const totalKpi=rows.reduce((a,r)=>a+(Number(r.right??r.left)||0),0);
    const totalDtd=rows.reduce((a,r)=>a+(Number(r.dtd)||0),0);
    return `<section class="kpi-branch-flyer"><div class="kpi-flyer-head"><div><span class="eyebrow light">PROGRES KPI TAHUNAN</span><h2>Performa Cabang</h2><p>Detail KPI terbaru · ${rows.length} cabang · kategori CP &amp; CPS</p></div><div class="kpi-flyer-total"><small>TOTAL NILAI KPI</small><strong>${fmt(totalKpi,2)}</strong><span>DTD ${signed(totalDtd,2)}</span></div></div><div class="kpi-branch-grid">${rows.map((r,i)=>{const value=Number(r.right??r.left??0);const share=totalKpi>0?value/totalKpi*100:0;const category=String(r.unit_name||'').toUpperCase().startsWith('CPS ')?'CPS':'CP';return `<article class="kpi-branch-card"><div class="kpi-rank">#${i+1}</div><div class="kpi-branch-top"><div><small>${category} · CABANG</small><h3>${esc(r.unit_name)}</h3></div><div class="kpi-dtd ${cls(r.dtd)}">${signed(r.dtd,2)}</div></div><div class="kpi-value">${fmt(value,2)}</div><div class="kpi-bar"><i style="width:${Math.min(100,share).toFixed(2)}%"></i></div><div class="kpi-branch-meta"><span>KONTRIBUSI KE TOTAL KPI</span><b>${num(share,1)}%</b></div></article>`}).join('')}</div></section>`;
  }

  function sortKeysFor(key){
    const {showMtd,showYtd,isAchievement}=tableFlags(key,data.reports_meta[key]||{});
    const isKpiPage=['lar_emas','deposito_emas_kpi','kpi_tahunan_outlet'].includes(key);
    if(key==='mulia_by_order'||isKpiPage)return [];
    return ['dtd',...(showMtd?['mtd']:[]),...(showYtd?['ytd']:[]),...(isAchievement?['achievement']:[])];
  }

  let currentMetric='nasabah';
  function report(){
    const key=qs.get('report')||'lar_emas';
    const cfg=data.reports_meta?.[key];
    if(!cfg){document.getElementById('app').innerHTML='<section class="empty-card"><div class="empty-mark">404</div><h2>Laporan tidak ditemukan</h2><p>Kembali ke dashboard publik.</p></section>';return;}
    currentMetric=key==='tring'?(qs.get('metric')||'nasabah'):'nasabah';
    let scope=qs.get('scope') || (cfg.scopes?.length ? cfg.scopes[0] : null);
    const id=key==='tring' ? `${key}:${currentMetric}:outlet` : (cfg.scopes?.length ? `${key}:${scope}` : `${key}:default`);
    let v=data.reports?.[id];
    if(!v && key!=='tring' && cfg.scopes?.length) v=data.reports?.[`${key}:${scope}`];
    if(!v){
      document.getElementById('app').innerHTML='<section class="empty-card"><div class="empty-mark">!</div><h2>Data belum tersedia</h2><p>Belum ada snapshot publik untuk laporan ini.</p></section>';
      nav(cfg.nav);
      return;
    }

    document.title=`${cfg.title} — Monitoring Area Senen`;
    document.getElementById('topDate').textContent=dateLabel(data.latest);
    nav(cfg.nav);
    const groups=navGroups();
    const activeNav=cfg.nav;
    const sub=key==='tring'
      ?Object.entries(cfg.metrics||{}).map(([m,mc])=>`<a class="subtab ${m===currentMetric?'active':''}" href="${reportHref(key,'outlet',m)}">${esc(mc.title)}</a>`).join('')
      :(groups[activeNav]||[]).map(([k,c])=>`<a class="subtab ${k===key?'active':''}" href="${reportHref(k,c.scopes?.[0])}">${esc(c.title)}</a>`).join('');
    const scopes=(cfg.scopes||[]).map(s=>`<a class="scope-pill ${s===scope?'active':''}" href="${reportHref(key,s,currentMetric,qs.get('sort'))}">${esc(s.toUpperCase())}</a>`).join('');
    const sortKeys=sortKeysFor(key);
    const requestedSort=qs.get('sort');
    const sort=sortKeys.includes(requestedSort)?requestedSort:sortKeys[0]||null;
    if(sort){
      const val=r=>({achievement:r.achievement_pct,dtd:r.dtd,mtd:r.mtd,ytd:r.ytd}[sort]);
      v={...v,rows:[...(v.rows||[])].sort((a,b)=>(Number(val(b)??-Infinity)-Number(val(a)??-Infinity))||String(a.unit_key).localeCompare(String(b.unit_key),'id'))};
    }
    const sortBar=sortKeys.length?`<div class="sort-bar"><span>SORT BY</span>${sortKeys.map(s=>`<button class="sort-pill ${sort===s?'active':''}" data-sort="${s}">${s==='achievement'?'PENCAPAIAN':s.toUpperCase()}</button>`).join('')}</div>`:'';
    let content='';
    if(activeNav==='TRING') content+=metricCards();
    else if(activeNav==='PROGRES KPI') content+=kpiCards(key);
    content+=`<section class="subnav"><div class="subnav-inner">${sub}</div></section>`;
    content+=`<div class="report-head"><div><span class="eyebrow">${esc(activeNav)}</span><h1>${esc(key==='tring'?(cfg.metrics[currentMetric]?.title||cfg.title):cfg.title)}</h1></div></div>`;
    if(scopes)content+=`<div class="scope-switch"><span>LEVEL</span>${scopes}</div>`;
    content+=sortBar;
    if(key==='kpi_tahunan_outlet'&&scope==='cabang') content+=kpiBranchFlyer(v);
    else content+=`<section class="table-card"><div class="table-bar"><div><b>${esc((key==='tring'?cfg.metrics[currentMetric]?.title:cfg.title).toUpperCase())}</b><span>${esc(dateLabel(v.left_date))}${v.has_comparison?' → '+esc(dateLabel(v.right_date)):''}</span></div><input id="tableSearch" placeholder="Cari ${scope==='cabang'?'cabang':'outlet'}..." type="search"></div><div class="public-table-host">${table(key,key==='tring'?cfg.metrics[currentMetric]:cfg,v)}</div></section>`;
    document.getElementById('app').innerHTML=content;

    const search=document.getElementById('tableSearch');
    if(search)search.addEventListener('input',()=>{const term=search.value.toLowerCase();document.querySelectorAll('#reportTable tbody tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(term)?'':'none');});
    document.querySelectorAll('[data-sort]').forEach(btn=>btn.addEventListener('click',()=>{
      const s=btn.dataset.sort;
      const next=new URLSearchParams(location.search); next.set('sort',s); location.search=next.toString();
    }));
  }

  fetch(DATA,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Data publik belum tersedia');return r.json();}).then(j=>{data=j;nav();if(location.pathname.endsWith('report.html'))report();else home();}).catch(()=>{
    const a=document.getElementById('app')||document.getElementById('categoryGrid');
    if(a)a.innerHTML='<section class="empty-card"><div class="empty-mark">!</div><h2>Data publik belum tersedia</h2><p>Jalankan Publish Public Data dari Admin lokal terlebih dahulu.</p></section>';
  });
})();
