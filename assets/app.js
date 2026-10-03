(() => {
  const DATA = 'data/public-data.json?v=' + Date.now();
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

  const monthNames=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const monthNamesUpper=monthNames.map(x=>x.toUpperCase());
  const previousMonthEnd = d => { if(!d)return null; const [y,m]=String(d).split('-').map(Number); const x=new Date(Date.UTC(y,m-1,0)); return `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}`; };
  const previousYearEnd = d => { if(!d)return null; return `${Number(String(d).slice(0,4))-1}-12-31`; };
  const dateLong = d => { if(!d)return '—'; const x=new Date(`${d}T00:00:00`); return `${x.getDate()} ${monthNames[x.getMonth()]} ${x.getFullYear()}`; };
  const dateLongUpper = d => dateLong(d).toUpperCase();
  const monthYearUpper = d => { if(!d)return '—'; const x=new Date(`${d}T00:00:00`); return `${monthNamesUpper[x.getMonth()]} ${x.getFullYear()}`; };

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
      if(showYtd)h+=`<th>${esc(dateLabel(previousYearEnd(v.right_date||v.left_date)))}</th>`;
      if(showMtd)h+=`<th>${esc(dateLabel(previousMonthEnd(v.right_date||v.left_date)))}</th>`;
      h+=`<th>${esc(dateLabel(v.left_date))}</th><th>${esc(dateLabel(v.right_date))}</th><th>DTD</th><th>DTD %</th>`;
      if(showMtd)h+='<th>MTD</th><th>MTD %</th>';
      if(showYtd)h+='<th>YTD</th><th>YTD %</th>';
      if(isAchievement)h+='<th>PENCAPAIAN</th>';
    } else {
      if(key==='osl_rata_emas')h+=`<th>${esc(dateLabel(previousYearEnd(v.right_date||v.left_date)))}</th>`;
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
  const rows=v.rows||[];
 const reportMonth=String(v.right_date||v.left_date||'').slice(0,7);
const dateSet=new Set();
rows.forEach(r=>Object.keys(r.series||{}).forEach(d=>dateSet.add(d)));
const dates=[...dateSet].filter(d=>String(d).slice(0,7)===reportMonth).sort();

  let h='<th>NO</th><th>KODE OUTLET</th><th>NAMA CABANG</th><th>NAMA OUTLET</th>'
    +dates.map(d=>`<th>${esc(dateShort(d))}</th>`).join('')
    +'<th>GRAND TOTAL</th>';

  const totals=dates.map(d=>rows.reduce((a,r)=>a+(Number(r.series?.[d])||0),0));
  const grand=rows.reduce((a,r)=>a+dates.reduce((x,d)=>x+(Number(r.series?.[d])||0),0),0);

  const b=rows.map((r,i)=>{
    const gt=dates.reduce((a,d)=>a+(Number(r.series?.[d])||0),0);
    const cells=dates.map(d=>{
      const n=Number(r.series?.[d]||0);
      return `<td>${n?fmt(n,0):'—'}</td>`;
    }).join('');
    return `<tr><td>${i+1}</td><td>${esc(r.code||'')}</td><td>${esc(r.branch||'')}</td><td class="left">${esc(r.unit_name||'')}</td>${cells}<td class="num"><strong>${fmt(gt,0)}</strong></td></tr>`;
  }).join('');

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
  function reportData(key,scope,metric){
    const cfg=data.reports_meta?.[key]||{};
    const id=key==='tring'
      ? `${key}:${metric||'nasabah'}:outlet`
      : (cfg.scopes?.length ? `${key}:${scope||cfg.scopes[0]}` : `${key}:default`);
    return data.reports?.[id]||null;
  }

  function sortedRows(key,v,sort){
    if(!v)return [];
    const rows=[...(v.rows||[])];
    if(!sort)return rows;
    const val=r=>({achievement:r.achievement_pct,dtd:r.dtd,mtd:r.mtd,ytd:r.ytd}[sort]);
    return rows.sort((a,b)=>(Number(val(b)??-Infinity)-Number(val(a)??-Infinity))||String(a.unit_key).localeCompare(String(b.unit_key),'id'));
  }

  function reportExportSets(key,metric,scope,sort){
    const cfg=data.reports_meta?.[key]||{};
    if(key==='tring'){
      const s=sort||'achievement';
      return ['nasabah','frekuensi','osl'].map(m=>{
        const view=reportData(key,'outlet',m);
        return {key,metric:m,scope:'outlet',view:view?{...view,rows:sortedRows(key,view,s)}:null,sort:s};
      });
    }
    if(key==='kpi_tahunan_outlet'){
      return ['cabang','outlet'].map(s=>{
        const view=reportData(key,s,null);
        if(!view)return {key,metric:null,scope:s,view:null,sort:null};
        const rows=[...(view.rows||[])].sort((a,b)=>(Number(b.right??b.left??0)-Number(a.right??a.left??0))||String(a.unit_name||'').localeCompare(String(b.unit_name||''),'id'));
        return {key,metric:null,scope:s,view:{...view,rows},sort:null};
      });
    }
    if(Array.isArray(cfg.scopes)&&cfg.scopes.includes('cabang')&&cfg.scopes.includes('outlet')){
      const s=sort||null;
      return ['cabang','outlet'].map(sc=>{
        const view=reportData(key,sc,null);
        return {key,metric:null,scope:sc,view:view?{...view,rows:s?sortedRows(key,view,s):[...(view.rows||[])]}:null,sort:s};
      });
    }
    const s=sort||null;
    const view=reportData(key,scope||null,null);
    return [{key,metric:null,scope:scope||null,view:view?{...view,rows:s?sortedRows(key,view,s):[...(view.rows||[])]}:null,sort:s}];
  }

  function pdfTitles(key,metric,reportDate){
    const d=dateLongUpper(reportDate), my=monthYearUpper(reportDate);
    const map={
      deposito_monitoring:`MONITORING PRODUK DEPOSITO EMAS KANTOR AREA SENEN ${d}`,
      omset_emas:`MONEV KINERJA OMSET EMAS (TANPA MTE) AREA SENEN ${d}`,
      mulia_by_order:`GRAMASI MULIA BY ORDER PER TANGGAL ${my}`,
      osl_rata_emas:`MONITORING OSL AKTIF RATA RATA PRODUK EMAS ${d}`,
      nasabah_baru:`JUMLAH NASABAH BARU PER TANGGAL ${d}`,
      nasabah_aktif:`JUMLAH NASABAH AKTIF PEMBIAYAAN TAHUNAN ${d}`,
      lar_emas:`PROGRES KPI LAR EMAS PER ${d}`,
      deposito_emas_kpi:`PROGRES KPI DEPOSITO EMAS PER ${d}`,
      kpi_tahunan_outlet:`PROGRES KPI TAHUNAN PER ${d}`,
    };
    if(key==='tring')return `DETAIL NASABAH AKTIF BERTRANSAKSI TRING ${d}`;
    return map[key]||`${String(data.reports_meta?.[key]?.title||key).toUpperCase()} ${d}`;
  }

  function pdfHeaderTitle(key,metric){
    const map={
      deposito_monitoring:'MONITORING PRODUK DEPOSITO EMAS KANTOR AREA SENEN',
      omset_emas:'MONITORING OMSET PRODUK EMAS KANTOR AREA SENEN',
      mulia_by_order:'Daftar Kredit Mulia By Status Order',
      osl_rata_emas:'MONITORING OSL AKTIF RATA RATA PRODUK EMAS KANTOR AREA SENEN',
      nasabah_baru:'JUMLAH NASABAH BARU',
      nasabah_aktif:'NASABAH AKTIF PEMBIAYAAN TAHUNAN',
      lar_emas:'PROGRES KPI LAR EMAS',
      deposito_emas_kpi:'PROGRES KPI DEPOSITO EMAS',
      kpi_tahunan_outlet:'PROGRES KPI TAHUNAN',
    };
    if(key==='tring')return String(data.reports_meta?.tring?.metrics?.[metric]?.title||metric||'TRING').toUpperCase();
    return map[key]||String(data.reports_meta?.[key]?.title||key).toUpperCase();
  }

  function buildMatrix(key,v,scope,metric,forPdf=false){
    const cfg=data.reports_meta?.[key]||{};
    if(key==='mulia_by_order'){
      const reportMonth=String(v?.right_date||v?.left_date||'').slice(0,7);
      const dateSet=new Set();
      (v?.rows||[]).forEach(r=>Object.keys(r.series||{}).forEach(d=>{if(String(d).slice(0,7)===reportMonth)dateSet.add(d);}));
      const dates=[...dateSet].sort();
      const headers=['NO','KODE OUTLET','NAMA CABANG','NAMA OUTLET',...dates.map(dateShort),'GRAND TOTAL'];
      const rows=(v?.rows||[]).map((r,i)=>{
        let gt=0; const cells=dates.map(d=>{const n=Number(r.series?.[d]||0);gt+=n;return n;});
        return [i+1,r.code||'',r.branch||'',r.unit_name||'',...cells,gt];
      });
      const total=['GRAND TOTAL','','','',...dates.map(d=>(v?.rows||[]).reduce((a,r)=>a+(Number(r.series?.[d])||0),0)),(v?.rows||[]).reduce((a,r)=>a+dates.reduce((x,d)=>x+(Number(r.series?.[d])||0),0),0)];
      return {headers,rows,total,reportDate:v?.right_date||v?.left_date,title:pdfTitles(key,metric,v?.right_date||v?.left_date),headerTitle:pdfHeaderTitle(key,metric),kind:'mulia'};
    }
    const {isTarget,isAchievement,showMtd,showYtd}=tableFlags(key,cfg);
    const baseDate=v?.right_date||v?.left_date;
    const pm=previousMonthEnd(baseDate), py=previousYearEnd(baseDate);
    const headers=['NO',scope==='cabang'?'CABANG':'OUTLET'];
    if(isTarget)headers.push('TARGET TAHUNAN');
    if(showMtd||showYtd){
      if(showYtd)headers.push(dateLabel(py));
      if(showMtd)headers.push(dateLabel(pm));
      headers.push(dateLabel(v.left_date),dateLabel(v.right_date),'DTD','DTD %');
      if(showMtd)headers.push('MTD','MTD %');
      if(showYtd)headers.push('YTD','YTD %');
      if(isAchievement){
        if(forPdf)headers.push('PENCAPAIAN'); else headers.push('REALISASI TERKINI','PENCAPAIAN %');
      }
    } else {
      if(key==='osl_rata_emas')headers.push(dateLabel(py));
      headers.push(dateLabel(v.left_date),dateLabel(v.right_date),'DTD');
      if(isAchievement){ if(forPdf)headers.push('PENCAPAIAN'); else headers.push('REALISASI TERKINI','PENCAPAIAN %'); }
      else if(key==='osl_rata_emas')headers.push('YOY %');
    }
    const rows=(v?.rows||[]).map((r,i)=>{
      const a=[i+1,r.unit_key]; if(isTarget)a.push(r.target);
      if(showMtd||showYtd){
        if(showYtd)a.push(forPdf?fmt(r.prior_year,0):r.prior_year);
        if(showMtd)a.push(forPdf?fmt(r.last_month,0):r.last_month);
        a.push(
          forPdf?fmt(r.left,cfg.decimals):r.left,
          forPdf?fmt(r.right,cfg.decimals):r.right,
          forPdf?signed(r.dtd,cfg.decimals):r.dtd,
          forPdf?(r.dtd_pct==null?'—':pct(r.dtd_pct)):(r.dtd_pct==null?null:r.dtd_pct/100)
        );
        if(showMtd)a.push(
          forPdf?signed(r.mtd,cfg.decimals):r.mtd,
          forPdf?(r.mtd_pct==null?'—':pct(r.mtd_pct)):(r.mtd_pct==null?null:r.mtd_pct/100)
        );
        if(showYtd)a.push(
          forPdf?signed(r.ytd,cfg.decimals):r.ytd,
          forPdf?(r.ytd_pct==null?'—':pct(r.ytd_pct)):(r.ytd_pct==null?null:r.ytd_pct/100)
        );
        if(isAchievement){
          const cur=r.right??r.left;
          if(forPdf)a.push(`${fmt(cur,0)} / ${pct(r.achievement_pct)}`); else a.push(cur,r.achievement_pct==null?null:r.achievement_pct/100);
        }
      } else {
        if(key==='osl_rata_emas')a.push(forPdf?fmt(r.prior_year,0):r.prior_year);
        a.push(forPdf?fmt(r.left,cfg.decimals):r.left,forPdf?fmt(r.right,cfg.decimals):r.right,forPdf?signed(r.dtd,cfg.decimals):r.dtd);
        if(isAchievement){const cur=r.right??r.left;if(forPdf)a.push(`${fmt(cur,0)} / ${pct(r.achievement_pct)}`);else a.push(cur,r.achievement_pct==null?null:r.achievement_pct/100);}
        else if(key==='osl_rata_emas')a.push(forPdf?(r.yoy_pct==null?'—':pct(r.yoy_pct)):(r.yoy_pct==null?null:r.yoy_pct/100));
      }
      return a;
    });
    const total=[];
    const rowsRaw=v?.rows||[];
    const sum=k=>rowsRaw.reduce((a,r)=>a+(Number(r[k])||0),0);
    const totalTarget=rowsRaw.reduce((a,r)=>a+(r.target==null?0:Number(r.target)),0);
    const totalPriorYear=rowsRaw.reduce((a,r)=>a+(r.prior_year==null?0:Number(r.prior_year)),0);
    const totalLastMonth=rowsRaw.reduce((a,r)=>a+(r.last_month==null?0:Number(r.last_month)),0);
    const totalLeft=rowsRaw.reduce((a,r)=>a+(r.left==null?0:Number(r.left)),0);
    const totalRight=rowsRaw.reduce((a,r)=>a+(r.right==null?0:Number(r.right)),0);
    const hasRight=rowsRaw.some(r=>r.right!=null);
    const totalDtd=rowsRaw.reduce((a,r)=>a+(r.dtd==null?0:Number(r.dtd)),0);
    const currentTotal=hasRight?totalRight:totalLeft;
    const achievementTotal=totalTarget>0?currentTotal/totalTarget*100:null;
    const totalMtdCalc=currentTotal-totalLastMonth;
    const totalYtdCalc=currentTotal-totalPriorYear;
    const mtdPctTotal=totalLastMonth!==0?(currentTotal/totalLastMonth-1)*100:null;
    const ytdPctTotal=totalPriorYear!==0?(currentTotal/totalPriorYear-1)*100:null;
    total.push('','TOTAL');
    if(isTarget)total.push(forPdf?fmt(totalTarget,cfg.decimals):totalTarget);
    if(showMtd||showYtd){
      if(showYtd)total.push(forPdf?fmt(totalPriorYear,0):totalPriorYear);
      if(showMtd)total.push(forPdf?fmt(totalLastMonth,0):totalLastMonth);
      total.push(forPdf?fmt(totalLeft,0):totalLeft,forPdf?(hasRight?fmt(totalRight,0):'—'):(hasRight?totalRight:null),forPdf?(v.has_comparison?signed(totalDtd,0):'—'):(v.has_comparison?totalDtd:null),forPdf?(v.has_comparison&&Math.abs(totalLeft)>1e-12?pct((totalRight/totalLeft-1)*100):'—'):(v.has_comparison&&Math.abs(totalLeft)>1e-12?(totalRight/totalLeft-1):null));
      if(showMtd)total.push(forPdf?signed(totalMtdCalc,0):totalMtdCalc,forPdf?pct(mtdPctTotal):mtdPctTotal==null?null:mtdPctTotal/100);
      if(showYtd)total.push(forPdf?signed(totalYtdCalc,0):totalYtdCalc,forPdf?pct(ytdPctTotal):ytdPctTotal==null?null:ytdPctTotal/100);
      if(isAchievement)total.push(forPdf?`${fmt(currentTotal,0)} / ${pct(achievementTotal)}`:currentTotal);
      if(!forPdf&&isAchievement)total.push(achievementTotal==null?null:achievementTotal/100);
    } else {
      if(key==='osl_rata_emas')total.push(forPdf?fmt(totalPriorYear,cfg.decimals):totalPriorYear);
      total.push(forPdf?fmt(totalLeft,cfg.decimals):totalLeft,forPdf?(hasRight?fmt(totalRight,cfg.decimals):'—'):(hasRight?totalRight:null),forPdf?(v.has_comparison?signed(totalDtd,cfg.decimals):'—'):(v.has_comparison?totalDtd:null));
      if(isAchievement)total.push(forPdf?`${fmt(currentTotal,0)} / ${pct(achievementTotal)}`:currentTotal,achievementTotal==null?null:achievementTotal/100);
      else if(key==='osl_rata_emas')total.push(forPdf?'—':null);
    }
    return {headers,rows,total,reportDate:baseDate,title:pdfTitles(key,metric,baseDate),headerTitle:pdfHeaderTitle(key,metric),kind:'standard'};
  }

  function applySheetWidths(ws,headers){
    ws['!cols']=headers.map((h,i)=>({wch:Math.min(24,Math.max(8,String(h).length+2+(i===1?8:0)))}));
    ws['!freeze']={xSplit:0,ySplit:1};
  }

  function buildKpiBranchExcelSheet(set){
    const rows=[...(set.view?.rows||[])].sort((a,b)=>(Number(b.right??b.left??0)-Number(a.right??a.left??0))||String(a.unit_name||'').localeCompare(String(b.unit_name||''),'id'));
    const total=rows.reduce((a,r)=>a+(Number(r.right??r.left)||0),0);
    const aoa=[
      ['PROGRES KPI TAHUNAN'],
      [dateLongUpper(set.view?.right_date||set.view?.left_date)],
      ['TOTAL NILAI KPI',total],
      [],
      ['RANK','KATEGORI','CABANG','NILAI KPI','KONTRIBUSI','DTD']
    ];
    rows.forEach((r,i)=>{
      const value=Number(r.right??r.left??0);
      const share=total?value/total:null;
      const category=String(r.unit_name||'').toUpperCase().startsWith('CPS ')?'CPS':'CP';
      aoa.push([i+1,category,r.unit_name||'',value,share,Number(r.dtd??0)]);
    });
    const ws=XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:5}},{s:{r:1,c:0},e:{r:1,c:5}}];
    ws['!cols']=[{wch:8},{wch:10},{wch:28},{wch:15},{wch:14},{wch:14}];
    ws['!rows']=[{hpt:24},{hpt:18},{hpt:20},{hpt:8},{hpt:20}];
    rows.forEach((_,i)=>{
      const r=i+5;
      const pctCell=ws[XLSX.utils.encode_cell({r,c:4})];
      if(pctCell)pctCell.z='0.0%';
      const valCell=ws[XLSX.utils.encode_cell({r,c:3})];
      if(valCell)valCell.z='0.00';
      const dtdCell=ws[XLSX.utils.encode_cell({r,c:5})];
      if(dtdCell)dtdCell.z='0.00';
    });
    return ws;
  }

  function buildExcelWorkbook(sets,key,metric,scope){
    const wb=XLSX.utils.book_new();
    sets.forEach(set=>{
      if(!set.view)return;
      if(key==='kpi_tahunan_outlet'&&set.scope==='cabang'){
        XLSX.utils.book_append_sheet(wb,buildKpiBranchExcelSheet(set),'Cabang');
        return;
      }
      const matrix=buildMatrix(set.key,set.view,set.scope,set.metric,false);
      const ws=XLSX.utils.aoa_to_sheet([matrix.headers,...matrix.rows,matrix.total||[]]);
      const pctCols=matrix.headers.reduce((a,h,i)=>String(h).toUpperCase().includes('%')?(a.push(i),a):a,[]);
      const numCols=matrix.headers.map((_,i)=>i).filter(i=>i>1&&!pctCols.includes(i));
      matrix.rows.forEach((row,ridx)=>{
        pctCols.forEach(c=>{const cell=ws[XLSX.utils.encode_cell({r:ridx+1,c})];if(cell&&typeof cell.v==='number')cell.z='0.0%';});
        numCols.forEach(c=>{const cell=ws[XLSX.utils.encode_cell({r:ridx+1,c})];if(cell&&typeof cell.v==='number')cell.z=(data.reports_meta?.[key]?.decimals??0)>0?'#,##0.00':'#,##0';});
      });
      const totalRow=matrix.rows.length+1;
      pctCols.forEach(c=>{const cell=ws[XLSX.utils.encode_cell({r:totalRow,c})];if(cell&&typeof cell.v==='number')cell.z='0.0%';});
      applySheetWidths(ws,matrix.headers);
      let name=set.scope==='cabang'?'Cabang':set.scope==='outlet'?'Outlet':set.metric?set.metric.charAt(0).toUpperCase()+set.metric.slice(1):'Data';
      if(key==='tring')name={nasabah:'Nasabah TRING',frekuensi:'Frekuensi TRING',osl:'OSL TRING'}[set.metric]||name;
      name=name.slice(0,31);
      XLSX.utils.book_append_sheet(wb,ws,name);
    });
    return wb;
  }

  function pdfStyle(kind,rows,key){
    if(key==='nasabah_baru')return {fontSize:4.45,cellPadding:.55};
    return {fontSize:kind==='mulia'?4.1:(rows.length>55?5.15:rows.length>35?5.7:6.2),cellPadding:rows.length>35?.65:.9};
  }

  function drawPdfTablePage(doc,matrix,scope,key,metric){
    const pw=doc.internal.pageSize.getWidth(), margin=8;
    const title=matrix.title, headerTitle=matrix.headerTitle;
    const st=pdfStyle(matrix.kind,matrix.rows,key);
    const nasabahBaru=key==='nasabah_baru';
    const tableTop=nasabahBaru?20:25;
    const titleY=nasabahBaru?8:8, headerY=nasabahBaru?8:13, dateY=nasabahBaru?13:17.5;
    doc.autoTable({startY:tableTop,margin:{left:margin,right:margin,top:tableTop,bottom:7},head:[matrix.headers],body:matrix.rows,foot:matrix.total?[matrix.total]:[],theme:'grid',pageBreak:nasabahBaru?'avoid':'auto',styles:{font:'helvetica',fontSize:st.fontSize,cellPadding:st.cellPadding,textColor:[20,45,39],lineColor:[185,199,192],lineWidth:.12,overflow:'linebreak',valign:'middle'},headStyles:{fillColor:[226,239,232],textColor:[21,63,53],fontStyle:'bold',fontSize:st.fontSize},footStyles:{fillColor:[214,230,221],textColor:[21,63,53],fontStyle:'bold'},alternateRowStyles:{fillColor:[250,252,250]},columnStyles:{0:{halign:'center'},1:{halign:'left'}},didDrawPage:()=>{doc.setTextColor(18,56,47);doc.setFont('helvetica','bold');if(!nasabahBaru){doc.setFontSize(10.5);doc.text(title,pw/2,titleY,{align:'center'});}doc.setFontSize(7.5);doc.text(headerTitle,pw/2,headerY,{align:'center'});doc.setFont('helvetica','normal');doc.setFontSize(6.7);doc.text(dateLongUpper(matrix.reportDate),pw/2,dateY,{align:'center'});}});
  }

  function drawKpiBranchPage(doc,set){
    const rows=[...(set.view?.rows||[])].sort((a,b)=>(Number(b.right??b.left??0)-Number(a.right??a.left??0))||String(a.unit_name).localeCompare(String(b.unit_name),'id'));
    const pw=doc.internal.pageSize.getWidth(), ph=doc.internal.pageSize.getHeight();
    const total=rows.reduce((a,r)=>a+(Number(r.right??r.left)||0),0);
    doc.setFillColor(5,60,48);doc.rect(0,0,pw,35,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text(set.title,pw/2,8,{align:'center'});doc.setFontSize(8.2);doc.text('PROGRES KPI TAHUNAN',pw/2,14,{align:'center'});doc.setFontSize(7);doc.text(dateLongUpper(set.view?.right_date||set.view?.left_date),pw/2,19,{align:'center'});doc.setFont('helvetica','normal');doc.text(`TOTAL NILAI KPI: ${fmt(total,2)}   ·   ${rows.length} CABANG`,pw/2,27,{align:'center'});
    const gap=4, x0=8, width=(pw-16-gap)/2, cardH=28, top=41;
    rows.forEach((r,i)=>{const col=i%2,row=Math.floor(i/2),x=x0+col*(width+gap),y=top+row*(cardH+gap);if(y+cardH>ph-8)return;const value=Number(r.right??r.left??0),share=total?value/total*100:0,category=String(r.unit_name||'').toUpperCase().startsWith('CPS ')?'CPS':'CP';doc.setFillColor(249,252,250);doc.setDrawColor(208,222,215);doc.roundedRect(x,y,width,cardH,2.5,2.5,'FD');doc.setTextColor(104,122,114);doc.setFont('helvetica','bold');doc.setFontSize(5.2);doc.text(`#${i+1}  ${category} · CABANG`,x+4,y+6);doc.setTextColor(18,61,50);doc.setFontSize(7.3);doc.text(String(r.unit_name||''),x+4,y+12);doc.setFontSize(10);doc.text(fmt(value,2),x+4,y+20);doc.setTextColor(Number(r.dtd??0)>=0?30:170,Number(r.dtd??0)>=0?122:45,Number(r.dtd??0)>=0?72:50);doc.setFontSize(6.2);doc.text(`DTD ${signed(r.dtd,2)}`,x+width-4,y+6,{align:'right'});doc.setDrawColor(220,231,225);doc.setFillColor(231,240,235);doc.roundedRect(x+4,y+23,width-8,2,1,1,'FD');doc.setFillColor(41,124,91);doc.roundedRect(x+4,y+23,(width-8)*Math.min(100,share)/100,2,1,1,'F');doc.setTextColor(104,122,114);doc.setFontSize(4.8);doc.text(`KONTRIBUSI ${num(share,1)}%`,x+width-4,y+27,{align:'right'});});
  }

  async function downloadExcel(key,metric,scope,sort){
    if(!window.XLSX){alert('Komponen Excel belum termuat. Coba refresh halaman.');return;}
    const sets=reportExportSets(key,metric,scope,sort); if(!sets.some(x=>x.view)){alert('Data belum tersedia.');return;}
    const wb=buildExcelWorkbook(sets,key,metric,scope);
    const filename=`${pdfTitles(key,metric,sets[0].view?.right_date||sets[0].view?.left_date).replace(/[^A-Za-z0-9_-]+/g,'_')}.xlsx`;
    XLSX.writeFile(wb,filename);
  }

  async function downloadPdf(key,metric,scope,sort){
    try{
      if(!window.jspdf?.jsPDF||typeof window.jspdf.jsPDF!=='function'||typeof window.jspdf.jsPDF.API.autoTable!=='function'){alert('Komponen PDF belum termuat. Coba refresh halaman.');return;}
      const sets=reportExportSets(key,metric,scope,sort); if(!sets.some(x=>x.view)){alert('Data belum tersedia.');return;}
      const {jsPDF}=window.jspdf; const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}); let first=true;
      sets.forEach(set=>{if(!set.view)return;if(!first)doc.addPage();first=false;if(key==='kpi_tahunan_outlet'&&set.scope==='cabang')drawKpiBranchPage(doc,set);else drawPdfTablePage(doc,buildMatrix(set.key,set.view,set.scope,set.metric,true),set.scope,key,set.metric);});
      const filename=`${pdfTitles(key,metric,sets[0].view?.right_date||sets[0].view?.left_date).replace(/[^A-Za-z0-9_-]+/g,'_')}.pdf`; doc.save(filename);
    }catch(err){console.error(err);alert('PDF gagal dibuat. Coba refresh halaman lalu ulangi.');}
  }

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
    content+=`<div class="report-head"><div><span class="eyebrow">${esc(activeNav)}</span><h1>${esc(key==='tring'?(cfg.metrics[currentMetric]?.title||cfg.title):cfg.title)}</h1></div><div class="export-actions"><button class="pdf-button" id="downloadExcel" type="button">Download Excel</button><button class="pdf-button pdf-secondary" id="downloadPdf" type="button">Download PDF</button></div></div>`;
    if(scopes)content+=`<div class="scope-switch"><span>LEVEL</span>${scopes}</div>`;
    content+=sortBar;
    if(key==='kpi_tahunan_outlet'&&scope==='cabang') content+=kpiBranchFlyer(v);
    else content+=`<section class="table-card"><div class="table-bar"><div><b>${esc((key==='tring'?cfg.metrics[currentMetric]?.title:cfg.title).toUpperCase())}</b><span>${esc(key==='mulia_by_order'?dateLabel(v.right_date||v.left_date):dateLabel(v.left_date))}${key!=='mulia_by_order'&&v.has_comparison?' → '+esc(dateLabel(v.right_date)):''}</span></div><input id="tableSearch" placeholder="Cari ${scope==='cabang'?'cabang':'outlet'}..." type="search"></div><div class="public-table-host">${table(key,key==='tring'?cfg.metrics[currentMetric]:cfg,v)}</div></section>`;
    document.getElementById('app').innerHTML=content;

    const search=document.getElementById('tableSearch');
    if(search)search.addEventListener('input',()=>{const term=search.value.toLowerCase();document.querySelectorAll('#reportTable tbody tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(term)?'':'none');});
    document.querySelectorAll('[data-sort]').forEach(btn=>btn.addEventListener('click',()=>{
      const s=btn.dataset.sort;
      const next=new URLSearchParams(location.search); next.set('sort',s); location.search=next.toString();
    }));
    document.getElementById('downloadExcel')?.addEventListener('click',()=>downloadExcel(key,currentMetric,scope,sort));
    document.getElementById('downloadPdf')?.addEventListener('click',()=>downloadPdf(key,currentMetric,scope,sort));
  }

  fetch(DATA,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Data publik belum tersedia');return r.json();}).then(j=>{data=j;nav();if(location.pathname.endsWith('report.html'))report();else home();}).catch(()=>{
    const a=document.getElementById('app')||document.getElementById('categoryGrid');
    if(a)a.innerHTML='<section class="empty-card"><div class="empty-mark">!</div><h2>Data publik belum tersedia</h2><p>Jalankan Publish Public Data dari Admin lokal terlebih dahulu.</p></section>';
  });
})();
