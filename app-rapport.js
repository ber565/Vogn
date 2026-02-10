// app-rapport.js
const { getTx, getPeople, getCarts, isoLocal, byId } = window._vogn;
document.getElementById('apply-filter')?.addEventListener('click', renderReport);
document.getElementById('export-csv')?.addEventListener('click', exportCsv);
init();
async function init(){ await populateReportFilters(); await renderReport(); }
async function populateReportFilters(){
  const [people, carts] = await Promise.all([getPeople(true), getCarts(true)]);
  document.getElementById('filter-person').innerHTML = '<option value="0">Alle</option>' + people.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
  document.getElementById('filter-cart').innerHTML = '<option value="0">Alle</option>' + carts.map(c=>`<option value="${c.id}">${c.code}</option>`).join('');
}
async function renderReport(){
  try{
    const [tx, people, carts] = await Promise.all([getTx(), getPeople(false), getCarts(false)]);
    const from=document.getElementById('from').value; const to=document.getElementById('to').value;
    const pid=parseInt(document.getElementById('filter-person').value||'0',10);
    const cid=parseInt(document.getElementById('filter-cart').value||'0',10);
    const depF=(document.getElementById('filter-dept').value||'').toLowerCase();
    const prjF=(document.getElementById('filter-project').value||'').toLowerCase();
    let rows=tx.slice();
    if(from) rows=rows.filter(r=> String(r.event_at) >= `${from}T00:00:00`);
    if(to)   rows=rows.filter(r=> String(r.event_at) <= `${to}T23:59:59`);
    if(pid)  rows=rows.filter(r=> Number(r.person_id)===pid);
    if(cid)  rows=rows.filter(r=> Number(r.cart_id)===cid);
    if(depF) rows=rows.filter(r=> (r.dept||'').toLowerCase().includes(depF));
    if(prjF) rows=rows.filter(r=> (r.project||'').toLowerCase().includes(prjF));
    let html = `<table><thead><tr>
      <th>Tid</th><th>Handling</th><th>Person</th><th>Avd</th><th>Celle</th>
      <th>Vogn</th><th>Type</th><th>Cap</th><th>Område</th><th>Note</th>
    </tr></thead><tbody>`;
    rows.forEach(r=>{
      const p=byId(people,String(r.person_id)); const c=byId(carts,String(r.cart_id));
      html += `<tr>
        <td>${isoLocal(r.event_at)}</td><td>${r.action==='OUT'?'Tar ut':'Leverer inn'}</td>
        <td>${p?.name||''} (${p?.number||''})</td><td>${r.dept||p?.dept||''}</td><td>${r.project||''}</td>
        <td>${c?.code||''}</td><td>${c?.type||''}</td><td>${c?.cap||''}</td><td>${c?.area||''}</td>
        <td>${r.note||''}</td>
      </tr>`;
    });
    document.getElementById('report-table').innerHTML = html + '</tbody></table>';
  }catch(e){ document.getElementById('report-table').innerHTML='Kunne ikke generere rapport.'; }
}
async function exportCsv(){
  const [tx, people, carts] = await Promise.all([getTx(), getPeople(false), getCarts(false)]);
  const header=['Event_at','Action','Person','Number','Dept','Project','Cart','Type','Capacity','Area','Note'];
  const rows=[header];
  tx.forEach(r=>{ const p=byId(people,String(r.person_id)); const c=byId(carts,String(r.cart_id)); rows.push([
    new Date(r.event_at).toISOString(), r.action, p?.name||'', p?.number||'', r.dept||p?.dept||'', r.project||'', c?.code||'', c?.type||'', c?.cap||'', c?.area||'', (r.note||'').replace(/?
/g,' ')
  ]); });
  const csv = rows.map(arr=>arr.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('
');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='rapport.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),500);
}
