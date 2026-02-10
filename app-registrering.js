// app-registrering.js
const { supa, getPeople, getCarts, getTx, addTx, nowDate, nowTime, showAlert } = window._vogn;

let _people = [];
let _carts = [];

async function loadLists() {
  _people = await getPeople(true);
  _carts = await getCarts(true);

  document.getElementById('peopleList').innerHTML =
    _people.map(p => `<option value="${p.name} (${p.number})">`).join('');

  document.getElementById('cartsList').innerHTML =
    _carts.map(c => `<option value="${c.code}">`).join('');
}

function resolvePerson(text) {
  const match = text.match(/\((\d+)\)/);
  if (match) {
    const person = _people.find(p => p.number == match[1]);
    return person?.id || '';
  }
  return '';
}

function resolveCart(text) {
  const code = text.split(' ')[0].trim().toLowerCase();
  const cart = _carts.find(c => c.code.toLowerCase() === code);
  return cart?.id || '';
}

document.getElementById('reg-form').addEventListener('submit', async e => {
  e.preventDefault();

  const pid = resolvePerson(document.getElementById('person_search').value);
  const cid = resolveCart(document.getElementById('cart_search').value);
  const action = document.getElementById('action').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const dept = document.getElementById('dept').value;
  const project = document.getElementById('project').value;
  const note = document.getElementById('note').value;

  if (!pid) return showAlert('reg-alert', 'Velg person', true);
  if (!cid) return showAlert('reg-alert', 'Velg vogn', true);
  if (!action) return showAlert('reg-alert', 'Velg handling', true);

  const tx = await getTx();
  const last = tx.filter(t => t.cart_id == cid).sort((a, b) =>
    a.event_at < b.event_at ? 1 : -1
  )[0];

  const free = !last || last.action === 'IN';

  if (action === 'OUT' && !free)
    return showAlert('reg-alert', 'Vogn er allerede ute', true);

  if (action === 'IN' && free)
    return showAlert('reg-alert', 'Vogn er ikke registrert ute', true);

  const event_at = new Date(`${date}T${time}:00`);

  await addTx({
    person_id: pid,
    cart_id: cid,
    action,
    event_at,
    dept,
    project,
    note
  });

  showAlert('reg-alert', 'Registrert ✔️');
});

loadLists();
