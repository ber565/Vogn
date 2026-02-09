// === SUPABASE-KONFIG (dine nøkler) ===
const SUPABASE_URL = "https://kvectvrdtutardpknzkk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1fpq0aGzpS44ez1UJ5Vkvg_-bl-LWxy";
// =====================================

let supa;

document.addEventListener('DOMContentLoaded', async () => {
  supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Hash-faner: sett aktiv tab-lenke
  function updateActiveTab() {
    const h = (location.hash || '#registrering');
    document.querySelectorAll('.tabbar a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === h);
    });
  }
  window.addEventListener('hashchange', updateActiveTab);
  updateActiveTab();

  // Event handlers
  document.getElementById('fill-now')?.addEventListener('click', () => {
    document.getElementById('date').value = nowDate();
    document.getElementById('time').value = nowTime();
  });

  document.getElementById('reg-form')?.addEventListener('submit', onRegister);
  document.getElementById('apply-filter')?.addEventListener('click', renderReport);
  document.getElementById('export-csv')?.addEventListener('click', exportCsv);

  // Master-skjema (NB! krever åpne policyer for write, se punkt 4)
  document.getElementById('person-form')?.addEventListener('submit', onUpsertPerson);
  document.getElementById('cart-form')?.addEventListener('submit', onUpsertCart);

  // Backup-knapper – eksporter fungerer; import/reset krever write-policyer
  document.getElementById('export-json')?.addEventListener('click', exportJson);
  document.getElementById('import-file')?.addEventListener('change', importJson);
  document.getElementById('reset-all')?.addEventListener('click', resetAllWarning);

  // Init innhold
  await populateSearchLists();
  await populateRegSelects();
  await renderStatus();
  await populateReportFilters();
  await renderReport();
  await renderPeople();
  await renderCarts();

  // Realtime: oppdater status/rapport når nye transaksjoner kommer inn
  supa.channel('public:transactions')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, () => {
      renderStatus(); renderReport(); populateRegSelects();
    })
    .subscribe();
});

// ---------- Utils ----------
function nowDate(){ return new Date().toISOString().slice(0,10); }
function nowTime(){ return new Date().toTimeString().slice(0,5); }
function byId(list, id){ return list.find(x => String(x.id) === String(id)); }
function isoLocal(dt){ // viser som YYYY-MM-DD HH:mm
  try { return new Date(dt).toISOString().slice(0,16).replace('T',' '); }
  catch { return ''; }
}
function showAlert(elId, msg, isErr=false){
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = `<div class="alert ${isErr?'alert-error':'alert-ok'}">${msg}</div>`;
  setTimeout(()=>{ el.innerHTML=''; }, 3000);
}

// ---------- DB helpers ----------
async function getPeople(activeOnly=true){
  const q = supa.from('people').select('*').order('name', {ascending:true});
  const { data, error } = activeOnly ? await q.eq('active',1) : await q;
  if (error) throw error;
  return data || [];
}
async function getCarts(activeOnly=true){
  const q = supa.from('carts').select('*').order('code', {ascending:true});
  const { data, error } = activeOnly ? await q.eq('active',1) : await q;
  if (error) throw error;
  return data || [];
}
async function getTx(){
  const { data, error } = await supa.from('transactions').select('*').order('event_at', {ascending:false});
  if (error) throw error;
  return data || [];
}
async function addTx(row){
  const { error } = await supa.from('transactions').insert(row);
  if (error) throw error;
}

// ---------- Søke/datalist for person/vogn ----------
let _peopleCache = [];
let _cartsCache = [];

