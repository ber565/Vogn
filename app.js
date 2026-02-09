// === DINE SUPABASE-NØKLER ===
const SUPABASE_URL = "https://kvectvrdtutardpknzkk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1fpq0aGzpS44ez1UJ5Vkvg_-bl-LWxy";
// =============================

let supa;
document.addEventListener('DOMContentLoaded', init);

function init() {
  supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;

      document.querySelectorAll('section.panel')
        .forEach(sec => sec.style.display = (sec.id === tab ? '' : 'none'));

      if (tab === 'registrering') populateRegForm();
      if (tab === 'status') renderStatus();
      if (tab === 'rapport') { populateReportFilters(); renderReport(); }
      if (tab === 'master') { renderPeople(); renderCarts(); }
    });
  });

  document.getElementById('fill-now').addEventListener('click', () => {
    document.getElementById('date').value = nowDate();
    document.getElementById('time').value = nowTime();
  });

  document.getElementById('reg-form').addEventListener('submit', onRegister);
  document.getElementById('apply-filter').addEventListener('click', renderReport);
  document.getElementById('export-csv').addEventListener('click', exportCsv);

  populateRegForm();
  renderStatus();
  populateReportFilters();
  renderReport();
  renderPeople();
  renderCarts();

  // Realtime changes
  supa.channel('public:transactions')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, () => {
      renderStatus();
      renderReport();
    })
    .subscribe();
}

// Utility
function nowDate(){ return new Date().toISOString().slice(0,10); }
function nowTime(){ return new Date().toTimeString().slice(0,5); }
function byId(list,id){ return list.find(x => x.id === id); }

// Database helpers
async function getPeople(){ return (await supa.from('people').select('*').eq('active',1).order('name')).data || []; }
async function getCarts(){ return (await supa.from('carts').select('*').eq('active',1).order('code')).data || []; }
async function getTx(){ return (await supa.from('transactions').select('*').order('event_at',{ascending:false})).data || []; }

async function addTx(row){
  const { error } = await supa.from('transactions').insert(row);
  if (error) throw error;
}

// REGISTRERING
async function populateRegForm(){
  const [people, carts, tx] = await Promise.all([getPeople(), getCarts(), getTx()]);
  const pSel = document.getElementById('person_id');
  const cSel = document.getElementById('cart_id');

  pSel.innerHTML = '<option value="">Velg person</option>' +
    people.map(p=>`<option value="${p.id}">${p.name} (${p.number})${p.dept?' – '+p.dept:''}</option>`).join('');

  function lastForCart(id){
    return tx.filter(t => t.cart_id === id)
      .sort((a,b)=>a.event_at < b.event_at ? 1 : -1)[0];
  }
  function isFree(id){
    const last = lastForCart(id);
    return !last || last.action === 'IN';
  }

  cSel.innerHTML =
    '<option value="">Velg vogn</option>' +
    carts.map(c=>{
      const free = isFree(c.id);
      return `<option value="${c.id}">${c.code} ${free?'':'[UTE]'}</option>`;
    }).join('');

  if (!document.getElementById('autoNow').checked){
    document.getElementById('date').value = nowDate();
    document.getElementById('time').value = nowTime();
  }
}

