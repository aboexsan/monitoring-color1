const DE_MAX = 2.00;
const METRICS = [['dL','ΔL'],['da','Δa'],['db','Δb'],['dE','ΔE']];
const ANGLES = ['25°','45°','75°'];
const PARTS8 = ['Fender LH','Fender RH','FR Bumper LH','FR Bumper RH','Quarter LH','Quarter RH','RR Bumper LH','RR Bumper RH'];
const BULAN = ['JAN','FEB','MAR','APR','MEI','JUN','JUL','AGU','SEP','OKT','NOV','DES'];

// ---------- TARGET DEVIASI ADM per warna (dari lembar TARGET DATA COLOR ADM) ----------
const TARGETS = {
 'W09':{dL:[[-1,1],[-1,1],[-1,1]],da:[[-.2,.4],[-.2,.4],[-.2,.4]],db:[[-.3,.3],[-.3,.3],[-.3,.3]]},
 'W25':{dL:[[-1,1],[-1,1],[-1,1]],da:[[-.4,.4],[-.4,.4],[-.4,.4]],db:[[-.3,.5],[-.3,.5],[-.3,.5]]},
 '089':{dL:[[-1,1],[-1,1],[-1,1]],da:[[-.2,.4],[-.2,.4],[-.2,.4]],db:[[-.3,.5],[-.3,.5],[-.3,.5]]},
 '1E7':{dL:[[-1,1.5],[-1,1.5],[-1,1.5]],da:[[-.4,.4],[-.4,.4],[-.4,.4]],db:[[-.2,.4],[-.2,.4],[-.2,.4]]},
 'S28':{dL:[[-1.5,2],[-1.5,2],[-1.5,2]],da:[[-.4,.4],[-.4,.4],[-.4,.4]],db:[[0,.7],[0,.7],[0,.7]]},
 'P20':{dL:[[-1.3,1],[-1.3,1],[-1.3,1]],da:[[-.5,.5],[-.5,.5],[-.5,.5]],db:[[-.6,0],[-.6,0],[-.6,0]]},
 '1G3':{dL:[[-1.5,1.5],[-1.5,1.5],[-1.5,1.5]],da:[[-.1,.3],[-.1,.3],[-.1,.3]],db:[[.1,.5],[.1,.5],[.1,.5]]},
 'R54':{dL:[[-1,1.5],[-1,1.5],[-1,1.5]],da:[[-.5,.5],[-.5,.5],[-.5,.5]],db:[[-.5,.5],[-.5,.5],[-.5,.5]]},
 'X09':{dL:[[-.5,1],[-.5,1],[-.5,1]],da:[[-.5,.5],[-.5,.5],[-.5,.5]],db:[[-.5,.5],[-.5,.5],[-.5,.5]]},
 'X12':{dL:[[-.5,1],[-.5,1],[-.5,1]],da:[[-.3,.3],[-.3,.3],[-.3,.3]],db:[[-.1,.4],[-.1,.4],[-.1,.4]]},
 'X13':{dL:[[-.5,1],[-.5,1],[-.5,1]],da:[[-.5,.5],[-.5,.5],[-.5,.5]],db:[[-.5,.5],[-.5,.5],[-.5,.5]]},
 'R71':{dL:[[-.5,1],[-.5,1],[-.5,1]],da:[[-.2,.6],[-.2,.6],[-.2,.6]],db:[[-.2,.6],[-.2,.6],[-.2,.6]]},
 'R75':{dL:[[-1.5,1.5],[-1.5,1.5],[-1.5,1.5]],da:[[-.5,2],[-.5,2],[-.5,2]],db:[[-.5,2],[-.5,2],[-.5,2]]},
 'R40':{dL:[[-.5,1],[-.5,1],[-.5,1]],da:[[-.3,.6],[-.3,.6],[-.3,.6]],db:[[-.3,.6],[-.3,.6],[-.3,.6]]},
 'R79':{dL:[[-.5,1],[-.5,1],[-.5,1]],da:[[-.3,.6],[-.3,.6],[-.3,.6]],db:[[-.3,.6],[-.3,.6],[-.3,.6]]},
 '3Q3':{dL:[[-1,1.5],[-1,1.5],[-1,1.5]],da:[[-.5,.5],[-.5,.5],[-.5,.5]],db:[[-.5,.5],[-.5,.5],[-.5,.5]]},
 'Y13':{dL:[[-.5,1],[-.5,1],[-.5,1]],da:[[-.3,.3],[-.3,.3],[-.3,.3]],db:[[-.3,.6],[-.3,.6],[-.3,.6]]},
 'B86':{dL:[[-.5,1],[-.5,1],[-.5,1]],da:[[-.4,.4],[-.4,.4],[-.4,.4]],db:[[-.4,.4],[-.4,.4],[-.4,.4]]},
 'R80':{dL:[[-.5,1],[-.5,1],[-.5,1]],da:[[-.2,.8],[-.2,.8],[-.2,.8]],db:[[-.2,.8],[-.2,.8],[-.2,.8]]},
 '4T3':{dL:[[-1,1.5],[-1,1.5],[-1,1.5]],da:[[-.3,.4],[-.3,.4],[-.3,.4]],db:[[-.3,.4],[-.3,.4],[-.3,.4]]},
 'G64':{dL:[[-1,1.5],[-1,1.5],[-1,1.5]],da:[[-.5,.5],[-.5,.5],[-.5,.5]],db:[[-.5,.5],[-.5,.5],[-.5,.5]]}
};
function boundsOf(kode, m, a){
  if(m==='dE') return [-DE_MAX, DE_MAX];
  const t = TARGETS[kode];
  return (t && t[m]) ? t[m][a] : null;
}
function hexLum(hex){
  const h = String(hex).replace('#','');
  const r = parseInt(h.substr(0,2),16), g = parseInt(h.substr(2,2),16), b = parseInt(h.substr(4,2),16);
  return 0.299*r + 0.587*g + 0.114*b;
}
function hexLum(hex){
  const h = String(hex).replace('#','');
  const r = parseInt(h.substr(0,2),16), g = parseInt(h.substr(2,2),16), b = parseInt(h.substr(4,2),16);
  return 0.299*r + 0.587*g + 0.114*b;
}
function hitungNG(rec){
  const out = [];
  Object.keys(rec.rows).forEach(r=>{
    METRICS.forEach(([m])=>{
      rec.rows[r][m].forEach((v,a)=>{
        const b = boundsOf(rec.kode, m, a);
        if(b && !isNaN(v) && (v < b[0] || v > b[1]))
          out.push({row:r, m, a, label:`${r} ${m.toUpperCase()}${ANGLES[a]}`});
      });
    });
  });
  return out;
}