async function populateSearchLists(){
  _peopleCache = await getPeople(true);
  _cartsCache  = await getCarts(true);

  // PEOPLE datalist
  const dlPeople = document.getElementById('peopleList');
  if (dlPeople){
    dlPeople.innerHTML = _peopleCache.map(p => {
      const label = `${p.name} (${p.number})${p.dept ? ' – '+p.dept : ''}`;
      // value i datalist er det som skrives inn i input, vi legger også id i data-attr via option label-tekst
      return `<option value="${label}" data-id="${p.id}"></option>`;
    }).join('');
  }

  // CARTS datalist
  const dlCarts = document.getElementById('cartsList');
  if (dlCarts){
    dlCarts.innerHTML = _cartsCache.map(c => {
      const label = `${c.code}${c.type? ' – '+c.type: ''}${c.cap? ' · '+c.cap+' kg':''}${c.area? ' · '+c.area:''}`;
      return `<option value="${label}" data-id="${c.id}"></option>`;
    }).join('');
  }

  // Koble input -> hidden select id
  const personInput = document.getElementById('person_search');
  const cartInput   = document.getElementById('cart_search');
  const personSel   = document.getElementById('person_id');
  const cartSel     = document.getElementById('cart_id');

  function resolvePersonId(text){
    if (!text) return '';
    // søk på (1) eksakt label, (2) inneholder navn, (3) inneholder nummer
    const exact = _peopleCache.find(p => text.startsWith(p.name));
    if (exact) return exact.id;
    const num = text.match(/\((\d+)\)/)?.[1];
    if (num){
      const byNumber = _peopleCache.find(p => String(p.number) === String(num));
      if (byNumber) return byNumber.id;
    }
    // fallback: substring på navn/nummer
    const lower = text.toLowerCase();
    const any = _peopleCache.find(p => p.name.toLowerCase().includes(lower) || String(p.number).includes(lower));
    return any?.id || '';
  }

  function resolveCartId(text){
    if (!text) return '';
    // typisk "PV 12 …" → finn på code-start
    const code = text.split(' ')[0].trim();
    const byCode = _cartsCache.find(c => c.code.toLowerCase() === code.toLowerCase());
    if (byCode) return byCode.id;
    // fallback: substring
    const lower = text.toLowerCase();
    const any = _cartsCache.find(c => c.code.toLowerCase().includes(lower));
    return any?.id || '';
  }

  personInput?.addEventListener('input', () => { personSel.value = resolvePersonId(personInput.value) || ''; });
  personInput?.addEventListener('change', () => { personSel.value = resolvePersonId(personInput.value) || ''; });

  cartInput?.addEventListener('input', () => { cartSel.value = resolveCartId(cartInput.value) || ''; });
  cartInput?.addEventListener('change', () => { cartSel.value = resolveCartId(cartInput.value) || ''; });
}

// ---------- REGISTRERING ----------
async function populateRegSelects(){
  // Brukes for å sette default dato/tid og sørge for at [UTE]-merking kommer i søkefeltene (hint: her bare dato/tid)
  if (!document.getElementById('autoNow')?.checked){
    document.getElementById('date').value = nowDate();
    document.getElementById('time').value = nowTime();
  }
}

async function onRegister(e){
  e.preventDefault();
  const alertId = 'reg-alert';

  const person_id = parseInt(document.getElementById('person_id').value || '0', 10);
  const cart_id   = parseInt(document.getElementById('cart_id').value || '0', 10);
  const action    = document.getElementById('action').value;
  const autoNow   = document.getElementById('autoNow').checked;

  let date = document.getElementById('date').value;
  let time = document.getElementById('time').value;

  const dept    = document.getElementById('dept').value.trim();
  const project = document.getElementById('project').value.trim();
  const note    = document.getElementById('note').value.trim();

  const errs = [];
  if (!person_id) errs.push('Velg/skriv person og velg et forslag.');
  if (!cart_id)   errs.push('Velg/skriv vogn og velg et forslag.');
  if (!action)    errs.push('Velg handling.');

  if (autoNow){
    date = nowDate();
    time = nowTime();
  }
  if (!date || !time) errs.push('Dato/klokkeslett må fylles ut.');

  // Statussjekk
  try {
    const tx = await getTx();
    const last = tx.filter(t => t.cart_id === cart_id).sort((a,b)=> a.event_at < b.event_at ? 1 : -1)[0];
    const free = !last || last.action === 'IN';
    if (action === 'OUT' && !free) errs.push('Vognen er allerede ute.');
    if (action === 'IN'  &&  free) errs.push('Vognen er ikke registrert ute.');
  } catch (e) {
    errs.push('Kunne ikke sjekke vognstatus.');
  }

  if (errs.length){
    showAlert(alertId, `<ul>${errs.map(x=>`<li>${x}</li>`).join('')}</ul>`, true);
    return;
  }

  const event_at = new Date(`${date}T${time}:00`);

  try {
    await addTx({ person_id, cart_id, action, event_at, note, dept, project });
    showAlert(alertId, 'Hendelsen ble registrert ✅');
    document.getElementById('note').value = '';
    document.getElementById('project').value = '';
    await renderStatus(); await renderReport(); await populateRegSelects();
  } catch (err){
    showAlert(alertId, `Feil ved lagring: ${err.message}`, true);
  }
}

