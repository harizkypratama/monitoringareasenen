(() => {
  const DATA = 'data/public-data.json';
  let data = null;
  const qs = new URLSearchParams(location.search);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmt = (v,d=0) => v == null || Number.isNaN(Number(v)) ? '—' : Number(v).toLocaleString('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d});
  const pct = v => v == null || Number.isNaN(Number(v)) ? '—' : `${fmt(v,1)}%`;
  const signed = (v,d=0) => v == null || Number.isNaN(Number(v)) ? '—' : `${Number(v)>0?'+':''}${fmt(v,d)}`;
  const cls = v => v == null ? 'muted' : Number(v)>0 ? 'up' : Number(v)<0 ? 'down' : 'flat';
  const dateLabel = x => { if(!x) return '—'; const d=new Date(`${x}T00:00:00`); return d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}); };
  const reportHref = (key,scope,metric) => { const p=new URLSearchParams({report:key}); if(scope) p.set('scope',scope); if(metric) p.set('metric',metric); return `report.html?${p}`; };
  const nav = () => {
    const el=document.getElementById('categoryNav'); if(!el) return;
    const groups={}; data.nav_order.forEach(n=>groups[n]=[]);
    Object.entries(data.reports_meta).forEach(([k,c])=>(groups[c.nav]??=[]).push([k,c]));
    el.innerHTML=data.nav_order.map(n=>{const x=groups[n]?.[0]; return x?`<a class="category-tab" href="${reportHref(x[0],x[1].scopes?.[0],x[0]==='tring'?'nasabah':null)}">${esc(n)}</a>`:''}).join('');
  };
  function home(){
    document.title='Monitoring Laporan Area Senen';
    document.getElementById('topDate').textContent=dateLabel(data.latest);
    document.getElementById('heroDate').textContent=dateLabel(data.latest);
    const grid=document.getElementById('categoryGrid'); const groups={}; data.nav_order.forEach(n=>groups[n]=[]);
    Object.entries(data.reports_meta).forEach(([k,c])=>(groups[c.nav]??=[]).push([k,c]));
    grid.innerHTML=data.nav_order.map(navName=>{const items=groups[navName]||[]; if(!items.length)return '';
      const first=items[0];
      const links=items.flatMap(([k,c])=>k==='tring'?Object.entries(c.metrics||{}).map(([m,mc])=>`<a href="${reportHref(k,'outlet',m)}">${esc(mc.title)}<b>→</b></a>`):[`<a href="${reportHref(k,c.scopes?.[0])}">${esc(c.title)}<b>→</b></a>`]).join('');
      return `<article class="category-card"><div class="category-card-head"><div><span>${esc(navName)}</span><h2>${esc(navName)}</h2></div><a href="${reportHref(first[0],first[1].scopes?.[0],first[0]==='tring'?'nasabah':null)}">Buka →</a></div><div class="mini-links">${links}</div></article>`;
    }).join('');
  }
  function table(key,cfg,v){
    const kind=cfg.kind, isTarget=['target','deposito','nasabah','osl'].includes(kind)||key==='tring';
    const isAchievement=['nasabah_baru','nasabah_aktif','deposito_monitoring','tring'].includes(key);
    const showMtd=['nasabah_aktif','nasabah_baru','osl_rata_emas','omset_emas','deposito_monitoring'].includes(key);
    const showYtd=['osl_rata_emas','omset_emas','deposito_monitoring'].includes(key);
    if(kind==='mulia') return muliaTable(v);
    let h='<th>NO</th><th>'+(v.scope==='cabang'?'CABANG':'OUTLET')+'</th>';
    if(isTarget) h+='<th>TARGET TAHUNAN</th>';
    if(showMtd||showYtd){ if(showYtd)h+='<th>TAHUN LALU</th>'; if(showMtd)h+='<th>BULAN LALU</th>'; h+=`<th>${esc(dateLabel(v.left_date))}</th><th>${esc(dateLabel(v.right_date))}</th><th>DTD</th><th>DTD %</th>`; if(showMtd)h+='<th>MTD</th><th>MTD %</th>'; if(showYtd)h+='<th>YTD</th><th>YTD %</th>'; if(isAchievement)h+='<th>PENCAPAIAN</th>'; }
    else { if(key==='osl_rata_emas')h+='<th>TAHUN LALU</th>'; h+=`<th>${esc(dateLabel(v.left_date))}</th><th>${esc(dateLabel(v.right_date))}</th><th>DTD</th>`; if(isTarget)h+='<th>PENCAPAIAN</th>'; else if(key==='osl_rata_emas')h+='<th>YOY</th>'; }
    const body=v.rows.map((r,i)=>{let x=`<tr><td>${i+1}</td><td class="left">${esc(r.unit_key)}</td>`; if(isTarget)x+=`<td class="num">${fmt(r.target,cfg.decimals)}</td>`;
      if(showMtd||showYtd){if(showYtd)x+=`<td class="num">${fmt(r.prior_year,0)}</td>`;if(showMtd)x+=`<td class="num">${fmt(r.last_month,0)}</td>`;x+=`<td class="num">${fmt(r.left,0)}</td><td class="num blank">${fmt(r.right,0)}</td><td class="num ${cls(r.dtd)}">${signed(r.dtd,0)}</td><td class="num ${cls(r.dtd_pct)}">${pct(r.dtd_pct)}</td>`;if(showMtd)x+=`<td class="num ${cls(r.mtd)}">${signed(r.mtd,0)}</td><td class="num ${cls(r.mtd_pct)}">${pct(r.mtd_pct)}</td>`;if(showYtd)x+=`<td class="num ${cls(r.ytd)}">${signed(r.ytd,0)}</td><td class="num ${cls(r.ytd_pct)}">${pct(r.ytd_pct)}</td>`;if(isAchievement)x+=`<td class="num ${Number(r.achievement_pct)>=100?'up':'down'}">${fmt(r.right??r.left,0)} / ${pct(r.achievement_pct)}</td>`;}
      else{x+=key==='osl_rata_emas'?`<td class="num">${fmt(r.prior_year,0)}</td>`:'';x+=`<td class="num">${fmt(r.left,cfg.decimals)}</td><td class="num blank">${fmt(r.right,cfg.decimals)}</td><td class="num ${cls(r.dtd)}">${signed(r.dtd,cfg.decimals)}</td>`;if(isTarget)x+=`<td class="num ${Number(r.achievement_pct)>=100?'up':'down'}">${fmt(r.right??r.left,0)} / ${pct(r.achievement_pct)}</td>`;else if(key==='osl_rata_emas')x+=`<td class="num ${cls(r.yoy_pct)}">${pct(r.yoy_pct)}</td>`;}
      return x+'</tr>';}).join('');
    return `<div class="table-scroll"><table class="report-table" id="reportTable"><thead><tr>${h}</tr></thead><tbody>${body}</tbody></table></div>`;
  }
  function muliaTable(v){const dates=v.dates||[];let h='<th>NO</th><th>KODE OUTLET</th><th>NAMA CABANG</th><th>NAMA OUTLET</th>'+dates.map(d=>`<th>${esc(new Date(`${d}T00:00:00`).toLocaleDateString('id-ID',{day:'numeric',month:'short'}))}</th>`).join('')+'<th>GRAND TOTAL</th>';let totals=dates.map(()=>0),grand=0;let b=v.rows.map((r,i)=>{let gt=0;let cells=dates.map((d,j)=>{const n=Number(r.series?.[d]||0);totals[j]+=n;gt+=n;return `<td>${n?fmt(n,0):'—'}</td>`}).join('');grand+=gt;return `<tr><td>${i+1}</td><td>${esc(r.code||'')}</td><td>${esc(r.branch||'')}</td><td class="left">${esc(r.unit_name)}</td>${cells}<td class="num"><strong>${fmt(gt,0)}</strong></td></tr>`}).join('');return `<div class="table-scroll"><table class="report-table mulia-table"><thead><tr>${h}</tr></thead><tbody>${b}</tbody><tfoot><tr><td colspan="4">GRAND TOTAL</td>${totals.map(n=>`<td>${fmt(n,0)}</td>`).join('')}<td class="num">${fmt(grand,0)}</td></tr></tfoot></table></div>`;}
  function report(){
    const key=qs.get('report')||'lar_emas', cfg=data.reports_meta[key]; if(!cfg){document.getElementById('app').innerHTML='<section class="empty-card"><div class="empty-mark">404</div><h2>Laporan tidak ditemukan</h2><p>Kembali ke dashboard publik.</p></section>';return;}
    let metric=key==='tring'?(qs.get('metric')||'nasabah'):null, scope=qs.get('scope')||cfg.scopes?.[0]||'outlet'; const id=`${key}:${metric||'default'}:${scope}`; let v=data.reports[id];
    if(!v && key!=='tring') v=data.reports[`${key}:${scope}`]; if(!v){document.getElementById('app').innerHTML='<section class="empty-card"><div class="empty-mark">!</div><h2>Data belum tersedia</h2><p>Belum ada snapshot publik untuk laporan ini.</p></section>';return;}
    document.title=`${cfg.title} — Monitoring Area Senen`; document.getElementById('topDate').textContent=dateLabel(data.latest); nav();
    const groups={}; data.nav_order.forEach(n=>groups[n]=[]); Object.entries(data.reports_meta).forEach(([k,c])=>(groups[c.nav]??=[]).push([k,c]));
    const activeNav=cfg.nav; const sub=key==='tring'?Object.entries(cfg.metrics||{}).map(([m,mc])=>`<a class="subtab ${m===metric?'active':''}" href="${reportHref(key,'outlet',m)}">${esc(mc.title)}</a>`).join(''):groups[activeNav].map(([k,c])=>`<a class="subtab ${k===key?'active':''}" href="${reportHref(k,c.scopes?.[0])}">${esc(c.title)}</a>`).join('');
    const scopes=(cfg.scopes||[]).map(s=>`<a class="scope-pill ${s===scope?'active':''}" href="${reportHref(key,s,metric)}">${esc(s.toUpperCase())}</a>`).join('');
    const sortKeys=['dtd','mtd','ytd','achievement'];
    const sortBar=key!=='mulia_by_order'?`<div class="sort-bar"><span>SORT</span>${sortKeys.map(s=>`<button class="sort-pill" data-sort="${s}">${s.toUpperCase()}</button>`).join('')}</div>`:'';
    document.getElementById('app').innerHTML=`${activeNav==='TRING'?'':activeNav==='PROGRES KPI'?kpiCards(activeNav):''}<section class="subnav"><div class="subnav-inner">${sub}</div></section><div class="report-head"><div><span class="eyebrow">${esc(activeNav)}</span><h1>${esc(key==='tring'?(cfg.metrics[metric]?.title||cfg.title):cfg.title)}</h1></div></div>${scopes?`<div class="scope-switch"><span>LEVEL</span>${scopes}</div>`:''}${sortBar}<section class="table-card"><div class="table-bar"><div><b>${esc((key==='tring'?cfg.metrics[metric]?.title:cfg.title).toUpperCase())}</b><span>${esc(dateLabel(v.left_date))}${v.has_comparison?' → '+esc(dateLabel(v.right_date)):''}</span></div><input id="tableSearch" placeholder="Cari ${scope==='cabang'?'cabang':'outlet'}..." type="search"></div><div class="public-table-host">${table(key,key==='tring'?cfg.metrics[metric]:cfg,v)}</div></section>`;
    const search=document.getElementById('tableSearch'); if(search)search.addEventListener('input',()=>{const term=search.value.toLowerCase();document.querySelectorAll('#reportTable tbody tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(term)?'':'none');});
    document.querySelectorAll('[data-sort]').forEach(btn=>btn.addEventListener('click',()=>{
      const s=btn.dataset.sort; const val=r=>({achievement:r.achievement_pct,dtd:r.dtd,mtd:r.mtd,ytd:r.ytd}[s]);
      v.rows=[...v.rows].sort((a,b)=>(Number(val(b)??-Infinity)-Number(val(a)??-Infinity)) || String(a.unit_key).localeCompare(String(b.unit_key),'id'));
      const host=document.querySelector('.public-table-host'); if(host) host.innerHTML=table(key,key==='tring'?cfg.metrics[metric]:cfg,v);
      document.querySelectorAll('[data-sort]').forEach(x=>x.classList.toggle('active',x===btn));
    }));
  }
  function kpiCards(){const arr=data.insights['PROGRES KPI']||[];return `<section class="kpi-cards">${arr.map(c=>`<a class="kpi-card" href="${reportHref(c.key,(data.reports_meta[c.key]?.scopes||[])[0])}"><div class="kpi-head"><span>${esc(c.title)}</span><i>›</i></div><div class="kpi-moves"><div class="up"><b>${c.up}</b><span>Bertumbuh</span></div><div class="down"><b>${c.down}</b><span>Berkurang</span></div><div class="flat"><b>${c.flat}</b><span>Tetap</span></div><div class="move-total"><b>${signed(c.sum_dtd,2)}</b><span>Total DTD</span></div></div></a>`).join('')}</section>`;}
  fetch(DATA,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Data publik belum tersedia');return r.json()}).then(j=>{data=j;nav();if(location.pathname.endsWith('report.html'))report();else home();}).catch(e=>{const a=document.getElementById('app')||document.getElementById('categoryGrid');if(a)a.innerHTML=`<section class="empty-card"><div class="empty-mark">!</div><h2>Data publik belum tersedia</h2><p>Jalankan Publish Public Data dari Admin lokal terlebih dahulu.</p></section>`;});
})();
