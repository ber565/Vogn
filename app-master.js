// app-master.js
const { supa } = window._vogn;

document.getElementById('person-form')?.addEventListener('submit', onUpsertPerson);
document.getElementById('cart-form')?.addEventListener('submit', onUpsertCart);

init();
async function init(){ await renderPeople(); await renderCarts(); }

async function renderPeople(){
  const { data } = await supa.from('people').select('*').order('name',{ascending:true});
  const people = data||[];
  let html = `<table><thead><tr><th>ID</th><th>Nummer</th><th>Navn</th><th>Avdeling</th><th>Aktiv</th><th></th></tr></thead><tbody>`;
  people.forEach(p=>{
    html += `<tr>
      <td>${p.id}</td><td>${p.number}</td><td>${p.name}</td><td>${p.dept||''}</td><td>${p.active?'Ja':'Nei'}</td>
      <td><button class="btn-secondary" onclick="deletePerson(${p.id})">Slett</button></td>
    </tr>`;
  });
  document.getElementById('people-table').innerHTML = html + '</tbody></table>';
}

async function renderCarts(){
  const { data } = await supa.from('carts').select('*').order('code',{ascending:true});
  const carts = data||[];
  let html = `<table><thead><tr><th>ID</th><th>Code</th><th>Type</th><th>Kapasitet</th><th>Område</th><th>Beskrivelse</th><th>Aktiv</th><th></th></tr></thead><tbody>`;
  carts.forEach(c=>{
    html += `<tr>
      <td>${c.id}</td><td>${c.code}</td><td>${c.type||''}</td><td>${c.cap||''}</td><td>${c.area||''}</td><td>${c.description||''}</td><td>${c.active?'Ja':'Nei'}</td>
      <td><button class="btn-secondary" onclick="deleteCart(${c.id})">Slett</button></td>
    </tr>`;
  });
  document.getElementById('carts-table').innerHTML = html + '</tbody></table>';
}

async function onUpsertPerson(e){
  e.preventDefault();
  const number=parseInt(document.getElementById('p-number').value,10);
  const name  =document.getElementById('p-name').value.trim();
  const dept  =document.getElementById('p-dept').value.trim();
  const active=parseInt(document.getElementById('p-active').value,10);
  if(!number||!name){ alert('Nummer og navn må fylles ut.'); return; }
  const { data: existing } = await supa.from('people').select('*').eq('number', number).limit(1);
  let error;
  if(existing && existing.length){ const { error: e1 } = await supa.from('people').update({ name, dept, active }).eq('id', existing[0].id); error=e1; }
  else { const { error: e2 } = await supa.from('people').insert({ number, name, dept, active }); error=e2; }
  if(error){ alert('Feil: '+error.message); } else { e.target.reset(); await renderPeople(); }
}

async function onUpsertCart(e){
  e.preventDefault();
  const code=document.getElementById('c-code').value.trim();
  const type=document.getElementById('c-type').value.trim();
  const cap =parseInt(document.getElementById('c-cap').value||'0',10);
  const area=document.getElementById('c-area').value.trim();
  const desc=document.getElementById('c-desc').value.trim();
  const active=parseInt(document.getElementById('c-active').value,10);
  if(!code){ alert('Vognkode må fylles ut.'); return; }
  const { data: existing } = await supa.from('carts').select('*').eq('code', code).limit(1);
  let error;
  if(existing && existing.length){ const { error: e1 } = await supa.from('carts').update({ type, cap:(cap||null), area, description:desc, active }).eq('id', existing[0].id); error=e1; }
  else { const { error: e2 } = await supa.from('carts').insert({ code, type, cap:(cap||null), area, description:desc, active }); error=e2; }
  if(error){ alert('Feil: '+error.message); } else { e.target.reset(); await renderCarts(); }
}

window.deletePerson = async (id)=>{
  if(!confirm('Slette person? Dette kan ikke angres.')) return;
  const { error } = await supa.from('people').delete().eq('id', id);
  if(error){ alert('Feil ved sletting: '+error.message); return; }
  await renderPeople();
};
window.deleteCart = async (id)=>{
  if(!confirm('Slette vogn? Dette kan ikke angres.')) return;
  const { error } = await supa.from('carts').delete().eq('id', id);
  if(error){ alert('Feil ved sletting: '+error.message); return; }
  await renderCarts();
};