// ---------- STATUS ----------
async function renderStatus(){
  try {
    const [carts, tx, people] = await Promise.all([getCarts(true), getTx(), getPeople(true)]);
    const el = document.getElementById('status-table');
    let html = `<table class="table"><thead><tr>
      <th>Vogn</th><th>Type</th><th>Kapasitet</th><th>Område</th>
      <th>Tilgjengelig?</th><th>Hos</th><th>Sist bevegelse</th><th>Siste handling</th>
    </tr></thead><tbody>`;

    function last(id){
      return tx.filter(t=>t.cart_id===id).sort((a,b)=> a.event_at < b.event_at ? 1 : -1)[0];
    }

    carts.forEach(c=>{
      const l = last(c.id);
      const free = !l || l.action === 'IN';
      const who = !free && l ? (byId(people, String(l.person_id))?.name || '') : '';
      html += `<tr>
        <td>${c.code}</td>
        <td>${c.type || ''}</td>
        <td>${c.cap ? c.cap + ' kg' : ''}</td>
        <td>${c.area || ''}</td>
        <td class="${free?'tag-yes':'tag-no'}">${free?'Ja':'Nei'}</td>
        <td>${who}</td>
        <td>${l ? isoLocal(l.event_at) : ''}</td>
        <td>${l ? (l.action==='OUT'?'Tar ut':'Leverer inn') : ''}</td>
      </tr>`;
    });

    el.innerHTML = html + `</tbody></table>`;
  } catch (e) {
    document.getElementById('status-table').innerHTML = 'Kunne ikke hente status.';
  }
}

// ---------- RAPPORT ----------
async function populateReportFilters(){
  try {
    const [people, carts] = await Promise.all([getPeople(true), getCarts(true)]);
    document.getElementById('filter-person').innerHTML =
      '<option value="0">Alle</option>' + people.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    document.getElementById('filter-cart').innerHTML =
      '<option value="0">Alle</option>' + carts.map(c => `<option value="${c.id}">${c.code}</option>`).join('');
  } catch { /* no-op */ }
}

async function renderReport(){
  try {
    const [tx, people, carts] = await Promise.all([getTx(), getPeople(false), getCarts(false)]);
    const from = document.getElementById('from').value;
    const to   = document.getElementById('to').value;
    const pid  = parseInt(document.getElementById('filter-person').value || '0', 10);
    const cid  = parseInt(document.getElementById('filter-cart').value || '0', 10);
    const depF = (document.getElementById('filter-dept').value || '').toLowerCase();
    const prjF = (document.getElementById('filter-project').value || '').toLowerCase();

    let rows = tx.slice();
    if (from) rows = rows.filter(r => String(r.event_at) >= `${from}T00:00:00`);
    if (to)   rows = rows.filter(r => String(r.event_at) <= `${to}T23:59:59`);
    if (pid)  rows = rows.filter(r => Number(r.person_id) === pid);
    if (cid)  rows = rows.filter(r => Number(r.cart_id) === cid);
    if (depF) rows = rows.filter(r => (r.dept || '').toLowerCase().includes(depF));
    if (prjF) rows = rows.filter(r => (r.project || '').toLowerCase().includes(prjF));

    let html = `<table class="table"><thead><tr>
      <th>Tid</th><th>Handling</th><th>Person</th><th>Avdeling</th>
      <th>Celle</th><th>Vogn</th><th>Type</th><th>Cap</th><th>Område</th><th>Note</th>
    </tr></thead><tbody>`;

    rows.forEach(r => {
      const p = byId(people, String(r.person_id));
      const c = byId(carts, String(r.cart_id));
      html += `<tr>
        <td>${isoLocal(r.event_at)}</td>
        <td>${r.action === 'OUT' ? 'Tar ut' : 'Leverer inn'}</td>
        <td>${p?.name || ''} (${p?.number || ''})</td>
        <td>${r.dept || p?.dept || ''}</td>
        <td>${r.project || ''}</td>
        <td>${c?.code || ''}</td>
        <td>${c?.type || ''}</td>
        <td>${c?.cap || ''}</td>
        <td>${c?.area || ''}</td>
        <td>${r.note || ''}</td>
      </tr>`;
    });

    document.getElementById('report-table').innerHTML = html + `</tbody></table>`;
  } catch (e) {
    document.getElementById('report-table').innerHTML = 'Kunne ikke generere rapport.';
  }
}

