// Vognlogg – hash-basert fanestyring (ekstern JS)
(function(){
  const KEYS = { PEOPLE:'vognlogg_people', CARTS:'vognlogg_carts', TX:'vognlogg_transactions' };
  const $ = (sel)=> document.querySelector(sel);
  const $$ = (sel)=> Array.from(document.querySelectorAll(sel));
  function load(k){ try{return JSON.parse(localStorage.getItem(k))||[]}catch(e){return[]} }
  function save(k,d){ localStorage.setItem(k, JSON.stringify(d)); }
  function nowDate(){ const d=new Date(); return d.toISOString().slice(0,10); }
  function nowTime(){ const d=new Date(); return d.toTimeString().slice(0,5); }

  // Bootstrap data (once)
  function bootstrap(){
    if (!localStorage.getItem(KEYS.PEOPLE)){
      const people = [
      {id:1, number:6700281, name:'Navn 1', dept:'', active:1},
      {id:2, number:535395, name:'Navn 2', dept:'', active:1},
      {id:3, number:6700166, name:'Navn 3', dept:'', active:1},
      {id:4, number:6700277, name:'Navn 4', dept:'', active:1},
      {id:5, number:528731, name:'Navn 5', dept:'', active:1},
      {id:6, number:6700293, name:'Navn 6', dept:'', active:1},
      {id:7, number:538945, name:'Navn 7', dept:'', active:1},
      {id:8, number:6700280, name:'Navn 8', dept:'', active:1},
      {id:9, number:528672, name:'Navn 9', dept:'', active:1},
      {id:10, number:6700214, name:'Navn 10', dept:'', active:1},
      {id:11, number:6700241, name:'Navn 11', dept:'', active:1},
      {id:12, number:6650965, name:'Navn 12', dept:'', active:1},
      {id:13, number:554615, name:'Navn 13', dept:'', active:1},
      {id:14, number:528691, name:'Navn 14', dept:'', active:1},
      {id:15, number:528693, name:'Navn 15', dept:'', active:1},
      {id:16, number:6700089, name:'Navn 16', dept:'', active:1},
      {id:17, number:528685, name:'Navn 17', dept:'', active:1},
      {id:18, number:6700330, name:'Navn 18', dept:'', active:1},
      {id:19, number:528631, name:'Navn 19', dept:'', active:1},
      {id:20, number:6700274, name:'Navn 20', dept:'', active:1},
      {id:21, number:6700137, name:'Navn 21', dept:'', active:1},
      {id:22, number:528632, name:'Navn 22', dept:'', active:1},
      {id:23, number:6700299, name:'Navn 23', dept:'', active:1},
      {id:24, number:528660, name:'Navn 24', dept:'', active:1},
      {id:25, number:528721, name:'Navn 25', dept:'', active:1},
      {id:26, number:528678, name:'Navn 26', dept:'', active:1},
      {id:27, number:6651083, name:'Navn 27', dept:'', active:1},
      {id:28, number:528706, name:'Navn 28', dept:'', active:1},
      {id:29, number:6700066, name:'Navn 29', dept:'', active:1},
      {id:30, number:6700129, name:'Navn 30', dept:'', active:1},
      {id:31, number:6638441, name:'Navn 31', dept:'', active:1},
      {id:32, number:6700175, name:'Navn 32', dept:'', active:1},
      {id:33, number:552648, name:'Navn 33', dept:'', active:1},
      {id:34, number:528638, name:'Navn 34', dept:'', active:1},
      {id:35, number:528709, name:'Navn 35', dept:'', active:1},
      {id:36, number:6700279, name:'Navn 36', dept:'', active:1},
      {id:37, number:563598, name:'Navn 37', dept:'', active:1},
      {id:38, number:528558, name:'Navn 38', dept:'', active:1},
      {id:39, number:544102, name:'Navn 39', dept:'', active:1},
      {id:40, number:6700170, name:'Navn 40', dept:'', active:1},
      {id:41, number:528668, name:'Navn 41', dept:'', active:1},
      {id:42, number:6700174, name:'Navn 42', dept:'', active:1},
      {id:43, number:529140, name:'Navn 43', dept:'', active:1},
      {id:44, number:528683, name:'Navn 44', dept:'', active:1},
      {id:45, number:557918, name:'Navn 45', dept:'', active:1},
      {id:46, number:6651973, name:'Navn 46', dept:'', active:1},
      {id:47, number:529059, name:'Navn 47', dept:'', active:1},
      {id:48, number:528705, name:'Navn 48', dept:'', active:1},
      {id:49, number:6700303, name:'Navn 49', dept:'', active:1},
      {id:50, number:528707, name:'Navn 50', dept:'', active:1},
      {id:51, number:6652083, name:'Navn 51', dept:'', active:1}
      ];
      save(KEYS.PEOPLE, people);
    }
    if (!localStorage.getItem(KEYS.CARTS)){
      const carts = [
      {id:1, code:'PV 1', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:2, code:'PV 2', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:3, code:'PV 3', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:4, code:'PV 4', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:5, code:'PV 5', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:6, code:'PV 6', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:7, code:'PV 7', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:8, code:'PV 8', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:9, code:'PV 9', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:10, code:'PV 10', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:11, code:'PV 11', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:12, code:'PV 12', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:13, code:'PV 13', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:14, code:'PV 14', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:15, code:'PV 15', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:16, code:'PV 16', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:17, code:'PV 17', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:18, code:'PV 18', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:19, code:'PV 19', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:20, code:'PV 20', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:21, code:'PV 21', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:22, code:'PV 22', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:23, code:'PV 23', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:24, code:'PV 24', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:25, code:'PV 25', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:26, code:'PV 26', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:27, code:'PV 27', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:28, code:'PV 28', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:29, code:'PV 29', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:30, code:'PV 30', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:31, code:'PV 31', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:32, code:'PV 32', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:33, code:'PV 33', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:34, code:'PV 34', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:35, code:'PV 35', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:36, code:'PV 36', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:37, code:'PV 37', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:38, code:'PV 38', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:39, code:'PV 39', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:40, code:'PV 40', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:41, code:'PV 41', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:42, code:'PV 42', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:43, code:'PV 43', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:44, code:'PV 44', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:45, code:'PV 45', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:46, code:'PV 46', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:47, code:'PV 47', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:48, code:'PV 48', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:49, code:'PV 49', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:50, code:'PV 50', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:51, code:'PV 51', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:52, code:'PV 52', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:53, code:'PV 53', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:54, code:'PV 54', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:55, code:'PV 55', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:56, code:'PV 56', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:57, code:'PV 57', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:58, code:'PV 58', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:59, code:'PV 59', type:'Tralle', cap:300, area:'', desc:'', active:1},
      {id:60, code:'PV 60', type:'Tralle', cap:300, area:'', desc:'', active:1}
      ];
      save(KEYS.CARTS, carts);
    }
    if (!localStorage.getItem(KEYS.TX)) save(KEYS.TX, []);
  }

  function nextId(list){ return (list.reduce((m,x)=>Math.max(m, x.id||0),0)+1); }
  function personById(id){ return load(KEYS.PEOPLE).find(p=>p.id===id); }
  function cartById(id){ return load(KEYS.CARTS).find(c=>c.id===id); }
  function lastActionForCart(cartId){ const tx=load(KEYS.TX).filter(t=>t.cart_id===cartId).sort((a,b)=> (a.event_at<b.event_at?1:(a.event_at>b.event_at?-1:b.id-a.id))); return tx[0]||null; }
  function cartIsAvailable(cartId){ const last=lastActionForCart(cartId); return !last || last.action==='IN'; }

  // Tabs: set active style based on hash
  function updateActiveTab(){
    const h = (location.hash||'#registrering').replace('#','');
    $$('.tabbar a').forEach(a=> a.classList.toggle('active', a.getAttribute('href') === '#'+h));
    // Trigger appropriate render
    if (h==='registrering') populateRegForm();
    else if (h==='status') renderStatus();
    else if (h==='rapport'){ populateReportFilters(); renderReport(); }
    else if (h==='master'){ renderPeople(); renderCarts(); }
    else if (h==='backup'){ /* nothing specific */ }
  }

  // REGISTRERING
  function populateRegForm(){
    const personSel = $('#person_id');
    const cartSel = $('#cart_id');
    const people = load(KEYS.PEOPLE).filter(p=>p.active===1).sort((a,b)=> a.name.localeCompare(b.name));
    const carts = load(KEYS.CARTS).filter(c=>c.active===1).sort((a,b)=> a.code.localeCompare(b.code));
    personSel.innerHTML = '<option value="">Velg person</option>' + people.map(p=>`<option value="${p.id}">${p.name} (${p.number})${p.dept? ' – '+p.dept: ''}</option>`).join('');
    cartSel.innerHTML = '<option value="">Velg vogn</option>' + carts.map(c=>{
      const avail = cartIsAvailable(c.id);
      const label = `${c.code} — ${c.type||'Ukjent type'}${c.cap? ' · '+c.cap+' kg':''}${c.area? ' · '+c.area:''}`;
      return `<option value="${c.id}">${label}${avail?'':' [UTE]'}</option>`;
    }).join('');
    const autoNow = $('#autoNow');
    if (!autoNow.checked){ $('#date').value = nowDate(); $('#time').value = nowTime(); }
  }

  function attachRegHandlers(){
    $('#fill-now').addEventListener('click', ()=>{ $('#date').value = nowDate(); $('#time').value = nowTime(); });
    $('#reg-form').addEventListener('submit', (e)=>{
      e.preventDefault();
      const regAlert = $('#reg-alert');
      regAlert.innerHTML = '';
      const person_id = parseInt($('#person_id').value||'0',10);
      const cart_id   = parseInt($('#cart_id').value||'0',10);
      const action    = $('#action').value;
      const autoNow   = $('#autoNow').checked;
      let date        = $('#date').value;
      let time        = $('#time').value;
      const note      = $('#note').value||'';
      const dept      = $('#dept').value||'';
      const project   = $('#project').value||'';
      const errs = [];
      if (!person_id) errs.push('Velg person.');
      if (!cart_id)   errs.push('Velg vogn.');
      if (!action)    errs.push('Velg handling.');
      if (autoNow){ date = nowDate(); time = nowTime(); }
      if (!date || !time) errs.push('Dato og klokkeslett må fylles ut.');
      if (cart_id && action){
        const available = cartIsAvailable(cart_id);
        if (action==='OUT' && !available) errs.push('Vognen er allerede ute. Kan ikke "Tar ut" igjen.');
        if (action==='IN'  && available)  errs.push('Vognen er ikke registrert ute. Kan ikke "Leverer inn".');
      }
      if (errs.length){
        regAlert.innerHTML = `<div class="alert alert-error"><ul>${errs.map(e=>`<li>${e}</li>`).join('')}</ul></div>`;
        return;
      }
      const tx = load(KEYS.TX);
      const id = nextId(tx);
      const event_at = `${date} ${time}:00`;
      const personDept = personById(person_id)?.dept || '';
      tx.push({ id, person_id, cart_id, action, event_at, note, dept: (dept||personDept||''), project });
      save(KEYS.TX, tx);
      regAlert.innerHTML = '<div class="alert alert-ok">Hendelsen ble registrert.</div>';
      $('#note').value = ''; $('#project').value = '';
      populateRegForm(); renderStatus(); renderReport();
    });
  }

  // STATUS
  function renderStatus(){
    const container = $('#status-table');
    const carts = load(KEYS.CARTS).filter(c=>c.active===1).sort((a,b)=> a.code.localeCompare(b.code));
    let html = `<table class="table"><thead><tr>
      <th>Vogn</th><th>Type</th><th>Kapasitet</th><th>Område</th><th>Tilgjengelig?</th><th>Hos</th><th>Sist bevegelse</th><th>Siste handling</th>
    </tr></thead><tbody>`;
    carts.forEach(c=>{
      const last = lastActionForCart(c.id);
      const available = cartIsAvailable(c.id);
      const who = (!available && last) ? (personById(last.person_id)?.name || '') : '';
      const when = last ? last.event_at.slice(0,16) : '';
      const act  = last ? (last.action==='OUT' ? 'Tar ut' : 'Leverer inn') : '';
      html += `<tr>
        <td>${c.code}</td><td>${c.type||''}</td><td>${c.cap? c.cap+' kg':''}</td><td>${c.area||''}</td>
        <td class="${available?'tag-yes':'tag-no'}">${available?'Ja':'Nei'}</td>
        <td>${who}</td><td>${when}</td><td>${act}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
  }

  // RAPPORT
  function populateReportFilters(){
    const people = load(KEYS.PEOPLE).filter(p=>p.active===1).sort((a,b)=> a.name.localeCompare(b.name));
    const carts  = load(KEYS.CARTS).filter(c=>c.active===1).sort((a,b)=> a.code.localeCompare(b.code));
    $('#filter-person').innerHTML = '<option value="0">Alle</option>' + people.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
    $('#filter-cart').innerHTML   = '<option value="0">Alle</option>' + carts.map(c=>`<option value="${c.id}">${c.code}</option>`).join('');
  }
  function renderReport(){
    const from   = $('#from').value;
    const to     = $('#to').value;
    const person = parseInt($('#filter-person').value||'0',10);
    const cart   = parseInt($('#filter-cart').value||'0',10);
    const dept   = ($('#filter-dept').value||'').toLowerCase();
    const proj   = ($('#filter-project').value||'').toLowerCase();
    let rows = load(KEYS.TX).slice().sort((a,b)=> (a.event_at<b.event_at?1:-1));
    if (from)  rows = rows.filter(r=> r.event_at >= `${from} 00:00:00`);
    if (to)    rows = rows.filter(r=> r.event_at <= `${to} 23:59:59`);
    if (person) rows = rows.filter(r=> r.person_id === person);
    if (cart)   rows = rows.filter(r=> r.cart_id   === cart);
    if (dept)   rows = rows.filter(r=> (r.dept||'').toLowerCase().includes(dept));
    if (proj)   rows = rows.filter(r=> (r.project||'').toLowerCase().includes(proj));
    let html = `<table class="table"><thead><tr>
      <th>Dato/klokkeslett</th><th>Handling</th><th>Person</th><th>Avdeling</th><th>Prosjekt/ordre</th>
      <th>Vogn</th><th>Type</th><th>Kapasitet</th><th>Område</th><th>Bemerkning</th>
    </tr></thead><tbody>`;
    rows.forEach(r=>{
      const p = personById(r.person_id); const c = cartById(r.cart_id);
      html += `<tr>
        <td>${r.event_at.slice(0,16)}</td>
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
    });
    html += `</tbody></table>`;
    $('#report-table').innerHTML = html;
  }
  function attachReportHandlers(){ $('#apply-filter').addEventListener('click', renderReport);
    $('#export-csv').addEventListener('click', ()=>{
      const tx = load(KEYS.TX).slice().sort((a,b)=> (a.event_at<b.event_at?1:-1));
      const header = ['Event_at','Action','Person','Number','Dept','Project','Cart','Type','Capacity','Area','Note'];
      const csvRows = [header];
      tx.forEach(r=>{
        const p = personById(r.person_id); const c = cartById(r.cart_id);
        csvRows.push([
          r.event_at, r.action, p?.name||'', p?.number||'', r.dept||p?.dept||'', r.project||'',
          c?.code||'', c?.type||'', c?.cap||'', c?.area||'', (r.note||'').replace(/\r?\n/g,' ')
        ]);
      });
      const csv = csvRows.map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], {type:'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'rapport.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),500);
    }); }

  // MASTERLISTER – PERSONER
  function renderPeople(){
    const people = load(KEYS.PEOPLE).sort((a,b)=> a.name.localeCompare(b.name));
    let html = `<table class="table"><thead><tr>
      <th>ID</th><th>Nummer</th><th>Navn</th><th>Avdeling</th><th>Aktiv</th><th></th>
    </tr></thead><tbody>`;
    people.forEach(p=>{
      html += `<tr>
        <td>${p.id}</td><td>${p.number}</td><td>${p.name}</td><td>${p.dept||''}</td><td>${p.active?'Ja':'Nei'}</td>
        <td><button class="btn-secondary" data-del-person="${p.id}">Slett</button></td>
      </tr>`;
    });
    html += `</tbody></table>`;
    $('#people-table').innerHTML = html;
    $$('#people-table [data-del-person]').forEach(btn=> btn.addEventListener('click', (ev)=>{
      const id = parseInt(ev.currentTarget.getAttribute('data-del-person'),10);
      let people = load(KEYS.PEOPLE); people = people.filter(p=>p.id!==id); save(KEYS.PEOPLE, people);
      renderPeople(); populateRegForm(); populateReportFilters(); renderReport();
    }));
  }
  function attachPersonHandlers(){
    $('#person-form').addEventListener('submit',(e)=>{
      e.preventDefault();
      const number = parseInt($('#p-number').value,10);
      const name   = $('#p-name').value.trim();
      const dept   = $('#p-dept').value.trim();
      const active = parseInt($('#p-active').value,10);
      if (!number || !name) return;
      const people = load(KEYS.PEOPLE);
      const existing = people.find(p=>p.number===number) || null;
      if (existing){ existing.name=name; existing.dept=dept; existing.active=active; }
      else { people.push({ id: nextId(people), number, name, dept, active }); }
      save(KEYS.PEOPLE, people);
      e.target.reset(); renderPeople(); populateRegForm(); populateReportFilters(); renderReport();
    });
  }

  // MASTERLISTER – VOGNER
  function renderCarts(){
    const carts = load(KEYS.CARTS).sort((a,b)=> a.code.localeCompare(b.code));
    let html = `<table class="table"><thead><tr>
      <th>ID</th><th>Code</th><th>Type</th><th>Kapasitet</th><th>Område</th><th>Beskrivelse</th><th>Aktiv</th><th></th>
    </tr></thead><tbody>`;
    carts.forEach(c=>{
      html += `<tr>
        <td>${c.id}</td><td>${c.code}</td><td>${c.type||''}</td><td>${c.cap? c.cap+' kg':''}</td>
        <td>${c.area||''}</td><td>${c.desc||''}</td><td>${c.active?'Ja':'Nei'}</td>
        <td><button class="btn-secondary" data-del-cart="${c.id}">Slett</button></td>
      </tr>`;
    });
    html += `</tbody></table>`;
    $('#carts-table').innerHTML = html;
    $$('#carts-table [data-del-cart]').forEach(btn=> btn.addEventListener('click', (ev)=>{
      const id = parseInt(ev.currentTarget.getAttribute('data-del-cart'),10);
      let carts = load(KEYS.CARTS); carts = carts.filter(c=>c.id!==id); save(KEYS.CARTS, carts);
      renderCarts(); populateRegForm(); populateReportFilters(); renderStatus(); renderReport();
    }));
  }
  function attachCartHandlers(){
    $('#cart-form').addEventListener('submit',(e)=>{
      e.preventDefault();
      const code  = $('#c-code').value.trim();
      const type  = $('#c-type').value.trim();
      const cap   = parseInt($('#c-cap').value||'0',10);
      const area  = $('#c-area').value.trim();
      const desc  = $('#c-desc').value.trim();
      const active= parseInt($('#c-active').value,10);
      if (!code) return;
      const carts = load(KEYS.CARTS);
      const existing = carts.find(c=>c.code===code) || null;
      if (existing){ existing.type=type; existing.cap=cap||0; existing.area=area; existing.desc=desc; existing.active=active; }
      else { carts.push({ id: nextId(carts), code, type, cap:(cap||0), area, desc, active }); }
      save(KEYS.CARTS, carts);
      e.target.reset(); renderCarts(); populateRegForm(); populateReportFilters(); renderStatus(); renderReport();
    });
  }

  // BACKUP
  function attachBackupHandlers(){
    $('#export-json').addEventListener('click', ()=>{
      const payload = { people: load(KEYS.PEOPLE), carts: load(KEYS.CARTS), transactions: load(KEYS.TX), exported_at: new Date().toISOString() };
      const json = JSON.stringify(payload, null, 2);
      $('#export-output').textContent = json;
      const blob=new Blob([json],{type:'application/json'}); const url=URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download='vognlogg-backup.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),500);
    });
    $('#import-file').addEventListener('change', async (e)=>{
      const f=e.target.files[0]; if(!f) return; const text=await f.text();
      try{ const payload=JSON.parse(text); if(payload.people && payload.carts && payload.transactions){
        save(KEYS.PEOPLE, payload.people); save(KEYS.CARTS, payload.carts); save(KEYS.TX, payload.transactions);
        alert('Import fullført.');
        populateRegForm(); renderStatus(); populateReportFilters(); renderReport(); renderPeople(); renderCarts();
        $('#export-output').textContent = '';
      } else { alert('Ugyldig fil.'); } }
      catch(err){ alert('Kunne ikke lese JSON: '+err.message); }
      e.target.value='';
    });
    $('#reset-all').addEventListener('click', ()=>{
      if (!confirm('Er du sikker? Dette sletter alle data i denne nettleseren.')) return;
      localStorage.removeItem(KEYS.PEOPLE); localStorage.removeItem(KEYS.CARTS); localStorage.removeItem(KEYS.TX);
      alert('Data nullstilt.'); location.reload();
    });
  }

  // Init
  document.addEventListener('DOMContentLoaded', ()=>{
    bootstrap();
    attachRegHandlers(); attachReportHandlers(); attachPersonHandlers(); attachCartHandlers(); attachBackupHandlers();
    window.addEventListener('hashchange', updateActiveTab);
    updateActiveTab(); // initial
  });
})();