function renderInput(){
  const now = new Date();
  const tglOpts = Array.from({length:31},(_,i)=>`<option ${i+1===now.getDate()?'selected':''}>${i+1}</option>`).join('');
  const blnOpts = BULAN.map((b,i)=>`<option value="${i}" ${i===now.getMonth()?'selected':''}>${b}</option>`).join('');
  const thnOpts = [now.getFullYear()-1, now.getFullYear(), now.getFullYear()+1]
    .map(y=>`<option ${y===now.getFullYear()?'selected':''}>${y}</option>`).join('');
  const wOpts = KODE_WARNA.map(k=>`<option ${k.kode==='W09'?'selected':''}>${k.kode}</option>`).join('');
  const uOpts = DB.units.map(u=>`<option value="${u.id}">${esc(u.kode)} — ${esc(u.nama)}</option>`).join('');

  $('#app').innerHTML = `
    <h2 class="sect">📝 Form Input Data Color Matching</h2>
    <div class="sheet">
      <div class="fm-bar">
        <span class="fm-f"><b>Shift:</b> <select id="fmShift"><option>DAY</option><option>NIGHT</option></select></span>
        <span class="fm-f"><b>Tanggal:</b> <select id="fmT">${tglOpts}</select></span>
        <span class="fm-f"><b>Bulan:</b> <select id="fmB">${blnOpts}</select></span>
        <span class="fm-f"><b>Tahun:</b> <select id="fmY">${thnOpts}</select></span>
        <span class="fm-f"><b>Warna:</b> <select id="fmW" onchange="refreshNg()">${wOpts}</select></span>
        <span class="fm-f"><b>Unit:</b> <select id="fmU">${uOpts}</select></span>
        <span class="fm-f"><b>No Body:</b> <input id="fmNB" type="text" placeholder="cth: 12345"></span>
      </div>
      <div class="fm-tablewrap">
        <table class="fm-table">
          <thead>
            <tr><th rowspan="2" class="rowlab">PART</th>
              ${METRICS.map(([m,l])=>`<th colspan="3">${l}</th>`).join('')}</tr>
            <tr>${METRICS.map(()=>ANGLES.map(a=>`<th style="font-weight:700">${a}</th>`).join('')).join('')}</tr>
          </thead>
          <tbody id="ukurBody"></tbody>
        </table>
      </div>
      <div class="fm-foot">
        <span class="fm-note">📌 Auto-status vs <b>target ADM per warna</b>: semua sel dalam target → <b>OK</b>, ada yang keluar → <b>Perlu Cek</b>. ΔE dibanding target max 2.0. <b>Angka yang di luar target langsung merah otomatis</b>. Data masuk ke unit &amp; warna terpilih.</span>
        <button class="btn-teal" onclick="saveInput()">INPUT</button>
      </div>
    </div>
    <div class="io-panel" style="margin-top:18px">
      <h3>🕰 5 Input Terakhir</h3>
      <div id="lastInputs"></div>
      <div id="lastChartWrap" style="display:none; margin-top:16px">
        <h3>📊 Grafik Pengukuran Terakhir <span style="font-weight:500;font-size:12px;color:#5a6570">(vs target ADM)</span></h3>
        <div id="lastChart"></div>
      </div>
    </div>
  `;
  renderUkurRows();
  renderLastInputs();
  if(DB.measurements.length){
    $('#lastChartWrap').style.display = 'block';
    $('#lastChart').innerHTML = chartHTML(DB.measurements[0]);
  }
}

