// app-search-supabase.js – Supabase-versjon av vognlogg
// Importer Supabase-klienten
import { supabase } from './supabase.js';

// Korte hjelpere
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  people: [],
  carts: [],
};

// Tidshjelpere
function nowDate(){ const d=new Date(); return d.toISOString().slice(0,10); }
function nowTime(){ const d=new Date(); return d.toTimeString().slice(0,5); }

// ---- Datatilgang (Supabase) ----
async function dbLoadPeople(){
  const { data, error } = await supabase.from('people').select('*').order('name', { ascending: true });
  if (error) { console.error(error); return []; }
  return data || [];
}
async function dbLoadCarts(){
  const { data, error } = await supabase.from('carts').select('*').order('code', { ascending: true });
  if (error) { console.error(error); return []; }
  return data || [];
}
async function dbLoadTransactionsFiltered({ from, to, person, cart, dept, project }){
  let q = supabase.from('transactions').select('*').order('event_at', { ascending:false }).order('id', { ascending:false });
  if (from) q = q.gte('event_at', `${from} 00:00:00`);
  if (to)   q = q.lte('event_at', `${to} 23:59:59`);
  if (person) q = q.eq('person_id', person);
  if (cart)   q = q.eq('cart_id', cart);
  if (dept)   q = q.ilike('dept', `%${dept}%`);
  if (project)q = q.ilike('project', `%${project}%`);
  const { data, error } = await q;
  if (error) { console.error(error); return []; }
  return data || [];
}
async function dbLastTxForAllCarts(){
  // Hent alle transaksjoner sortert slik at første per cart_id er "siste"
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('cart_id', { ascending:true })
    .order('event_at', { ascending:false })
    .order('id', { ascending:false });
  if (error) { console.error(error); return new Map(); }
  const map = new Map();
  for (const r of (data||[])) {
    if (!map.has(r.cart_id)) map.set(r.cart_id, r);
  }
  return map;
}
async function dbLastTxForCart(cartId){
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('cart_id', cartId)
    .order('event_at', { ascending:false })
    .order('id', { ascending:false })
    .limit(1);
  if (error) { console.error(error); return null; }
  return (data && data[0]) || null;
}

async function dbInsertOrUpdatePerson({ number, name, dept, active }){
  // Finn etter number
  const { data: existing, error: selErr } = await supabase.from('people').select('*').eq('number', number).limit(1);
  if (selErr) throw selErr;
  if (existing && existing.length) {
    const id = existing[0].id;
    const { error } = await supabase.from('people').update({ name, dept, active }).eq('id', id);
    if (error) throw error; return id;
  } else {
    const { data, error } = await supabase.from('people').insert([{ number, name, dept, active }]).select().single();
    if (error) throw error; return data.id;
  }
}
async function dbDeletePerson(id){
  const { error } = await supabase.from('people').delete().eq('id', id);
  if (error) throw error;
}

async function dbInsertOrUpdateCart({ code, type, cap, area, desc, active }){
  const { data: existing, error: selErr } = await supabase.from('carts').select('*').eq('code', code).limit(1);
  if (selErr) throw selErr;
  if (existing && existing.length) {
    const id = existing[0].id;
    const { error } = await supabase.from('carts').update({ type, cap, area, desc, active }).eq('id', id);
    if (error) throw error; return id;
  } else {
    const { data, error } = await supabase.from('carts').insert([{ code, type, cap: (cap||0), area, desc, active }]).select().single();
    if (error) throw error; return data.id;
  }
}
async function dbDeleteCart(id){
  const { error } = await supabase.from('carts').delete().eq('id', id);
  if (error) throw error;
}

async function dbInsertTransaction(row){
  const { data, error } = await supabase.from('transactions').insert([row]).select().single();
  if (error) throw error; return data;
}

async function dbExportAll(){
  const [{ data: people }, { data: carts }, { data: transactions }] = await Promise.all([
    supabase.from('people').select('*'),
    supabase.from('carts').select('*'),
    supabase.from('transactions').select('*'),
  ]);
  return { people: people||[], carts: carts||[], transactions: transactions||[], exported_at: new Date().toISOString() };
}

async function dbImportAll(payload){
  // Upsert på primærnøkkel 'id' slik at referanser består
  const up1 = await supabase.from('people').upsert(payload.people || [], { onConflict: 'id' }); if (up1.error) throw up1.error;
  const up2 = await supabase.from('carts').upsert(payload.carts || [], { onConflict: 'id' });  if (up2.error) throw up2.error;
  const up3 = await supabase.from('transactions').upsert(payload.transactions || [], { onConflict: 'id' }); if (up3.error) throw up3.error;
}