async function exportCsv(){
  const [tx, people, carts] = await Promise.all([getTx(), getPeople(false), getCarts(false)]);
  const header = ['Event_at','Action','Person','Number','Dept','Project','Cart','Type','Capacity','Area','Note'];
  const rows = [header];

  tx.forEach(r=>{
    const p = byId(people, String(r.person_id));
    const c = byId(carts, String(r.cart_id));
    rows.push([
      new Date(r.event_at).toISOString(),
      r.action, p?.name||'', p?.number||'', r.dept||p?.dept||'', r.project||'',
      c?.code||'', c?.type||'', c?.cap||'', c?.area||'', (r.note||'').replace(/\r?\n/g,' ')
    ]);
  });

  const csv = rows.map(arr => arr.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'rapport.csv'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
}

// ---------- MASTER (lese ut av boksen; skriv krever åpne policyer) ----------
async function renderPeople(){
  const { data } = await supa.from('people').select('*').order('name', {ascending:true});
  const people = data || [];
  let html = `<table class="table"><thead><tr>
    <th>ID</th><th>Nummer</th><th>Navn</th><th>Avdeling</th><th>Aktiv</th>
  </tr></thead><tbody>`;
  people.forEach(p=>{
    html += `<tr><td>${p.id}</td><td>${p.number}</td><td>${p.name}</td><td>${p.dept || ''}</td><td>${p.active?'Ja':'Nei'}</td></tr>`;
  });
  document.getElementById('people-table').innerHTML = html + `</tbody></table>`;
}

async function renderCarts(){
  const { data } = await supa.from('carts').select('*').order('code', {ascending:true});
  const carts = data || [];
  let html = `<table class="table"><thead><tr>
    <th>ID</th><th>Code</th><th>Type</th><th>Kapasitet</th><th>Område</th><th>Beskrivelse</th><th>Aktiv</th>
  </tr></thead><tbody>`;
  carts.forEach(c=>{
    html += `<tr>
      <td>${c.id}</td><td>${c.code}</td><td>${c.type || ''}</td>
      <td>${c.cap || ''}</td><td>${c.area || ''}</td><td>${c.description || ''}</td><td>${c.active?'Ja':'Nei'}</td>
    </tr>`;
  });
  document.getElementById('carts-table').innerHTML = html + `</tbody></table>`;
}

// SKJEMA: legg til/oppdater person (krever write-policyer)
async function onUpsertPerson(e){
  e.preventDefault();
  const number = parseInt(document.getElementById('p-number').value, 10);
  const name   = document.getElementById('p-name').value.trim();
  const dept   = document.getElementById('p-dept').value.trim();
  const active = parseInt(document.getElementById('p-active').value, 10);

  if (!number || !name){
    alert('Nummer og navn må fylles ut.'); return;
  }
  // Finn om nr finnes – Supabase har ikke "upsert" uten unique constraint; vi gjør manuelt
  const { data: existing } = await supa.from('people').select('*').eq('number', number).limit(1);
  let error;
  if (existing && existing.length){
    const { error: e1 } = await supa.from('people').update({ name, dept, active }).eq('id', existing[0].id);
    error = e1;
  } else {
    const { error: e2 } = await supa.from('people').insert({ number, name, dept, active });
    error = e2;
  }
  if (error){
    alert('Krever write-policyer i Supabase. Feil: ' + error.message);
  } else {
    e.target.reset(); await renderPeople(); await populateSearchLists();
  }
}

// SKJEMA: legg til/oppdater vogn (krever write-policyer)
async function onUpsertCart(e){
  e.preventDefault();
  const code  = document.getElementById('c-code').value.trim();
  const type  = document.getElementById('c-type').value.trim();
  const cap   = parseInt(document.getElementById('c-cap').value || '0', 10);
  const area  = document.getElementById('c-area').value.trim();
  const desc  = document.getElementById('c-desc').value.trim();
  const active= parseInt(document.getElementById('c-active').value, 10);

  if (!code){ alert('Vognkode må fylles ut.'); return; }

  const { data: existing } = await supa.from('carts').select('*').eq('code', code).limit(1);
  let error;
  if (existing && existing.length){
    const { error: e1 } = await supa.from('carts').update({
      type, cap: (cap||null), area, description: desc, active
    }).eq('id', existing[0].id);
    error = e1;
  } else {
    const { error: e2 } = await supa.from('carts').insert({
      code, type, cap: (cap||null), area, description: desc, active
    });
    error = e2;
  }
  if (error){
    alert('Krever write-policyer i Supabase. Feil: ' + error.message);
  } else {
    e.target.reset(); await renderCarts(); await populateSearchLists();
  }
}

// ---------- Backup (kun eksport uten utvidede policyer) ----------
async function exportJson(){
  const [people, carts, transactions] = await Promise.all([getPeople(false), getCarts(false), getTx()]);
  const payload = { people, carts, transactions, exported_at: new Date().toISOString() };
  const json = JSON.stringify(payload, null, 2);
  document.getElementById('export-output').textContent = json;

  const blob = new Blob([json], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'vognlogg-backup.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
}

function importJson(e){
  const file = e.target.files?.[0];
  if (!file) return;
  alert('Import krever write-policyer på people/carts/transactions. Si ifra hvis du vil at jeg åpner policyene, så fungerer dette.');
  e.target.value = '';
}

function resetAllWarning(){
  alert('Reset av DB krever write/delete-policyer og/eller serverrolle. Anbefales ikke å kjøre fra åpen klient.');
}
