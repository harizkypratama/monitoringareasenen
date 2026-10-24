(() => {
  'use strict';
  const DATA_URL = 'data/public-data.json';
  const GROUP_ORDER = ['KPI', 'OSL', 'LABA USAHA', 'CIR', 'NASABAH', 'KREDIT', 'EMAS', 'TRING', 'SINERGI HOLDING'];
  const GROUP_COMPONENTS = {
    'LABA USAHA': ['LABA USAHA'],
    CIR: ['CIR'],
    OSL: ['OSL AKTIF RATA-RATA GADAI','OSL AKTIF RATA-RATA NON GADAI','OSL AKTIF RATA-RATA EMAS','OSL GROSS POSISI'],
    NASABAH: ['NASABAH BARU','NASABAH BARU AGEN','NASABAH PEMBIAYAAN TAHUNAN','NASABAH TABUNGAN EMAS'],
    KREDIT: ['NPL GADAI','NPL NON GADAI','NPL EMAS','LAR GADAI','LAR NON GADAI','LAR EMAS'],
    EMAS: ['TABUNGAN EMAS','DEPOSITO EMAS','GRAMASI PRODUK GALERI 24','KPI STRETCH GOAL'],
    TRING: ['NASABAH TRING!','OSL LAYANAN TRING!','FREKUENSI TRANSAKSI TRING!'],
    'SINERGI HOLDING': ['CASHLESS DISBURSEMENT','OSL SINERGI HOLDING','TE SINERGI HOLDING']
  };
  const CATEGORY_BY_SCOPE = {
    area: ['AREA'],
    cabang: ['CP','CPS'],
    outlet: ['COLOCATION','UPC','UPC GADAI','UPS','UPS GADAI']
  };
  const CATEGORY_LABEL = { area:'Area', cabang:'Cabang', outlet:'Outlet' };
  const params = new URLSearchParams(location.search);
  let data = null;
  let currentGroup = GROUP_ORDER.includes(params.get('category')?.toUpperCase()) ? params.get('category').toUpperCase() : 'KPI';
  let currentScope = ['area','cabang','outlet'].includes(params.get('scope')) ? params.get('scope') : 'outlet';
  let currentMetric = params.get('component') || '';
  let currentSort = ['dtd','mtd','achievement'].includes(params.get('sort')) ? params.get('sort') : 'achievement';
  let currentCategoryFilter = params.get('filter') || 'ALL';
  let showTarget = params.get('target') !== '0';
  let searchTerm = '';

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const valid = v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
  const nval = (v, d=0) => valid(v) ? Number(v).toLocaleString('id-ID', {minimumFractionDigits:d, maximumFractionDigits:d}) : '—';
  const pval = v => valid(v) ? `${nval(v, 2)}%` : '—';
  const signed = (v, d=0) => valid(v) ? `${Number(v)>0?'+':''}${nval(v,d)}` : '—';
  const moneyClass = v => !valid(v) || Number(v)===0 ? 'tone-flat' : Number(v)>0 ? 'tone-positive' : 'tone-negative';
  const dateLabel = (s, full=true) => {
    if (!s) return '—';
    const d = new Date(`${String(s).slice(0,10)}T00:00:00`);
    if (Number.isNaN(d.getTime())) return esc(s);
    return d.toLocaleDateString('id-ID', full ? {day:'2-digit',month:'short',year:'numeric'} : {day:'2-digit',month:'short'});
  };
  const slug = s => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const metricGroup = name => Object.keys(GROUP_COMPONENTS).find(g => GROUP_COMPONENTS[g].includes(String(name||'').toUpperCase())) || '';
  const currentMetricObj = () => (data?.metric_groups?.[currentGroup] || []).find(m => m.key === currentMetric) || null;
  const currentView = (m=currentMetricObj(), scope=currentScope) => m?.views?.[scope] || null;
  const latestValue = r => valid(r?.right) ? Number(r.right) : valid(r?.left) ? Number(r.left) : null;
  const targetValue = r => valid(r?.target) ? Number(r.target) : null;
  const achievement = r => { const v=latestValue(r), t=targetValue(r); return v!==null && t!==null && t!==0 ? v/t*100 : null; };
  const gap = r => { const v=latestValue(r), t=targetValue(r); return v!==null && t!==null ? v-t : null; };
  const fmtMetric = (v, m=currentMetricObj()) => nval(v, Number(m?.decimals||0));

  function updateUrl(changes={}) {
    const p = new URLSearchParams(location.search);
    p.set('category', currentGroup);
    p.set('scope', currentScope);
    if (currentMetric) p.set('component', currentMetric); else p.delete('component');
    p.set('sort', currentSort);
    p.set('filter', currentCategoryFilter);
    p.set('target', showTarget ? '1' : '0');
    Object.entries(changes).forEach(([k,v]) => v === null ? p.delete(k) : p.set(k, String(v)));
    history.replaceState(null, '', `${location.pathname}?${p.toString()}`);
  }

  function navigateGroup(group) {
    currentGroup = group;
    currentScope = group === 'KPI' ? 'cabang' : 'outlet';
    currentCategoryFilter = 'ALL';
    const first = data?.metric_groups?.[group]?.[0];
    currentMetric = first?.key || '';
    currentSort = group === 'KPI' ? 'achievement' : 'achievement';
    updateUrl(); render();
  }
  function navigateMetric(key) { currentMetric=key; currentCategoryFilter='ALL'; updateUrl(); render(); }
  function navigateScope(scope) { currentScope=scope; currentCategoryFilter='ALL'; updateUrl(); render(); }

  function renderNav() {
    const nav = $('categoryNav');
    nav.innerHTML = GROUP_ORDER.map(group => `<button type="button" class="nav-tab ${currentGroup===group?'active':''}" data-group="${group}"><span>${esc(group==='KPI'?'KPI':group==='NASABAH'?'Nasabah':group==='KREDIT'?'Kredit':group==='EMAS'?'Emas':group==='TRING'?'Tring':group==='SINERGI HOLDING'?'Sinergi Holding':group==='LABA USAHA'?'Laba Usaha':group==='CIR'?'CIR':'OSL')}</span></button>`).join('');
    nav.querySelectorAll('[data-group]').forEach(btn=>btn.addEventListener('click',()=>navigateGroup(btn.dataset.group)));
  }

  function pageHeader() {
    const latest = data?.latest || data?.generated_at?.slice(0,10);
    const titles = {KPI:'Monitoring KPI Tahunan', OSL:'Monitoring OSL', 'LABA USAHA':'Monitoring Laba Usaha', CIR:'Monitoring CIR', NASABAH:'Monitoring Nasabah', KREDIT:'Monitoring Kredit', EMAS:'Monitoring Emas', TRING:'Monitoring TRING', 'SINERGI HOLDING':'Monitoring Sinergi Holding'};
    return `<section class="page-hero"><div class="page-hero-copy"><div class="eyebrow">MONITORING KINERJA AREA SENEN</div><h1>${titles[currentGroup] || 'Monitoring Area Senen'}</h1></div><div class="hero-status"><span class="status-dot"></span><div><small>DATA TERBARU</small><strong>${dateLabel(latest)}</strong></div></div></section>`;
  }

  function getKpiView(scope) { return data?.kpi_views?.[scope] || null; }
  function aggregateView(v) {
    const rows = v?.rows || [];
    const fields = ['left','right','last_month','dtd','mtd'];
    const out = {};
    fields.forEach(f => out[f] = rows.reduce((sum,r)=>sum+(Number(r[f])||0),0));
    out.current = valid(out.right) ? out.right : out.left;
    return out;
  }

  function kpiSummaryCard() {
    const v = getKpiView('area');
    const r = v?.rows?.[0] || null;
    const current = latestValue(r);
    const dtd = valid(r?.dtd) ? Number(r.dtd) : null;
    const mtd = valid(r?.mtd) ? Number(r.mtd) : null;
    return `<section class="kpi-score-card"><div class="score-main"><span class="score-label">KPI TAHUNAN AREA SENEN</span><div class="score-value">${fmtMetric(current, {decimals:2})}</div></div><div class="score-moves"><div class="score-move"><span>Delta Day</span><strong class="${moneyClass(dtd)}">${signed(dtd,2)}</strong><small>${dateLabel(v?.left_date)} → ${dateLabel(v?.right_date)}</small></div><div class="score-move"><span>Delta Month</span><strong class="${moneyClass(mtd)}">${signed(mtd,2)}</strong><small>Sejak ${dateLabel(v?.last_month_date || v?.last_month_baseline_date)}</small></div></div></section>`;
  }

  function sortControl(kpiMode=false) {
    const opts = kpiMode ? [['achievement','KPI Tahunan'],['dtd','Delta Day'],['mtd','Delta Month']] : [['achievement','Achievement'],['dtd','Delta Day'],['mtd','Delta Month']];
    return `<div class="sort-control" role="group" aria-label="Urutkan tabel">${opts.map(([key,label])=>`<button type="button" class="sort-chip ${currentSort===key?'active':''}" data-sort="${key}">${label}${currentSort===key?' ↓':''}</button>`).join('')}</div>`;
  }

  function sortedKpiRows(v) {
    const rows = [...(v?.rows||[])];
    rows.sort((a,b)=>{
      let av, bv;
      if(currentSort==='dtd'){av=Number(a.dtd ?? -Infinity); bv=Number(b.dtd ?? -Infinity);}
      else if(currentSort==='mtd'){av=Number(a.mtd ?? -Infinity); bv=Number(b.mtd ?? -Infinity);}
      else {av=latestValue(a) ?? -Infinity; bv=latestValue(b) ?? -Infinity;}
      return bv-av || String(a.unit_name||'').localeCompare(String(b.unit_name||''),'id');
    });
    return rows;
  }

  function kpiRankTable(scope) {
    const v = getKpiView(scope);
    const rows = sortedKpiRows(v);
    const title = scope==='cabang'?'Peringkat KPI Tahunan Cabang':'Peringkat KPI Tahunan Outlet';
    const nameTitle = scope==='cabang'?'Cabang':'Outlet';
    const headers = ['No',nameTitle,dateLabel(v?.last_month_date || v?.last_month_baseline_date),dateLabel(v?.left_date),dateLabel(v?.right_date),'Delta Day','Delta Month','KPI Tahunan'];
    const tbody = rows.map((r,i)=>`<tr><td class="rank-cell">${i+1}</td><td class="unit-cell"><strong>${esc(r.unit_name || r.unit_key)}</strong></td><td class="num">${nval(r.last_month,2)}</td><td class="num">${nval(r.left,2)}</td><td class="num latest-value">${nval(r.right,2)}</td><td class="num ${moneyClass(r.dtd)}">${signed(r.dtd,2)}</td><td class="num ${moneyClass(r.mtd)}">${signed(r.mtd,2)}</td><td class="num score-cell">${nval(latestValue(r),2)}</td></tr>`).join('');
    return `<section class="panel rank-panel"><div class="panel-heading"><div><span class="section-kicker">RANKING</span><h2>${title}</h2></div>${sortControl(true)}</div><div class="table-wrap"><table class="report-table export-table"><thead><tr>${headers.map((h,i)=>`<th class="${i>=2?'num':''}">${esc(h)}</th>`).join('')}</tr></thead><tbody>${tbody || `<tr><td colspan="8" class="empty-cell">Belum ada snapshot KPI untuk level ${nameTitle.toLowerCase()}.</td></tr>`}</tbody></table></div></section>`;
  }

  function renderKpi() {
    const search = `<div class="kpi-intro"><div><span class="section-kicker">RINGKASAN AREA</span><h2>Gambaran KPI Area Senen</h2></div></div>`;
    return `${search}${kpiSummaryCard()}${kpiRankTable('cabang')}${kpiRankTable('outlet')}`;
  }

  function activeGroupMetrics() {
    const items = data?.metric_groups?.[currentGroup] || [];
    const expected = GROUP_COMPONENTS[currentGroup] || [];
    return [...items].sort((a,b)=>{
      const ai=expected.indexOf(String(a.title||'').toUpperCase());
      const bi=expected.indexOf(String(b.title||'').toUpperCase());
      return (ai<0?999:ai)-(bi<0?999:bi);
    });
  }

  function areaAchievementTable(metrics) {
    const rows = metrics.map(m=>{
      const v=m.views?.area; const r=v?.rows?.[0] || null;
      return {metric:m, row:r, current:latestValue(r), target:targetValue(r), achievement:achievement(r), gap:gap(r)};
    }).sort((a,b)=>(b.achievement??-Infinity)-(a.achievement??-Infinity));
    const body = rows.map((x,i)=>`<tr><td class="rank-cell">${i+1}</td><td class="component-cell"><strong>${esc(x.metric.title)}</strong></td><td class="num weight-cell">${valid(x.row?.bobot_kpi)?`${nval(x.row.bobot_kpi,2).replace(/,00$/, '')}%`:'—'}</td>${showTarget?`<td class="num">${nval(x.target,x.metric.decimals)}</td>`:''}<td class="num latest-value">${nval(x.current,x.metric.decimals)}</td><td class="num kpi-annual-cell">${nval(x.row?.nilai_kpi_tahunan,2)}</td><td class="num"><span class="achievement-pill ${achClass(x.achievement)}">${pval(x.achievement)}</span></td><td class="num"><span class="gap-pill ${moneyClass(x.gap)}">${signed(x.gap,x.metric.decimals)}</span></td></tr>`).join('');
    const header = `<th>No</th><th>Komponen</th><th class="num">Bobot KPI</th>${showTarget?'<th class="num">Target Area</th>':''}<th class="num">Realisasi</th><th class="num">Nilai KPI Tahunan</th><th class="num">Achievement</th><th class="num">Gap Target</th>`;
    const emptyCols = (showTarget ? 8 : 7);
    return `<section class="panel area-panel"><div class="panel-heading"><div><span class="section-kicker">PENCAPAIAN AREA</span><h2>Pencapaian Area Senen</h2></div><label class="toggle-target"><input type="checkbox" id="areaTargetToggle" ${showTarget?'checked':''}><span>Target Tahunan</span></label></div><div class="table-wrap"><table class="report-table area-table"><thead><tr>${header}</tr></thead><tbody>${body||`<tr><td colspan="${emptyCols}" class="empty-cell">Data pencapaian Area belum tersedia.</td></tr>`}</tbody></table></div></section>`;
  }

  function metricTabs(metrics) {
    return `<section class="metric-tab-section"><div class="metric-tab-head"><div><h2>Detail ${esc(currentGroup)}</h2></div><span class="metric-count">${metrics.length} komponen</span></div><div class="metric-tabs" role="tablist">${metrics.map(m=>`<button type="button" class="metric-tab ${m.key===currentMetric?'active':''}" data-metric="${esc(m.key)}"><span>${esc(m.title)}</span><b>›</b></button>`).join('')}</div></section>`;
  }

  function achClass(v) {
    if (!valid(v)) return 'ach-none';
    const x=Number(v);
    if (x>=100) return 'ach-exceed';
    if (x>=90) return 'ach-good';
    if (x>=75) return 'ach-mid';
    return 'ach-low';
  }

  function scopeFilterTabs() {
    return `<div class="scope-tabs" role="group" aria-label="Pilih level data">${['area','cabang','outlet'].map(s=>`<button type="button" data-scope="${s}" class="scope-tab ${currentScope===s?'active':''}">${CATEGORY_LABEL[s]}</button>`).join('')}</div>`;
  }


  function filterAndSortRows(v) {
    let rows = [...(v?.rows||[])];
    const q=searchTerm.trim().toLowerCase();
    if(q) rows=rows.filter(r=>`${r.unit_name||''} ${r.unit_key||''} ${r.category||''}`.toLowerCase().includes(q));
    const metric = currentMetricObj(); const dec=Number(metric?.decimals||0);
    rows.sort((a,b)=>{
      let av,bv;
      if(currentSort==='dtd'){av=valid(a.dtd)?Number(a.dtd):-Infinity;bv=valid(b.dtd)?Number(b.dtd):-Infinity;}
      else if(currentSort==='mtd'){av=valid(a.mtd)?Number(a.mtd):-Infinity;bv=valid(b.mtd)?Number(b.mtd):-Infinity;}
      else {av=achievement(a);bv=achievement(b);av=av===null?-Infinity:av;bv=bv===null?-Infinity:bv;}
      return bv-av || String(a.unit_name||'').localeCompare(String(b.unit_name||''),'id');
    });
    return rows;
  }

  function tableGapCell(r,m) {
    const g=gap(r);
    return `<td class="num"><span class="gap-pill ${moneyClass(g)}">${signed(g,Number(m?.decimals||0))}</span></td>`;
  }

  function componentDetailTable(m) {
    const v=currentView(m,currentScope);
    const rows=filterAndSortRows(v);
    const dateMonth=v?.last_month_date || v?.last_month_baseline_date;
    const nameHead=currentScope==='area'?'Area':currentScope==='cabang'?'Cabang':'Outlet';
    const heads=['No',nameHead,...(showTarget?['Target Tahunan']:[]),dateLabel(dateMonth),dateLabel(v?.left_date),dateLabel(v?.right_date),'Delta Day','Delta Month','Ach %','Gap Target'];
    let previousRows='';
    const body=rows.map((r,i)=>{
      const ac=achievement(r);
      let cells=`<td class="rank-cell">${i+1}</td><td class="unit-cell"><strong>${esc(r.unit_name||r.unit_key)}</strong></td>`;
      if(showTarget) cells+=`<td class="num target-cell">${nval(r.target,m.decimals)}</td>`;
      cells+=`<td class="num">${nval(r.last_month,m.decimals)}</td><td class="num">${nval(r.left,m.decimals)}</td><td class="num latest-value">${nval(r.right,m.decimals)}</td>`;
      cells+=`<td class="num"><span class="delta-pill ${moneyClass(r.dtd)}">${signed(r.dtd,m.decimals)}</span></td><td class="num"><span class="delta-pill ${moneyClass(r.mtd)}">${signed(r.mtd,m.decimals)}</span></td>`;
      cells+=`<td class="num"><span class="achievement-pill ${achClass(ac)}">${pval(ac)}</span></td>${tableGapCell(r,m)}`;
      return `<tr>${cells}</tr>`;
    }).join('');
    const noData = rows.length ? '' : `<tr><td colspan="${heads.length}" class="empty-cell">Belum ada snapshot untuk komponen ini. Upload file KPI pada localhost, lalu klik Publish Public Data.</td></tr>`;
    return `<section class="panel detail-panel"><div class="panel-heading detail-heading"><div><span class="section-kicker">TABEL DETAIL</span><h2>${esc(m?.title||'Pilih komponen')}</h2><p>${CATEGORY_LABEL[currentScope]} · data terbaru ${dateLabel(v?.right_date || data?.latest)}</p></div><div class="detail-actions"><button type="button" class="export-button" id="downloadExcel"><span>↓</span> Excel</button><button type="button" class="export-button secondary" id="downloadPdf"><span>↓</span> PDF</button></div></div><div class="table-tools">${scopeFilterTabs()}<div class="target-search"><label class="toggle-target"><input type="checkbox" id="targetToggle" ${showTarget?'checked':''}><span>Target Tahunan</span></label><label class="search-box"><span>⌕</span><input id="tableSearch" type="search" placeholder="Cari cabang atau outlet…" value="${esc(searchTerm)}"></label></div>${sortControl(false)}</div><div class="table-wrap"><table class="report-table export-table" id="reportTable"><thead><tr>${heads.map((h,i)=>`<th class="${i>=2?'num':''}">${esc(h)}</th>`).join('')}</tr></thead><tbody>${body}${noData}</tbody></table></div><div class="table-footnote"><span>${rows.length.toLocaleString('id-ID')} baris</span></div></section>`;
  }

  function renderMetrics() {
    const metrics=activeGroupMetrics();
    if(!metrics.length) return `<section class="panel empty-panel"><h2>Data komponen belum tersedia</h2><p>Upload data KPI dari localhost dan gunakan tombol Publish Public Data supaya dashboard menerima komponen baru.</p></section>`;
    if(!metrics.some(m=>m.key===currentMetric)) currentMetric=metrics[0].key;
    return `${areaAchievementTable(metrics)}${metricTabs(metrics)}${componentDetailTable(currentMetricObj())}`;
  }

  function render() {
    renderNav();
    $('topDate').textContent = dateLabel(data?.latest || data?.generated_at?.slice(0,10));
    const root=$('app');
    root.innerHTML = `${pageHeader()}${currentGroup==='KPI'?renderKpi():renderMetrics()}`;
    wireEvents();
  }

  function wireEvents() {
    document.querySelectorAll('[data-metric]').forEach(btn=>btn.addEventListener('click',()=>navigateMetric(btn.dataset.metric)));
    document.querySelectorAll('[data-scope]').forEach(btn=>btn.addEventListener('click',()=>navigateScope(btn.dataset.scope)));
    document.querySelectorAll('[data-sort]').forEach(btn=>btn.addEventListener('click',()=>{currentSort=btn.dataset.sort;updateUrl();render();}));
    const targetToggle=$('targetToggle');
    if(targetToggle) targetToggle.addEventListener('change',()=>{showTarget=targetToggle.checked;updateUrl();render();});
    const areaTargetToggle=$('areaTargetToggle');
    if(areaTargetToggle) areaTargetToggle.addEventListener('change',()=>{showTarget=areaTargetToggle.checked;updateUrl();render();});
    const search=$('tableSearch');
    if(search) search.addEventListener('input',()=>{searchTerm=search.value;const q=searchTerm.toLowerCase();document.querySelectorAll('#reportTable tbody tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none');});
    const excel=$('downloadExcel'); if(excel) excel.addEventListener('click',downloadExcel);
    const pdf=$('downloadPdf'); if(pdf) pdf.addEventListener('click',downloadPdf);
  }

  function exportTables() {
    if(currentGroup==='KPI') return [...document.querySelectorAll('.rank-panel .report-table')];
    const table=$('reportTable'); return table ? [table] : [];
  }
  function exportFilename(ext) {
    const m=currentMetricObj();
    const label=currentGroup==='KPI'?'PERINGKAT_KPI_TAHUNAN':(m?.title||currentGroup).replace(/[^A-Z0-9]+/gi,'_');
    return `MONITORING_AREA_SENEN_${label}_${String(data?.latest||new Date().toISOString().slice(0,10)).replaceAll('-','')}.${ext}`;
  }
  function downloadExcel() {
    if(!window.XLSX){window.alert('Library Excel belum termuat. Periksa koneksi internet lalu coba lagi.');return;}
    const tables=exportTables(); if(!tables.length) return;
    const wb=XLSX.utils.book_new();
    tables.forEach((table,i)=>{
      const ws=XLSX.utils.table_to_sheet(table,{raw:true});
      ws['!cols'] = Array.from({length:(ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']).e.c+1 : 1)},(_,col)=>({wch:col<2?30:18}));
      const scope = table.closest('.rank-panel')?.querySelector('h2')?.textContent || currentMetricObj()?.title || 'Monitoring';
      XLSX.utils.book_append_sheet(wb,ws,String(scope).slice(0,31).replace(/[\\/*?:\[\]]/g,' ') || `Laporan${i+1}`);
    });
    XLSX.writeFile(wb,exportFilename('xlsx'));
  }
  function downloadPdf() {
    if(!window.jspdf?.jsPDF){window.alert('Library PDF belum termuat. Periksa koneksi internet lalu coba lagi.');return;}
    const tables=exportTables(); if(!tables.length) return;
    const doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'pt',format:'a4'});
    tables.forEach((table,i)=>{
      if(i>0) doc.addPage();
      const label=table.closest('.rank-panel')?.querySelector('h2')?.textContent || currentMetricObj()?.title || 'Monitoring Area Senen';
      doc.setFontSize(12); doc.setTextColor(0,75,66); doc.text(String(label).toUpperCase(),36,30);
      doc.setFontSize(8); doc.setTextColor(90); doc.text(`Monitoring Area Senen · Data ${dateLabel(data?.latest)}`,36,43);
      doc.autoTable({html:table,startY:53,theme:'grid',styles:{font:'helvetica',fontSize:7,cellPadding:4,overflow:'linebreak'},headStyles:{fillColor:[0,85,74],textColor:[255,255,255]},alternateRowStyles:{fillColor:[245,249,247]},margin:{left:30,right:30,bottom:30},horizontalPageBreak:true,horizontalPageBreakRepeat:0});
    });
    doc.save(exportFilename('pdf'));
  }

  fetch(DATA_URL,{cache:'no-store'}).then(res=>{if(!res.ok) throw new Error('Data publik belum tersedia');return res.json();}).then(json=>{
    data=json;
    if(!currentMetric) currentMetric=data?.metric_groups?.[currentGroup]?.[0]?.key || '';
    if(!data.metric_groups) data.metric_groups={};
    render();
  }).catch(err=>{
    const root=$('app') || document.body;
    root.innerHTML=`<section class="panel empty-panel"><h2>Data publik belum dapat dimuat</h2><p>${esc(err.message)}. Pastikan file <code>data/public-data.json</code> tersedia, lalu publish kembali dari Admin localhost.</p></section>`;
  });
})();
