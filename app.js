// ═══════════════════════════════
// STATE
// ═══════════════════════════════
const CREDS = { username:'Ranjit', password:'admin@123' };
const SHOP = { name:'Ranjit-Cold-Drinks', address:'Mohol', phone:''};

let state = {
  items: JSON.parse(localStorage.getItem('fb_items') || 'null') || getDefaultItems(),
  orders: JSON.parse(localStorage.getItem('fb_orders') || '[]'),
  cart: [],
  currentTab: 'dashboard',
  filterCat: 'All',
  currentBill: null
};

function save() {
  localStorage.setItem('fb_items', JSON.stringify(state.items));
  localStorage.setItem('fb_orders', JSON.stringify(state.orders));
}

function getDefaultItems() {
  return [
    { id:uid(), name:'Coca Cola', cat:'Cold Drinks', price:40},
    { id:uid(), name:'Pepsi', cat:'Cold Drinks', price:35},
    { id:uid(), name:'Sprite', cat:'Cold Drinks', price:35},
    { id:uid(), name:'Limca', cat:'Cold Drinks', price:30,},
    { id:uid(), name:'Thums Up', cat:'Cold Drinks', price:40},
    { id:uid(), name:'Maaza', cat:'Juices', price:30},
    { id:uid(), name:'Real Juice Orange', cat:'Juices', price:45},
    { id:uid(), name:'Lassi', cat:'Shakes', price:50},
    { id:uid(), name:'Chocolate Shake', cat:'Shakes', price:70},
    { id:uid(), name:'Vanilla Ice Cream', cat:'Ice Cream', price:40},
    { id:uid(), name:'Samosa', cat:'Snacks', price:15},
    { id:uid(), name:'Biscuit Pack', cat:'Snacks', price:20 },
    { id:uid(), name:'Mineral Water', cat:'Water', price:20 },
  ];
}

// ═══════════════════════════════
// UTILS
// ═══════════════════════════════
function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2,5); }
function fmt(n) { return '₹' + Number(n).toFixed(2); }
function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) + ' ' +
         d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
}
function today() { return new Date().toISOString().split('T')[0]; }

function toast(msg, type='info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(()=>el.remove(), 3000);
}

// ═══════════════════════════════
// AUTH
// ═══════════════════════════════
function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  if(u===CREDS.username && p===CREDS.password) {
    // persist login until explicit logout
    localStorage.setItem('loggedIn','true');
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('app-page').classList.add('active');
    initApp();
    toast('Welcome back, Owner! 👋','success');
  } else {
    toast('Invalid credentials','error');
    document.getElementById('login-pass').value='';
  }
}
document.getElementById('login-pass').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
document.getElementById('login-user').addEventListener('keydown', e=>{ if(e.key==='Enter') document.getElementById('login-pass').focus(); });

function doLogout() {
  document.getElementById('app-page').classList.remove('active');
  document.getElementById('login-page').classList.add('active');
  document.getElementById('login-user').value='';
  document.getElementById('login-pass').value='';
  // remove persistent login flag
  localStorage.removeItem('loggedIn');
  toast('Logged out');
}

// ═══════════════════════════════
// CLOCK
// ═══════════════════════════════
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
setInterval(updateClock,1000); updateClock();

// ═══════════════════════════════
// TABS
// ═══════════════════════════════
function showTab(t) {
  state.currentTab = t;
  ['dashboard','order','history','summary'].forEach(x=>{
    document.getElementById(`tab-${x}`).classList.toggle('active', x===t);
  });
  // update nav buttons
  document.querySelectorAll('.nav-btn').forEach((b,i)=>{
    b.classList.toggle('active',['dashboard','order','history','summary'][i]===t);
  });
  document.querySelectorAll('.tab').forEach((b,i)=>{
    b.classList.toggle('active',['dashboard','order','history','summary'][i]===t);
  });
  if(t==='order') renderOrderMenu();
  if(t==='history') renderHistory();
  if(t==='summary') { document.getElementById('summary-date').value=today(); renderSummary(); }
}

function initApp() {
  renderDashboard();
  renderDashboardStats();
  renderCart();
  renderOrderMenu();
  renderHistory();
  document.getElementById('summary-date').value = today();
  document.getElementById('filter-date').value = '';
  renderSummary();
  showTab('dashboard');
}