async function dbResetAll(){
  // Slett i riktig rekkefølge
  const t = await supabase.from('transactions').delete().neq('id', 0); if (t.error) throw t.error;
  const p = await supabase.from('people').delete().neq('id', 0);       if (p.error) throw p.error;
  const c = await supabase.from('carts').delete().neq('id', 0);        if (c.error) throw c.error;
}

// ---- App-logikk (UI) ----
function updateActiveTab(){
  const h = (location.hash || '#registrering').replace('#','');
  $$('.tabbar a').forEach(a=> a.classList.toggle('active', a.getAttribute('href') === '#'+h));
  if (h==='registrering') populateRegForm();
  else if (h==='status') renderStatus();
  else if (h==='rapport'){ populateReportFilters(); renderReport(); }
  else if (h==='master'){ renderPeople(); renderCarts(); }
}

function wireSearchToSelect(){
  const personSearch = $('#person_search'); const cartSearch = $('#cart_search');
  const personSel = $('#person_id'); const cartSel = $('#cart_id');
  personSearch.addEventListener('input', ()=>{
    const match = Array.from($('#peopleList').options).find(o=> o.value === personSearch.value);
    personSel.innerHTML = ''; if (match){ personSel.innerHTML = `<option value="${match.dataset.id}" selected></option>`; }
  });
  cartSearch.addEventListener('input', ()=>{
    const match = Array.from($('#cartsList').options).find(o=> o.value === cartSearch.value);
    cartSel.innerHTML = ''; if (match){ cartSel.innerHTML = `<option value="${match.dataset.id}" selected></option>`; }
  });
}

async function populateSearchLists(){
  state.people = await dbLoadPeople();
  state.carts  = await dbLoadCarts();
  const peopleList = $('#peopleList'); const cartsList = $('#cartsList');
  peopleList.innerHTML = state.people.filter(p=>p.active===1).map(p=>`<option data-id="${p.id}" value="${p.name} (${p.number})${p.dept? ' – '+p.dept:''}"></option>`).join('');
  // Vi merker [UTE] basert på siste transaksjon på status-siden for presisjon, her viser vi bare liste
  cartsList.innerHTML = state.carts.filter(c=>c.active===1).map(c=>`<option data-id="${c.id}" value="${c.code} — ${c.type||''}${c.cap? ' · '+c.cap+' kg':''}${c.area? ' · '+c.area:''}"></option>`).join('');
}

function personById(id){ return state.people.find(p=>p.id===id); }
function cartById(id){ return state.carts.find(c=>c.id===id); }

async function populateRegForm(){
  await populateSearchLists(); wireSearchToSelect();
  const autoNow = $('#autoNow'); if (!autoNow.checked){ $('#date').value = nowDate(); $('#time').value = nowTime(); }
}

function attachRegHandlers(){
  $('#fill-now').addEventListener('click', ()=>{ $('#date').value = nowDate(); $('#time').value = nowTime(); });
  $('#reg-form').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const regAlert = $('#reg-alert'); regAlert.innerHTML = '';
    const person_id = parseInt($('#person_id').value || '0',10);
    const cart_id   = parseInt($('#cart_id').value   || '0',10);
    const action    = $('#action').value;
    const autoNow   = $('#autoNow').checked;
    let date = $('#date').value; let time = $('#time').value;
    const note = $('#note').value || '';
    const dept = $('#dept').value || '';
    const project = $('#project').value || '';

    const errs = [];
    if (!person_id) errs.push('Velg person – skriv/søk og velg et forslag.');
    if (!cart_id)   errs.push('Velg vogn – skriv/søk og velg et forslag.');
    if (!action)    errs.push('Velg handling.');
    if (autoNow){ date = nowDate(); time = nowTime(); }
    if (!date || !time) errs.push('Dato og klokkeslett må fylles ut.');

    // Valider tilgjengelighet mot siste transaksjon i DB
    if (cart_id && action){
      const last = await dbLastTxForCart(cart_id);
      const available = !last || last.action === 'IN';
      if (action==='OUT' && !available) errs.push('Vognen er allerede ute.');
      if (action==='IN'  &&  available) errs.push('Vognen er ikke registrert ute.');
    }

    if (errs.length){ regAlert.innerHTML = `<div class="alert alert-error"><ul>${errs.map(e=>`<li>${e}</li>`).join('')}</ul></div>`; return; }

    const event_at = `${date} ${time}:00`;
    const personDept = personById(person_id)?.dept || '';
    try{
      await dbInsertTransaction({ person_id, cart_id, action, event_at, note, dept: (dept||personDept||''), project });
      regAlert.innerHTML = '<div class="alert alert-ok">Hendelsen ble registrert.</div>';
      $('#note').value = ''; $('#project').value = '';
      await populateRegForm(); await renderStatus(); await renderReport();
    } catch(err){
      console.error(err);
      regAlert.innerHTML = `<div class="alert alert-error">Kunne ikke lagre: ${err.message}</div>`;
    }
  });
}

