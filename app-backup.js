// app-backup.js
const { getPeople, getCarts, getTx } = window._vogn;

document.getElementById('export-json')?.addEventListener('click', exportJson);
document.getElementById('import-file')?.addEventListener('change', importJson);

async function exportJson(){
  const [people, carts, transactions] = await Promise.all([getPeople(false), getCarts(false), getTx()]);
  const payload = { people, carts, transactions, exported_at: new Date().toISOString() };
  const json = JSON.stringify(payload, null, 2);
  document.getElementById('export-output').textContent = json;
  const blob = new Blob([json],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'vognlogg-backup.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}

function importJson(e){
  const file = e.target.files?.[0]; if(!file) return;
  alert('Import til database er deaktivert i denne varianten. Bruk master-skjemaene for å legge til/endre.');
  e.target.value='';
}
