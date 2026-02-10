// app-core.js
const SUPABASE_URL = window.__SUPA_URL__;
const SUPABASE_ANON_KEY = window.__SUPA_KEY__;
let supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function nowDate(){ return new Date().toISOString().slice(0,10); }
function nowTime(){ return new Date().toTimeString().slice(0,5); }
function isoLocal(dt){ try{ return new Date(dt).toISOString().slice(0,16).replace('T',' ');}catch{return '';} }
function byId(list, id){ return list.find(x => String(x.id) === String(id)); }
function showAlert(elId, html, isErr=false){ const el=document.getElementById(elId); if(!el) return; el.innerHTML=`<div class="alert ${isErr?'alert-error':'alert-ok'}">${html}</div>`; setTimeout(()=>el.innerHTML='',3000); }

async function getPeople(activeOnly=true){
  const q = supa.from('people').select('*').order('name',{ascending:true});
  const { data, error } = activeOnly ? await q.eq('active',1) : await q;
  if (error) throw error; return data||[];
}
async function getCarts(activeOnly=true){
  const q = supa.from('carts').select('*').order('code',{ascending:true});
  const { data, error } = activeOnly ? await q.eq('active',1) : await q;
  if (error) throw error; return data||[];
}
async function getTx(){
  const { data, error } = await supa.from('transactions').select('*').order('event_at',{ascending:false});
  if (error) throw error; return data||[];
}
async function addTx(row){ const { error } = await supa.from('transactions').insert(row); if(error) throw error; }

window._vogn = { supa, nowDate, nowTime, isoLocal, byId, showAlert, getPeople, getCarts, getTx, addTx };
