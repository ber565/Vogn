
// app-core.js
const SUPABASE_URL = "https://kvectvrdtutardpknzkk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1fpq0aGzpS44ez1UJ5Vkvg_-bl-LWxy";
let supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
async function getPeople(){ let {data}=await supa.from('people').select('*'); return data||[] }
async function getCarts(){ let {data}=await supa.from('carts').select('*'); return data||[] }
async function getTx(){ let {data}=await supa.from('transactions').select('*'); return data||[] }
async function addTx(r){ await supa.from('transactions').insert(r) }
window._vogn = {supa,getPeople,getCarts,getTx,addTx};