// ---------- SLIDESHOW grafik hasil pengecekan ----------
let ssIdx = 0, ssTimer = null, ssPlaying = true;
function ssRecords(){
  return DB.measurements.slice();
}
function ssStart(){
  ssStopTimer();
  const recs = ssRecords();
  if(ssIdx >= recs.length) ssIdx = 0;
  ssRender();
  if(recs.length > 1 && ssPlaying){
    ssTimer = setInterval(()=>{ ssIdx = (ssIdx+1) % ssRecords().length; ssRender(); }, 5000);
    const b = $('#ssPlayBtn'); if(b) b.textContent = '⏸';
  } else {
    const b = $('#ssPlayBtn'); if(b) b.textContent = '▶';
  }
}
function ssStopTimer(){ if(ssTimer){ clearInterval(ssTimer); ssTimer = null; } }
function ssRender(){
  const recs = ssRecords();
  const box = $('#ssBox');
  if(!box) return;
  if(!recs.length){
    $('#ssMeta').innerHTML = '';
    $('#ssDots').innerHTML = '';
    $('#ssCount').textContent = '';
    box.innerHTML = `<div class="empty-note" style="margin-bottom:0">Belum ada data pengukuran — slideshow akan terisi otomatis setelah ada input.</div>`;
    return;
  }
  const r = recs[ssIdx];
  const u = DB.units.find(x=>x.id===r.unitId) || {kode:'?', nama:'?'};
  const ngs = hitungNG(r);
  const okAll = !ngs.length;
  $('#ssCount').textContent = (ssIdx+1) + '/' + recs.length;
  $('#ssMeta').innerHTML = `
    <span style="font-size:15px;font-weight:800;color:var(--brand)">${esc(u.kode)} — ${esc(u.nama)}</span>
    <span class="ss-badge" style="background:#eef2f7;color:var(--brand)">Warna ${esc(r.kode)}</span>
    <span style="font-size:12.5px;color:#5a6570">📅 ${fmtTgl(r.tanggal)} • ${esc(r.shift)} • No.Body ${esc(r.noBody||'-')}</span>
    <span class="ss-badge ${okAll?'s-ok':'s-cek'}" style="margin-left:auto">${okAll ? 'Checked ✓' : '⚠ '+ngs.length+' sel NG'}</span>`;
  box.innerHTML = chartHTML(r);
  $('#ssDots').innerHTML = recs.map((_,i)=>`<button class="ss-dot ${i===ssIdx?'on':''}" onclick="ssGo(${i})" title="Record ${i+1}"></button>`).join('');
}
function ssNext(){ ssStopTimer(); const n = ssRecords().length; if(n){ ssIdx=(ssIdx+1)%n; ssRender(); } ssStart(); }
function ssPrev(){ ssStopTimer(); const n = ssRecords().length; if(n){ ssIdx=(ssIdx-1+n)%n; ssRender(); } ssStart(); }
function ssGo(i){ ssStopTimer(); ssIdx=i; ssRender(); ssStart(); }
function ssToggle(){
  ssPlaying = !ssPlaying;
  ssStart();
}


module.exports = { DE_MAX, METRICS, ANGLES, PARTS8, TARGETS, boundsOf, hitungNG };
