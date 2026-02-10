// app-registrering.js
const { getPeople, getCarts, getTx, addTx, nowDate, nowTime, showAlert } = window._vogn;
let _peopleCache = [];
let _cartsCache  = [];

document.getElementById('fill-now')?.addEventListener('click', () => {
  document.getElementById('date').value = nowDate();
  document.getElementById('time').value = nowTime();
});
document.getElementById('reg-form')?.addEventListener('submit', onRegister);

init();

async function init(){ await populateRegForm(); }

async function populateRegForm(){
  _peopleCache = await getPeople(true);
  _cartsCache  = await getCarts(true);
  const peopleList = document.getElementById('peopleList');
  const cartsList  = document.getElementById('cartsList');
  peopleList.innerHTML = _peopleCache.map(p => `<option value="${p.name} (${p.number})${p.dept?' – '+p.dept:''}"></option>`).join('');
  cartsList.innerHTML = _cartsCache.map(c => `<option value="${c.code}${c.type?' – '+c.type:''}${c.cap?' · '+c.cap+' kg':''}${c.area?' · '+c.area:''}"></option>`).join('');

  const personInput = document.getElementById('person_search');
  const cartInput   = document.getElementById('cart_search');
  const personSel   = document.getElementById('person_id');
  const cartSel     = document.getElementById('cart_id');

  function resolvePersonId(text){
    if(!text) return '';
    const num = text.match(/\((\d+)\)/)?.[1];
    if(num){ const byNum = _peopleCache.find(p=>String(p.number)===String(num)); if(byNum) return byNum.id; }
    const lower=text.toLowerCase();
    const any=_peopleCache.find(p=>p.name.toLowerCase().includes(lower));
    return any?.id || '';
  }
  function resolveCartId(text){
    if(!text) return '';
    const code=text.split(' ')[0].trim();
    const byCode=_cartsCache.find(c=>c.code.toLowerCase()===code.toLowerCase());
    if(byCode) return byCode.id;
    const lower=text.toLowerCase();
    const any=_cartsCache.find(c=>c.code.toLowerCase().includes(lower));
    return any?.id || '';
  }

  personInput.addEventListener('input', ()=>{ personSel.innerHTML=''; const id=resolvePersonId(personInput.value); if(id) personSel.innerHTML=`<option value="${id}" selected></option>`; });
  cartInput.addEventListener('input', ()=>{ cartSel.innerHTML=''; const id=resolveCartId(cartInput.value); if(id) cartSel.innerHTML=`<option value="${id}" selected></option>`; });

  const autoNow = document.getElementById('autoNow');
  if(!autoNow.checked){
    document.getElementById('date').value = nowDate();
    document.getElementById('time').value = nowTime();
  }
}

async function onRegister(e){
  e.preventDefault();
  const alertId='reg-alert';
  const person_id_val = parseInt(document.getElementById('person_id').value||'0',10);
  const cart_id_val   = parseInt(document.getElementById('cart_id').value||'0',10);
  const action        = document.getElementById('action').value;
  const auto          = document.getElementById('autoNow').checked;
  let dateVal = document.getElementById('date').value;
  let timeVal = document.getElementById('time').value;
  const dept    = document.getElementById('dept').value.trim();
  const project = document.getElementById('project').value.trim();
  const note    = document.getElementById('note').value.trim();

  const errs=[];
  if(!person_id_val) errs.push('Velg person – skriv/søk og velg et forslag.');
  if(!cart_id_val)   errs.push('Velg vogn – skriv/søk og velg et forslag.');
  if(!action)        errs.push('Velg handling.');
  if(auto){ dateVal = nowDate(); timeVal = nowTime(); }
  if(!dateVal || !timeVal) errs.push('Dato og klokkeslett må fylles ut.');

  try{
    const tx = await getTx();
    const last = tx.filter(t=>t.cart_id===cart_id_val).sort((a,b)=> a.event_at<b.event_at?1:-1)[0];
    const free = !last || last.action==='IN';
    if(action==='OUT' && !free) errs.push('Vognen er allerede ute.');
    if(action==='IN'  && free)  errs.push('Vognen er ikke registrert ute.');
  }catch{ errs.push('Kunne ikke sjekke vognstatus.'); }

  if(errs.length){ showAlert(alertId, `<ul>${errs.map(x=>`<li>${x}</li>`).join('')}</ul>`, true); return; }

  const event_at = new Date(`${dateVal}T${timeVal}:00`);
  try{
    await addTx({ person_id:person_id_val, cart_id:cart_id_val, action, event_at, note, dept, project });
    showAlert(alertId, 'Hendelsen ble registrert ✅');
    document.getElementById('note').value='';
    document.getElementById('project').value='';
    await populateRegForm();
  }catch(err){ showAlert(alertId, `Feil ved lagring: ${err.message}`, true); }
}