async function onRegister(e){
  e.preventDefault();
  const alertBox = document.getElementById('reg-alert');
  alertBox.innerHTML = '';

  const person_id = Number(document.getElementById('person_id').value);
  const cart_id   = Number(document.getElementById('cart_id').value);
  const action    = document.getElementById('action').value;
  let date        = document.getElementById('date').value;
  let time        = document.getElementById('time').value;
  const dept      = document.getElementById('dept').value.trim();
  const project   = document.getElementById('project').value.trim();
  const note      = document.getElementById('note').value.trim();
  const autoNow   = document.getElementById('autoNow').checked;

  const errors = [];
  if (!person_id) errors.push("Velg person.");
  if (!cart_id) errors.push("Velg vogn.");
  if (!action) errors.push("Velg handling.");

  if (autoNow){
    date = nowDate();
    time = nowTime();
  }
  if (!date || !time) errors.push("Dato og klokkeslett mangler.");

  // Sjekk status
  const tx = await getTx();
  const last = tx.filter(t=>t.cart_id===cart_id)
      .sort((a,b)=>a.event_at<b.event_at?1:-1)[0];
  const free = !last || last.action === 'IN';

  if (action==="OUT" && !free) errors.push("Vognen er allerede ute.");
  if (action==="IN" && free)   errors.push("Vognen er ikke registrert ute.");

  if (errors.length){
    alertBox.innerHTML = `<div class="alert alert-error"><ul>${errors.map(e=>`<li>${e}</li>`).join('')}</ul></div>`;
    return;
  }

  const event_at = new Date(`${date}T${time}:00`);

  try {
    await addTx({ person_id, cart_id, action, event_at, note, dept, project });
    alertBox.innerHTML = `<div class="alert alert-ok">Registrert!</div>`;
    populateRegForm(); renderStatus(); renderReport();
    document.getElementById('note').value = "";
    document.getElementById('project').value = "";
  } catch(err){
    alertBox.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

// STATUS
async function renderStatus(){
  const [carts, tx, people] = await Promise.all([getCarts(), getTx(), getPeople()]);
  const el = document.getElementById('status-table');

  function last(id){
    return tx.filter(t=>t.cart_id===id).sort((a,b)=>a.event_at<b.event_at?1:-1)[0];
  }

  let html = `<table><thead><tr>
    <th>Vogn</th><th>Type</th><th>Kapasitet</th><th>Område</th>
    <th>Tilgjengelig?</th><th>Hos</th><th>Sist</th><th>Handling</th>
    </tr></thead><tbody>`;

  carts.forEach(c=>{
    const l = last(c.id);
    const free = !l || l.action==='IN';
    const who = !free && l ? (byId(people,l.person_id)?.name || '') : '';
    const when = l ? new Date(l.event_at).toISOString().slice(0,16).replace('T',' ') : '';
    const act = l ? (l.action==='OUT'?'Tar ut':'Inn') : '';

    html += `<tr>
      <td>${c.code}</td><td>${c.type||""}</td><td>${c.cap||""}</td><td>${c.area||""}</td>
      <td class="${free?'tag-yes':'tag-no'}">${free?'Ja':'Nei'}</td>
      <td>${who}</td><td>${when}</td><td>${act}</td>
    </tr>`;
  });

  el.innerHTML = html + "</tbody></table>";
}

// RAPPORT
async function populateReportFilters(){
  const [people, carts] = await Promise.all([getPeople(), getCarts()]);
  document.getElementById('filter-person').innerHTML =
    '<option value="0">Alle</option>' + people.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');

  document.getElementById('filter-cart').innerHTML =
    '<option value="0">Alle</option>' + carts.map(c=>`<option value="${c.id}">${c.code}</option>`).join('');
}

async function renderReport(){
  const [tx, people, carts] = await Promise.all([getTx(), getPeople(), getCarts()]);
  const from = document.getElementById('from').value;
  const to   = document.getElementById('to').value;
  const pid  = Number(document.getElementById('filter-person').value);
  const cid  = Number(document.getElementById('filter-cart').value);
  const depF = document.getElementById('filter-dept').value.toLowerCase();
  const prjF = document.getElementById('filter-project').value.toLowerCase();

  let rows = tx.slice();

  if (from) rows = rows.filter(r=>r.event_at >= `${from}T00:00:00`);
  if (to)   rows = rows.filter(r=>r.event_at <= `${to}T23:59:59`);
  if (pid)  rows = rows.filter(r=>r.person_id === pid);
  if (cid)  rows = rows.filter(r=>r.cart_id === cid);
  if (depF) rows = rows.filter(r=>(r.dept||"").toLowerCase().includes(depF));
  if (prjF) rows = rows.filter(r=>(r.project||"").toLowerCase().includes(prjF));

  let html = `<table><thead><tr>
    <th>Tid</th><th>Handling</th><th>Person</th><th>Avd</th>
    <th>Prosjekt</th><th>Vogn</th><th>Type</th><th>Cap</th><th>Omr</th><th>Note</th>
  </tr></thead><tbody>`;

  rows.forEach(r=>{
    const p = byId(people, r.person_id);
    const c = byId(carts, r.cart_id);
    const when = new Date(r.event_at).toISOString().slice(0,16).replace('T',' ');

    html += `<tr>
      <td>${when}</td><td>${r.action}</td>
      <td>${p?.name||''}</td><td>${r.dept||p?.dept||""}</td>
      <td>${r.project||""}</td>
      <td>${c?.code||""}</td><td>${c?.type||""}</td>
      <td>${c?.cap||""}</td><td>${c?.area||""}</td>
      <td>${r.note||""}</td>
    </tr>`;
  });

  document.getElementById('report-table').innerHTML = html + "</tbody></table>";
}

// CSV
async function exportCsv(){
  const [tx, people, carts] = await Promise.all([getTx(), getPeople(), getCarts()]);
  const header = ['Event_at','Action','Person','Number','Dept','Project','Cart','Type','Capacity','Area','Note'];
  const rows = [header];

  tx.forEach(r=>{
    const p = byId(people,r.person_id);
    const c = byId(carts,r.cart_id);
    rows.push([
      new Date(r.event_at).toISOString(),
      r.action, p?.name||'', p?.number||'', r.dept||p?.dept||'', r.project||'',
      c?.code||'', c?.type||'', c?.cap||'', c?.area||'', (r.note||'').replace(/\n/g,' ')
    ]);
  });

  const csv = rows.map(x=>x.map(v=>`"${(v+"").replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv],{ type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = "rapport.csv"; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}

// MASTER
async function renderPeople(){
  const people = (await supa.from('people').select('*').order('name')).data || [];
  let html = `<table><thead><tr><th>ID</th><th>Nr</th><th>Navn</th><th>Avd</th><th>Aktiv</th></tr></thead><tbody>`;
  people.forEach(p=>{
    html += `<tr><td>${p.id}</td><td>${p.number}</td><td>${p.name}</td><td>${p.dept||''}</td><td>${p.active?'Ja':'Nei'}</td></tr>`;
  });
  document.getElementById('people-table').innerHTML = html + "</tbody></table>";
}

async function renderCarts(){
  const carts = (await supa.from('carts').select('*').order('code')).data || [];
  let html = `<table><thead><tr><th>ID</th><th>Kode</th><th>Type</th><th>Cap</th><th>Omr</th><th>Beskrivelse</th><th>Aktiv</th></tr></thead><tbody>`;
  carts.forEach(c=>{
    html += `<tr><td>${c.id}</td><td>${c.code}</td><td>${c.type||''}</td><td>${c.cap||''}</td><td>${c.area||''}</td><td>${c.desc||''}</td><td>${c.active?'Ja':'Nei'}</td></tr>`;
  });
  document.getElementById('carts-table').innerHTML = html + "</tbody></table>";
}