// ═══════════════════════════════
// DASHBOARD (MENU MANAGEMENT)
// ═══════════════════════════════
function renderDashboardStats() {
  const todayOrders = state.orders.filter(o=>o.date===today());
  const todaySales = todayOrders.reduce((s,o)=>s+o.total,0);
  const totalOrders = state.orders.length;
  document.getElementById('dashboard-stats').innerHTML = `
    <div class="card stat-card">
      <div class="stat-val">${state.items.length}</div>
      <div class="stat-label">Menu Items</div>
    </div>
    <div class="card stat-card">
      <div class="stat-val">${todayOrders.length}</div>
      <div class="stat-label">Today's Orders</div>
    </div>
    <div class="card stat-card">
      <div class="stat-val">${fmt(todaySales)}</div>
      <div class="stat-label">Today's Revenue</div>
    </div>
    <div class="card stat-card">
      <div class="stat-val">${totalOrders}</div>
      <div class="stat-label">Total Orders</div>
    </div>
  `;
}

function renderDashboard() {
  const grid = document.getElementById('items-grid');
  if(!state.items.length) { grid.innerHTML='<p style="color:var(--muted);grid-column:1/-1;">No items yet. Add some!</p>'; return; }
  grid.innerHTML = state.items.map(item=>`
    <div class="card menu-item-card">
      
      <div class="item-name">${item.name}</div>
      <div class="item-cat"><span class="badge badge-cyan">${item.cat}</span></div>
      <div class="item-price">${fmt(item.price)}</div>
      <div class="item-actions">
        <button class="btn btn-ghost btn-sm" onclick="editItem('${item.id}')"> Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteItem('${item.id}')">🗑</button>
      </div>
    </div>
  `).join('');
}

function toggleItemForm() {
  const f = document.getElementById('item-form');
  f.style.display = f.style.display==='none'?'block':'none';
  if(f.style.display==='block') { clearForm(); document.getElementById('f-name').focus(); }
}
function cancelItemForm() { document.getElementById('item-form').style.display='none'; clearForm(); }

