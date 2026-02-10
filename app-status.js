// app-status.js
const { getCarts, getTx, getPeople, isoLocal, byId } = window._vogn;
init();
async function init(){
  await renderStatus();
  window._vogn.supa.channel('public:transactions')
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'transactions'},()=>renderStatus())
    .subscribe();
}
async function renderStatus(){
  try{
    const [carts, tx, people] = await Promise.all([getCarts(true), getTx(), getPeople(true)]);
    let html = `<table><thead><tr>
      <th>Vogn</th><th>Type</th><th>Kapasitet</th><th>Område</th>
      <th>Tilgjengelig?</th><th>Hos</th><th>Sist</th><th>Handling</th>
    </tr></thead><tbody>`;
    function last(id){ return tx.filter(t=>t.cart_id===id).sort((a,b)=> a.event_at<b.event_at?1:-1)[0]; }
    carts.forEach(c=>{
      const l=last(c.id); const free=!l || l.action==='IN';
      const who = !free && l ? (byId(people,String(l.person_id))?.name || '') : '';
      html += `<tr>
        <td>${c.code}</td><td>${c.type||''}</td><td>${c.cap? c.cap+' kg':''}</td><td>${c.area||''}</td>
        <td class="${free?'tag-yes':'tag-no'}">${free?'Ja':'Nei'}</td>
        <td>${who}</td><td>${l? isoLocal(l.event_at):''}</td><td>${l? (l.action==='OUT'?'Tar ut':'Leverer inn'):''}</td>
      </tr>`;
    });
    document.getElementById('status-table').innerHTML = html + '</tbody></table>';
  }catch(e){ document.getElementById('status-table').innerHTML = 'Kunne ikke hente status.'; }
}