async function renderStatus(){
  const container = $('#status-table');
  const carts = (await dbLoadCarts()).filter(c=>c.active===1);
  const lastMap = await dbLastTxForAllCarts();
  let html = `<table class="table"><thead><tr>
    <th>Vogn</th><th>Type</th><th>Kapasitet</th><th>Område</th><th>Tilgjengelig?</th><th>Hos</th><th>Sist bevegelse</th><th>Siste handling</th>
  </tr></thead><tbody>`;
  for (const c of carts){
    const last = lastMap.get(c.id) || null;
    const available = !last || last.action === 'IN';
    const who = (!available && last) ? (personById(last.person_id)?.name || '') : '';
    const when = last ? String(last.event_at).slice(0,16) : '';
    const act  = last ? (last.action==='OUT' ? 'Tar ut' : 'Leverer inn') : '';
    html += `<tr>
      <td>${c.code}</td><td>${c.type||''}</td><td>${c.cap? c.cap+' kg':''}</td><td>${c.area||''}</td>
      <td class="${available?'tag-yes':'tag-no'}">${available?'Ja':'Nei'}</td>
      <td>${who}</td><td>${when}</td><td>${act}</td>
    </tr>`;
  }
  html += `</tbody></table>`;
  container.innerHTML = html;
}

async function populateReportFilters(){
  const people = await dbLoadPeople();
  const carts  = await dbLoadCarts();
  $('#filter-person').innerHTML = '<option value="0">Alle</option>' + people.filter(p=>p.active===1).map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
  $('#filter-cart').innerHTML   = '<option value="0">Alle</option>' + carts.filter(c=>c.active===1).map(c=>`<option value="${c.id}">${c.code}</option>`).join('');
}

async function renderReport(){
  const from = $('#from').value; const to = $('#to').value;
  const person = parseInt($('#filter-person').value || '0',10);
  const cart   = parseInt($('#filter-cart').value || '0',10);
  const dept   = ($('#filter-dept').value||'').toLowerCase();
  const proj   = ($('#filter-project').value||'').toLowerCase();
  const rows = await dbLoadTransactionsFiltered({ from, to, person, cart, dept, project: proj });
  let html = `<table class="table"><thead><tr>
    <th>Dato/klokkeslett</th><th>Handling</th><th>Person</th><th>Avdeling</th><th>Prosjekt/ordre</th>
    <th>Vogn</th><th>Type</th><th>Kapasitet</th><th>Område</th><th>Bemerkning</th>
  </tr></thead><tbody>`;
  for (const r of rows){
    const p = personById(r.person_id); const c = cartById(r.cart_id);
    html += `<tr>
      <td>${String(r.event_at).slice(0,16)}</td>
      <td>${r.action==='OUT'?'Tar ut':'Leverer inn'}</td>
      <td>${(p?.name||'')} (${p?.number||''})</td>
      <td>${r.dept || p?.dept || ''}</td>
      <td>${r.project || ''}</td>
      <td>${c?.code || ''}</td>
      <td>${c?.type || ''}</td>
      <td>${c?.cap? c.cap+' kg':''}</td>
      <td>${c?.area || ''}</td>
      <td>${r.note || ''}</td>
    </tr>`;
  }
  html += `</tbody></table>`;
  $('#report-table').innerHTML = html;
}

async function renderPeople(){
  const people = await dbLoadPeople();
  let html = `<table class="table"><thead><tr>
    <th>ID</th><th>Nummer</th><th>Navn</th><th>Avdeling</th><th>Aktiv</th><th></th>
  </tr></thead><tbody>`;
  for (const p of people){
    html += `<tr>
      <td>${p.id}</td><td>${p.number}</td><td>${p.name}</td><td>${p.dept||''}</td><td>${p.active?'Ja':'Nei'}</td>
      <td><button class="btn-secondary" data-del-person="${p.id}">Slett</button></td>
    </tr>`;
  }
  html += `</tbody></table>`;
  $('#people-table').innerHTML = html;
  $$('#people-table [data-del-person]').forEach(btn=> btn.addEventListener('click', async (ev)=>{
    const id = parseInt(ev.currentTarget.getAttribute('data-del-person'),10);
    if (!confirm('Slette person? Dette vil ikke slette historikk.')) return;
    try { await dbDeletePerson(id); await renderPeople(); await populateSearchLists(); await populateReportFilters(); await renderReport(); }
    catch(err){ alert('Kunne ikke slette: '+err.message); }
  }));
}