function clearForm() {
  ['f-name','f-price'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('f-cat').value='Cold Drinks';
  document.getElementById('f-edit-id').value='';
  document.getElementById('form-title').textContent='Add New Item';
}

function saveItem() {
  const name = document.getElementById('f-name').value.trim();
  const cat = document.getElementById('f-cat').value;
  const price = parseFloat(document.getElementById('f-price').value);
  const editId = document.getElementById('f-edit-id').value;
  if(!name) { toast('Item name is required','error'); return; }
  if(isNaN(price)||price<0) { toast('Enter a valid price','error'); return; }
  if(editId) {
    const i = state.items.findIndex(x=>x.id===editId);
    state.items[i] = { id:editId, name, cat, price };
    toast('Item updated ','success');
  } else {
    state.items.push({ id:uid(), name, cat, price });
    toast('Item added ','success');
  }
  save(); renderDashboard(); renderDashboardStats(); cancelItemForm();
}

function editItem(id) {
  const item = state.items.find(x=>x.id===id);
  document.getElementById('f-name').value = item.name;
  document.getElementById('f-cat').value = item.cat;
  document.getElementById('f-price').value = item.price;
  document.getElementById('f-edit-id').value = id;
  document.getElementById('form-title').textContent = '✏️ Edit Item';
  document.getElementById('item-form').style.display = 'block';
  document.getElementById('item-form').scrollIntoView({behavior:'smooth'});
}

function deleteItem(id) {
  if(!confirm('Delete this item?')) return;
  state.items = state.items.filter(x=>x.id!==id);
  save(); renderDashboard(); renderDashboardStats();
  toast('Item deleted','info');
}

// ═══════════════════════════════
// ORDER / CART
// ═══════════════════════════════
function renderOrderMenu() {
  const cats = ['All', ...new Set(state.items.map(i=>i.cat))];
  document.getElementById('cat-filter').innerHTML = cats.map(c=>
    `<button class="cat-chip ${state.filterCat===c?'active':''}" onclick="setFilterCat('${c}')">${c}</button>`
  ).join('');

  const q = document.getElementById('item-search').value.toLowerCase();
  const filtered = state.items.filter(i=>{
    const catMatch = state.filterCat==='All' || i.cat===state.filterCat;
    const nameMatch = i.name.toLowerCase().includes(q);
    return catMatch && nameMatch;
  });

  document.getElementById('order-menu-grid').innerHTML = filtered.length
    ? filtered.map(i=>`
        <button class="order-item-btn" onclick="addToCart('${i.id}')">
          
          <div class="oi-name">${i.name}</div>
          <div class="oi-price">${fmt(i.price)}</div>
        </button>`).join('')
    : '<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:40px;">No items found</p>';
}

function setFilterCat(c) { state.filterCat=c; renderOrderMenu(); }

function addToCart(itemId) {
  const item = state.items.find(x=>x.id===itemId);
  const existing = state.cart.find(x=>x.id===itemId);
  if(existing) existing.qty++;
  else state.cart.push({ id:itemId, name:item.name, price:item.price, qty:1 });
  renderCart();
  // micro-feedback
  toast(`${item.name} added`,'success');
}

function changeQty(id, delta) {
  const idx = state.cart.findIndex(x=>x.id===id);
  if(idx===-1) return;
  state.cart[idx].qty += delta;
  if(state.cart[idx].qty<=0) state.cart.splice(idx,1);
  renderCart();
}

function clearCart() {
  if(state.cart.length && !confirm('Clear cart?')) return;
  state.cart=[];
  document.getElementById('customer-name').value='';
  document.getElementById('discount-val').value='';
  document.getElementById('gst-val').value='';
  renderCart();
}

function renderCart() {
  const el = document.getElementById('cart-items');
  if(!state.cart.length) {
    el.innerHTML='<div class="cart-empty"><div class="ce-icon"></div><p>Add items to start an order</p></div>';
    renderCartTotals(); return;
  }
  el.innerHTML = state.cart.map(ci=>`
    <div class="cart-row">
      <span>${ci.emoji||''}</span>
      <div style="flex:1">
        <div class="cr-name">${ci.name}</div>
        <div class="cr-price">${fmt(ci.price)} each → ${fmt(ci.price*ci.qty)}</div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changeQty('${ci.id}',-1)">−</button>
        <span class="qty-num">${ci.qty}</span>
        <button class="qty-btn" onclick="changeQty('${ci.id}',1)">+</button>
      </div>
    </div>
  `).join('');
  renderCartTotals();
}

function getCartCalc() {
  const subtotal = state.cart.reduce((s,i)=>s+i.price*i.qty,0);
  const disc = Math.max(0,Math.min(100,parseFloat(document.getElementById('discount-val').value)||0));
  const gst = Math.max(0,Math.min(28,parseFloat(document.getElementById('gst-val').value)||0));
  const discAmt = subtotal * disc/100;
  const afterDisc = subtotal - discAmt;
  const gstAmt = afterDisc * gst/100;
  const total = afterDisc + gstAmt;
  return { subtotal, disc, gst, discAmt, gstAmt, total };
}

function renderCartTotals() {
  if(!state.cart.length) { document.getElementById('cart-totals').innerHTML=''; return; }
  const c = getCartCalc();
  document.getElementById('cart-totals').innerHTML = `
    <div class="total-row"><span>Subtotal (${state.cart.reduce((s,i)=>s+i.qty,0)} items)</span><span>${fmt(c.subtotal)}</span></div>
    ${c.discAmt>0?`<div class="total-row" style="color:var(--yellow)"><span>Discount (${c.disc}%)</span><span>− ${fmt(c.discAmt)}</span></div>`:''}
    ${c.gstAmt>0?`<div class="total-row"><span>GST (${c.gst}%)</span><span>+ ${fmt(c.gstAmt)}</span></div>`:''}
    <div class="total-row grand"><span>TOTAL</span><span class="amount">${fmt(c.total)}</span></div>
  `;
}

// ═══════════════════════════════
// BILL GENERATION
// ═══════════════════════════════
function generateBill() {
  if(!state.cart.length) { toast('Cart is empty!','error'); return; }
  const c = getCartCalc();
  const custName = document.getElementById('customer-name').value.trim() || 'Walk-in Customer';
  const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
  const ts = Date.now();
  const order = {
    id: orderId, timestamp: ts, date: today(), customer: custName,
    items: state.cart.map(i=>({...i})),
    subtotal: c.subtotal, disc: c.disc, discAmt: c.discAmt,
    gst: c.gst, gstAmt: c.gstAmt, total: c.total
  };
  state.orders.unshift(order);
  save(); renderDashboardStats();
  state.currentBill = order;
  showBillModal(order);
  // Clear cart after bill
  state.cart=[];
  document.getElementById('customer-name').value='';
  document.getElementById('discount-val').value='';
  document.getElementById('gst-val').value='';
  renderCart();
}

function showBillModal(order) {
  const content = buildBillHTML(order);
  document.getElementById('bill-content').innerHTML = content;
  document.getElementById('bill-modal').classList.add('open');

  // QR code
  const qrEl = document.getElementById('bill-qr');
  qrEl.innerHTML='';
  try {
    new QRCode(qrEl, {
      text: `${SHOP.name}\nOrder: ${order.id}\nTotal: ${fmt(order.total)}\n${fmtDate(order.timestamp)}`,
      width:90, height:90,
      colorDark:'#00c4e8', colorLight:'#0a1628'
    });
  } catch(e){}
}

function buildBillHTML(order) {
  const items = order.items.map(i=>`
    <tr>
      <td>${i.emoji||''} ${i.name}</td>
      <td>${i.qty}</td>
      <td>${fmt(i.price)}</td>
      <td>${fmt(i.price*i.qty)}</td>
    </tr>
  `).join('');
  return `
    <div class="bill-shop-name">${SHOP.name}</div>
    <div class="bill-sub">${SHOP.address}</div>
    <div class="bill-sub"> ${SHOP.phone}</div>
    ${order.gst>0?`<div class="bill-sub">GST: ${SHOP.gst}</div>`:''}
    <hr class="bill-divider">
    <div class="bill-meta">Order: <strong>${order.id}</strong></div>
    <div class="bill-meta">Customer: ${order.customer}</div>
    <div class="bill-meta">Date: ${fmtDate(order.timestamp)}</div>
    <hr class="bill-divider">
    <table class="bill-table">
      <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>${items}</tbody>
    </table>
    <hr class="bill-divider">
    <div class="bill-gst-row"><span>Subtotal</span><span>${fmt(order.subtotal)}</span></div>
    ${order.discAmt>0?`<div class="bill-discount-row"><span>Discount (${order.disc}%)</span><span>− ${fmt(order.discAmt)}</span></div>`:''}
    ${order.gstAmt>0?`<div class="bill-gst-row"><span>GST (${order.gst}%)</span><span>+ ${fmt(order.gstAmt)}</span></div>`:''}
    <div class="bill-grand"><span>GRAND TOTAL</span><span>${fmt(order.total)}</span></div>
    <div class="bill-footer-text" style="margin-top:16px;">
      Thank you for visiting ${SHOP.name}! <br>
      Come again & stay cool!
    </div>
  `;
}

function buildPrintHTML(order) {
  const items = order.items.map(i=>`
    <div class="print-row"><span>${i.emoji||''} ${i.name} x${i.qty}</span><span>${fmt(i.price*i.qty)}</span></div>
  `).join('');
  return `
    <div class="print-shop-name">${SHOP.name}</div>
    <div class="print-sub">${SHOP.address}</div>
    <div class="print-sub">${SHOP.phone}</div>
    ${order.gst>0?`<div class="print-sub">GST: ${SHOP.gst}</div>`:''}
    <div class="print-line"></div>
    <div>Order: ${order.id}</div>
    <div>Customer: ${order.customer}</div>
    <div>Date: ${fmtDate(order.timestamp)}</div>
    <div class="print-line"></div>
    ${items}
    <div class="print-line"></div>
    ${order.discAmt>0?`<div class="print-row"><span>Discount (${order.disc}%)</span><span>-${fmt(order.discAmt)}</span></div>`:''}
    ${order.gstAmt>0?`<div class="print-row"><span>GST (${order.gst}%)</span><span>+${fmt(order.gstAmt)}</span></div>`:''}
    <div class="print-row print-total"><span>TOTAL</span><span>${fmt(order.total)}</span></div>
    <div class="print-line"></div>
    <div style="text-align:center;margin-top:8px;">Thank you! Come again </div>
  `;
}

function closeBillModal() { document.getElementById('bill-modal').classList.remove('open'); }

function printBill() {
  if(!state.currentBill) return;
  const pArea = document.getElementById('print-area');
  pArea.style.display='block';
  pArea.innerHTML = buildPrintHTML(state.currentBill);
  window.print();
  setTimeout(()=>{ pArea.style.display='none'; pArea.innerHTML=''; },1000);
}

function exportPDF() {
  if(!state.currentBill) return;
  toast('Opening print dialog — select "Save as PDF"','info');
  printBill();
}

function shareBill() {
  if(!state.currentBill) return;
  const o = state.currentBill;
  const text = `🧊 ${SHOP.name}\nOrder: ${o.id}\nDate: ${fmtDate(o.timestamp)}\nItems: ${o.items.map(i=>`${i.name} x${i.qty}`).join(', ')}\nTotal: ${fmt(o.total)}\nThank you!`;
  if(navigator.share) {
    navigator.share({ title:'Bill from '+SHOP.name, text });
  } else {
    navigator.clipboard.writeText(text).then(()=>toast('Bill copied to clipboard!','success'));
  }
}

// ═══════════════════════════════
// HISTORY
// ═══════════════════════════════
function renderHistory() {
  const dateFilter = document.getElementById('filter-date').value;
  let orders = state.orders;
  if(dateFilter) orders = orders.filter(o=>o.date===dateFilter);
  const el = document.getElementById('history-list');
  if(!orders.length) { el.innerHTML='<p style="color:var(--muted);text-align:center;padding:60px;">No orders found.</p>'; return; }
  el.innerHTML = orders.map(o=>`
    <div class="card order-card">
      <div class="order-card-header">
        <div>
          <div class="order-id">${o.id}</div>
          <div style="font-weight:600;margin-top:4px;"> ${o.customer}</div>
        </div>
        <div style="text-align:right">
          <div class="order-time">${fmtDate(o.timestamp)}</div>
          <div class="order-total">${fmt(o.total)}</div>
        </div>
      </div>
      <div class="order-items-list">${o.items.map(i=>`${i.emoji||''} ${i.name} ×${i.qty} (${fmt(i.price*i.qty)})`).join('  ·  ')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${o.discAmt>0?`<span class="badge badge-orange">Discount ${o.disc}%</span>`:''}
        ${o.gstAmt>0?`<span class="badge badge-cyan">GST ${o.gst}%</span>`:''}
        <button class="btn btn-ghost btn-sm" onclick='reprintBill(${JSON.stringify(o).replace(/'/g,"&apos;")})'> View Bill</button>
        <button class="btn btn-ghost btn-sm" onclick='reprintBillPrint(${JSON.stringify(o).replace(/'/g,"&apos;")})'> Print</button>
      </div>
    </div>
  `).join('');
}

function reprintBill(order) { state.currentBill=order; showBillModal(order); }
function reprintBillPrint(order) {
  state.currentBill=order;
  const pArea = document.getElementById('print-area');
  pArea.style.display='block';
  pArea.innerHTML = buildPrintHTML(order);
  window.print();
  setTimeout(()=>{ pArea.style.display='none'; pArea.innerHTML=''; },1000);
}

// ═══════════════════════════════
// SUMMARY
// ═══════════════════════════════
function renderSummary() {
  const d = document.getElementById('summary-date').value || today();
  const orders = state.orders.filter(o=>o.date===d);
  const totalRevenue = orders.reduce((s,o)=>s+o.total,0);
  const totalItems = orders.reduce((s,o)=>s+o.items.reduce((ss,i)=>ss+i.qty,0),0);
  const avgOrder = orders.length ? totalRevenue/orders.length : 0;

  // Item breakdown
  const itemMap = {};
  orders.forEach(o=>o.items.forEach(i=>{
    if(!itemMap[i.name]) itemMap[i.name]={name:i.name,emoji:i.emoji,qty:0,revenue:0};
    itemMap[i.name].qty += i.qty;
    itemMap[i.name].revenue += i.price*i.qty;
  }));
  const topItems = Object.values(itemMap).sort((a,b)=>b.revenue-a.revenue);

  document.getElementById('summary-content').innerHTML = `
    <div class="stats-row">
      <div class="card stat-card"><div class="stat-val">${orders.length}</div><div class="stat-label">Total Orders</div></div>
      <div class="card stat-card"><div class="stat-val">${fmt(totalRevenue)}</div><div class="stat-label">Total Revenue</div></div>
      <div class="card stat-card"><div class="stat-val">${totalItems}</div><div class="stat-label">Items Sold</div></div>
      <div class="card stat-card"><div class="stat-val">${fmt(avgOrder)}</div><div class="stat-label">Avg Order Value</div></div>
    </div>
      ${topItems.length ? `
    <div class="card summary-card">
      <h3 style="margin-bottom:16px;font-size:18px;color:var(--frost);"> Item Breakdown</h3>
      ${topItems.map(i=>`
        <div class="summary-row">
          <span>${i.emoji||''} ${i.name}</span>
          <span>${i.qty} sold</span>
          <span class="summary-val">${fmt(i.revenue)}</span>
        </div>
      `).join('')}
    </div>
    ` : `<p style="color:var(--muted);text-align:center;padding:60px;">No orders on this date.</p>`}
  `;
}

// ═══════════════════════════════
// INIT
// ═══════════════════════════════
// Show login on load — restore session if persisted
if (localStorage.getItem('loggedIn') === 'true') {
  document.getElementById('login-page').classList.remove('active');
  document.getElementById('app-page').classList.add('active');
  initApp();
  toast('Welcome back, Owner! 👋','success');
} else {
  document.getElementById('login-page').classList.add('active');
  document.getElementById('app-page').classList.remove('active');
}