function attachPersonHandlers(){
  $('#person-form').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const number = parseInt($('#p-number').value,10);
    const name = $('#p-name').value.trim();
    const dept = $('#p-dept').value.trim();
    const active = parseInt($('#p-active').value,10);
    if (!number || !name) return;
    try{
      await dbInsertOrUpdatePerson({ number, name, dept, active });
      e.target.reset(); await renderPeople(); await populateSearchLists(); await populateReportFilters(); await renderReport();
    }catch(err){ alert('Kunne ikke lagre person: '+err.message); }
  });
}

async function renderCarts(){
  const carts = await dbLoadCarts();
  let html = `<table class="table"><thead><tr>
    <th>ID</th><th>Code</th><th>Type</th><th>Kapasitet</th><th>Område</th><th>Beskrivelse</th><th>Aktiv</th><th></th>
  </tr></thead><tbody>`;
  for (const c of carts){
    html += `<tr>
      <td>${c.id}</td><td>${c.code}</td><td>${c.type||''}</td><td>${c.cap? c.cap+' kg':''}</td>
      <td>${c.area||''}</td><td>${c.desc||''}</td><td>${c.active?'Ja':'Nei'}</td>
      <td><button class="btn-secondary" data-del-cart="${c.id}">Slett</button></td>
    </tr>`;
  }
  html += `</tbody></table>`;
  $('#carts-table').innerHTML = html;
  $$('#carts-table [data-del-cart]').forEach(btn=> btn.addEventListener('click', async (ev)=>{
    const id = parseInt(ev.currentTarget.getAttribute('data-del-cart'),10);
    if (!confirm('Slette vogn? Dette vil ikke slette historikk.')) return;
    try { await dbDeleteCart(id); await renderCarts(); await populateSearchLists(); await populateReportFilters(); await renderStatus(); await renderReport(); }
    catch(err){ alert('Kunne ikke slette: '+err.message); }
  }));
}

function attachCartHandlers(){
  $('#cart-form').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const code = $('#c-code').value.trim();
    const type = $('#c-type').value.trim();
    const cap = parseInt($('#c-cap').value || '0',10);
    const area = $('#c-area').value.trim();
    const desc = $('#c-desc').value.trim();
    const active= parseInt($('#c-active').value,10);
    if (!code) return;
    try{
      await dbInsertOrUpdateCart({ code, type, cap, area, desc, active });
      e.target.reset(); await renderCarts(); await populateSearchLists(); await populateReportFilters(); await renderStatus(); await renderReport();
    }catch(err){ alert('Kunne ikke lagre vogn: '+err.message); }
  });
}

function attachBackupHandlers(){
  $('#export-json').addEventListener('click', async ()=>{
    try{
      const payload = await dbExportAll();
      const json = JSON.stringify(payload, null, 2);
      $('#export-output').textContent = json;
      const blob=new Blob([json],{type:'application/json'}); const url=URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download='vognlogg-backup.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),500);
    }catch(err){ alert('Kunne ikke eksportere: '+err.message); }
  });

  $('#import-file').addEventListener('change', async (e)=>{
    const f=e.target.files[0]; if(!f) return; const text=await f.text();
    try{ const payload=JSON.parse(text);
      if(payload.people && payload.carts && payload.transactions){
        await dbImportAll(payload);
        alert('Import fullført.');
        await populateSearchLists(); await populateRegForm(); await renderStatus(); await populateReportFilters(); await renderReport(); await renderPeople(); await renderCarts();
        $('#export-output').textContent = '';
      } else { alert('Ugyldig fil.'); }
    } catch(err){ alert('Kunne ikke lese/lagre JSON: '+err.message); }
    e.target.value='';
  });

  $('#reset-all').addEventListener('click', async ()=>{
    if (!confirm('Er du sikker? Dette sletter ALLE data i databasen (people, carts, transactions).')) return;
    try{ await dbResetAll(); alert('Data nullstilt.'); location.reload(); }
    catch(err){ alert('Kunne ikke nullstille: '+err.message); }
  });
}

// CSV-eksport fra rapportbordet (front-end)
$('#export-csv')?.addEventListener('click', ()=>{
  const table = $('#report-table table'); if (!table) return;
  const rows = Array.from(table.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(td => '"'+String(td.textContent).replaceAll('"','""')+'"').join(','));
  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'vognlogg-rapport.csv');
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
});

// Init
document.addEventListener('DOMContentLoaded', async ()=>{
  attachRegHandlers(); attachBackupHandlers(); attachPersonHandlers(); attachCartHandlers();
  window.addEventListener('hashchange', updateActiveTab);
  await populateSearchLists();
  updateActiveTab();
});
