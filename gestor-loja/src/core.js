'use strict';
/* ============================================================
   Caixa Claro — núcleo: utilidades, estado, armazenamento, auditoria
   ============================================================ */
const APP_VERSION = '1.0.0';
const DAY = 86400000;

// ---------- utilidades ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const r2 = n => Math.round((+n || 0) * 100) / 100;
const sum = (arr, f) => { let t = 0; for (const x of arr) t += +(f ? f(x) : x) || 0; return t; };
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const div = (a, b) => (b ? a / b : 0);
const avg = arr => (arr.length ? sum(arr) / arr.length : 0);
function groupBy(arr, f) { const m = new Map(); for (const x of arr) { const k = f(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); } return m; }

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const NUM = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const NUM1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const INT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const CMP = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const fm = v => BRL.format(r2(v));
const fmc = v => (Math.abs(v) >= 100000 ? 'R$ ' + CMP.format(v) : fm(v));
const fmAxis = v => (Math.abs(v) >= 1000 ? 'R$ ' + CMP.format(v) : 'R$ ' + INT.format(v));
const fp = (v, d = 1) => (isFinite(v) ? (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—') + '%';
const fn = v => NUM.format(v || 0);
const fi = v => INT.format(Math.round(v || 0));
const f1 = v => NUM1.format(v || 0);
const plural = (n, s, p) => fi(n) + ' ' + (Math.round(n) === 1 ? s : p);

function parseNum(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  let s = String(v ?? '').trim().replace(/[R$\s%]/g, '');
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}
const toInput = n => (n === null || n === undefined || n === '' ? '' : String(r2(n)).replace('.', ','));

// ---------- datas (sempre no horário local, como texto AAAA-MM-DD[THH:MM]) ----------
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const ymdhm = d => ymd(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
function parseD(s) {
  if (!s) return null;
  const [a, b] = String(s).split('T');
  const [y, m, d] = a.split('-').map(Number);
  const [hh, mm] = (b || '00:00').split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
}
const today = () => ymd(new Date());
const nowS = () => ymdhm(new Date());
function addDays(s, n) { const d = parseD(String(s).slice(0, 10)); d.setDate(d.getDate() + n); return ymd(d); }
function addHours(s, h) { const d = parseD(s); d.setTime(d.getTime() + h * 3600000); return ymdhm(d); }
const diffDays = (a, b) => (parseD(b) - parseD(a)) / DAY;
const diffHours = (a, b) => (parseD(b) - parseD(a)) / 3600000;
const monthKey = s => String(s).slice(0, 7);
const monthStart = s => String(s).slice(0, 7) + '-01';
function monthEnd(s) { const d = parseD(monthStart(s)); d.setMonth(d.getMonth() + 1); d.setDate(0); return ymd(d); }
function addMonths(s, n) { const [y, m] = String(s).slice(0, 7).split('-').map(Number); return ymd(new Date(y, m - 1 + n, 1)); }
function weekStart(s) { const d = parseD(String(s).slice(0, 10)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ymd(d); }
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MES_C = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
function fd(s) { if (!s) return '—'; const d = parseD(s); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
function fdt(s) { if (!s) return '—'; return fd(s) + (String(s).length > 10 ? ' ' + String(s).slice(11, 16) : ''); }
function fds(s) { const d = parseD(s); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); }
const monthLabel = k => { const [y, m] = k.split('-'); return MESES[+m - 1] + ' de ' + y; };
const cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);
const monthShort = k => { const [y, m] = k.split('-'); return MES_C[+m - 1] + '/' + y.slice(2); };
const daysInRange = r => Math.round(diffDays(r.from, r.to)) + 1;
function eachDay(r) { const out = []; let d = r.from; let g = 0; while (d <= r.to && g++ < 4000) { out.push(d); d = addDays(d, 1); } return out; }
const inR = (d, r) => { if (!d) return false; const x = String(d).slice(0, 10); return x >= r.from && x <= r.to; };
function fdur(h) { if (!isFinite(h) || h <= 0) return '—'; if (h < 1) return fi(h * 60) + ' min'; if (h < 48) return f1(h).replace(',0', '') + ' h'; return f1(h / 24).replace(',0', '') + ' dias'; }
function ago(s) { const d = diffDays(String(s).slice(0, 10), today()); if (d < 1) return 'hoje'; if (d < 2) return 'ontem'; return 'há ' + fi(d) + ' dias'; }

// ---------- períodos ----------
const PERIODS = [
  { id: 'hoje', l: 'Hoje' }, { id: '7d', l: 'Últimos 7 dias' }, { id: '30d', l: 'Últimos 30 dias' },
  { id: 'mes', l: 'Este mês' }, { id: 'mesant', l: 'Mês passado' }, { id: '90d', l: 'Últimos 90 dias' },
  { id: 'ano', l: 'Este ano' }, { id: 'tudo', l: 'Todo o período' },
];
function firstDataDate() {
  let m = today();
  for (const s of S.sales) if (s.date < m) m = s.date.slice(0, 10);
  for (const e of S.ledger) if (e.date < m) m = e.date.slice(0, 10);
  return m;
}
function rangeFor(p) {
  const t = today();
  switch (p.id) {
    case 'hoje': return { from: t, to: t };
    case '7d': return { from: addDays(t, -6), to: t };
    case '30d': return { from: addDays(t, -29), to: t };
    case '90d': return { from: addDays(t, -89), to: t };
    case 'mesant': { const f = addMonths(t, -1); return { from: f, to: monthEnd(f) }; }
    case 'ano': return { from: t.slice(0, 4) + '-01-01', to: t };
    case 'tudo': return { from: firstDataDate(), to: t };
    case 'custom': return { from: p.from <= p.to ? p.from : p.to, to: p.from <= p.to ? p.to : p.from };
    default: return { from: monthStart(t), to: t };
  }
}
function prevRange(r, id) {
  const n = daysInRange(r);
  if (id === 'mes' || id === 'mesant' || (r.from.endsWith('-01') && n >= 28 && r.to === monthEnd(r.from))) {
    const f = addMonths(r.from, -1); const e = monthEnd(f); const t = addDays(f, n - 1);
    return { from: f, to: t < e ? t : e };
  }
  if (id === 'ano') return { from: (+r.from.slice(0, 4) - 1) + r.from.slice(4), to: (+r.to.slice(0, 4) - 1) + r.to.slice(4) };
  return { from: addDays(r.from, -n), to: addDays(r.from, -1) };
}
function periodLabel(p) {
  const r = rangeFor(p);
  const name = p.id === 'custom' ? 'Período' : (PERIODS.find(x => x.id === p.id) || PERIODS[3]).l;
  return { name, span: r.from === r.to ? fd(r.from) : fds(r.from) + ' a ' + fd(r.to) };
}

// ---------- PRNG (dados de demonstração) ----------
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hashPin(p) { let h = 0x811c9dc5; const s = String(p) + '|cc'; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return 'h' + (h >>> 0).toString(36); }
function genCode() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const c = (globalThis.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint32Array(8)) : Array.from({ length: 8 }, () => Math.random() * 1e9); for (let i = 0; i < 8; i++) s += a[c[i] % a.length]; return s.slice(0, 4) + '-' + s.slice(4); }

// ---------- grupos de categorias financeiras ----------
const GROUPS = {
  fixa: { type: 'out', l: 'Despesa fixa', h: 'Entra no lucro e no ponto de equilíbrio. Ex.: aluguel, internet, contador.' },
  pessoal: { type: 'out', l: 'Pessoal (funcionários)', h: 'Salários, encargos e benefícios. Entra no lucro e no custo com funcionários.' },
  variavel: { type: 'out', l: 'Despesa variável', h: 'Gastos que variam com o movimento. Ex.: embalagens, manutenção.' },
  marketing: { type: 'out', l: 'Marketing e anúncios', h: 'Entra no lucro e nos indicadores de marketing (CAC, ROAS).' },
  mercadoria: { type: 'out', l: 'Compra de mercadoria', h: 'Vai para o estoque. O custo só entra no lucro quando o produto é vendido.' },
  imposto: { type: 'out', l: 'Imposto sobre vendas (guia)', h: 'Se a alíquota estiver configurada, o imposto já é descontado de cada venda e esta saída não é contada duas vezes.' },
  comissao: { type: 'out', l: 'Pagamento de comissões', h: 'Se os vendedores têm % de comissão no cadastro, ela já é descontada de cada venda.' },
  investimento: { type: 'out', l: 'Investimento', h: 'Não entra no lucro do mês. Usado no ROI.' },
  retirada: { type: 'out', l: 'Retirada do dono', h: 'Sai do caixa, mas não é despesa da loja.' },
  perda: { type: 'both', l: 'Ajuste de caixa ou perda', h: 'Quebras e sobras de caixa e perdas. Contado em "Perdas", não em despesas.' },
  venda: { type: 'in', l: 'Venda', h: 'Gerado automaticamente pelas vendas.' },
  outra: { type: 'in', l: 'Outra receita', h: 'Entra no lucro como outra receita.' },
  aporte: { type: 'in', l: 'Aporte ou empréstimo', h: 'Entra no caixa, mas não é receita.' },
};

function defaultCategories() {
  const c = (id, name, type, group) => ({ id, name, type, group });
  return [
    c('aluguel', 'Aluguel e condomínio', 'out', 'fixa'), c('energia', 'Energia, água e gás', 'out', 'fixa'),
    c('internet', 'Internet e telefone', 'out', 'fixa'), c('contador', 'Contador e taxas', 'out', 'fixa'),
    c('sistemas', 'Sistemas e assinaturas', 'out', 'fixa'), c('prolabore', 'Pró-labore do dono', 'out', 'fixa'),
    c('tarifas', 'Tarifas bancárias e juros', 'out', 'fixa'),
    c('salarios', 'Salários e encargos', 'out', 'pessoal'), c('beneficios', 'Benefícios (VT, VR)', 'out', 'pessoal'),
    c('embalagens', 'Embalagens e materiais', 'out', 'variavel'), c('manutencao', 'Manutenção e limpeza', 'out', 'variavel'),
    c('fretes', 'Fretes e entregas', 'out', 'variavel'), c('outras_desp', 'Outras despesas', 'out', 'variavel'),
    c('marketing', 'Marketing e anúncios', 'out', 'marketing'),
    c('mercadoria', 'Compra de mercadorias', 'out', 'mercadoria'),
    c('impostos', 'Impostos sobre vendas (guia DAS)', 'out', 'imposto'), c('comissoes', 'Comissões pagas', 'out', 'comissao'),
    c('investimento', 'Investimentos (reforma, equipamentos)', 'out', 'investimento'),
    c('retirada', 'Retirada de lucro do dono', 'out', 'retirada'),
    c('quebra', 'Quebra de caixa', 'out', 'perda'), c('perda', 'Perdas e prejuízos', 'out', 'perda'),
    c('vendas', 'Vendas', 'in', 'venda'), c('outras_rec', 'Outras receitas', 'in', 'outra'),
    c('aporte', 'Aporte do dono / empréstimo', 'in', 'aporte'), c('sobra', 'Sobra de caixa', 'in', 'perda'),
  ];
}
function defaultConfig() {
  return {
    appName: 'Caixa Claro', storeName: 'Minha Loja', ownerName: '', doc: '', phone: '', address: '',
    initialBalance: 0, startDate: today(), taxRate: 6, targetMargin: 15, activeDays: 90, defaultCommission: 0,
    monthlyGoal: 0, lowStockDefault: 3, highDiscount: 15, theme: 'auto', recoveryCode: genCode(),
    paymentMethods: [
      { id: 'din', name: 'Dinheiro', fee: 0, days: 0, kind: 'dinheiro' },
      { id: 'pix', name: 'Pix', fee: 0, days: 0, kind: 'imediato' },
      { id: 'deb', name: 'Cartão de débito', fee: 1.4, days: 1, kind: 'imediato' },
      { id: 'cre', name: 'Cartão de crédito', fee: 3.2, days: 30, kind: 'imediato' },
      { id: 'par', name: 'Crédito parcelado', fee: 5.5, days: 30, kind: 'imediato' },
      { id: 'fia', name: 'Fiado / a prazo', fee: 0, days: 30, kind: 'prazo' },
    ],
    channels: [
      { id: 'loja', name: 'Loja física (balcão)', paid: false }, { id: 'insta', name: 'Instagram', paid: true },
      { id: 'face', name: 'Facebook', paid: true }, { id: 'google', name: 'Google', paid: true },
      { id: 'tiktok', name: 'TikTok', paid: true }, { id: 'whats', name: 'WhatsApp', paid: false },
      { id: 'indic', name: 'Indicação', paid: false }, { id: 'site', name: 'Site / marketplace', paid: false },
      { id: 'outro', name: 'Outro', paid: false },
    ],
    categories: defaultCategories(),
  };
}
function newState() {
  return {
    v: 1,
    meta: { created: nowS(), rev: 0, saleSeq: 1000, purchaseSeq: 100, demo: false, lastBackup: null, setupDone: false },
    config: defaultConfig(),
    users: [{ id: 'u_admin', name: 'Administrador', role: 'admin', pin: null, active: true }],
    products: [], moves: [], customers: [], sales: [], ledger: [], recurrences: [], suppliers: [], purchases: [],
    employees: [], absences: [], cash: [], counts: [], losses: [], reviews: [], complaints: [], goals: {}, investments: [], audit: [],
  };
}
function migrate(st) {
  const base = newState();
  for (const k of Object.keys(base)) if (!(k in st)) st[k] = base[k];
  st.meta = Object.assign({}, base.meta, st.meta || {});
  const dc = defaultConfig();
  st.config = Object.assign({}, dc, st.config || {});
  for (const k of ['paymentMethods', 'channels', 'categories']) if (!Array.isArray(st.config[k]) || !st.config[k].length) st.config[k] = dc[k];
  return st;
}

let S = newState();

// ---------- armazenamento (IndexedDB com reserva em localStorage) ----------
const Store = {
  db: null,
  open() {
    return new Promise(res => {
      let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      setTimeout(() => fin(false), 2500);
      try {
        const rq = indexedDB.open('caixa-claro', 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
        rq.onsuccess = () => { this.db = rq.result; fin(true); };
        rq.onerror = () => fin(false);
        rq.onblocked = () => fin(false);
      } catch (e) { fin(false); }
    });
  },
  async get(key) {
    if (this.db) {
      try {
        const v = await new Promise((res, rej) => { const tx = this.db.transaction('kv', 'readonly'); const rq = tx.objectStore('kv').get(key); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); });
        if (v !== undefined) return v;
      } catch (e) { /* cai para o localStorage */ }
    }
    try { const s = localStorage.getItem('cc_' + key); return s ? JSON.parse(s) : undefined; } catch (e) { return undefined; }
  },
  async set(key, val) {
    if (this.db) {
      try {
        await new Promise((res, rej) => { const tx = this.db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(val, key); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
        return true;
      } catch (e) { /* tenta localStorage */ }
    }
    try { localStorage.setItem('cc_' + key, JSON.stringify(val)); return true; } catch (e) { return false; }
  },
};
const LS = {
  get(k, d) { try { const v = localStorage.getItem('cc_ui_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('cc_ui_' + k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } },
};

let saveTimer = null, saveOK = true, storageMode = 'ok';
const TAB_ID = uid();
let BC = null;
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(flushSave, 250); }
async function flushSave() {
  clearTimeout(saveTimer); saveTimer = null;
  const ok = await Store.set('state', S);
  if (!ok && saveOK) toast('Não foi possível salvar neste navegador. Faça um backup em Configurações.', 'err');
  saveOK = ok; storageMode = ok ? 'ok' : 'fail';
  try { BC && BC.postMessage({ rev: S.meta.rev, tab: TAB_ID }); } catch (e) { /* ok */ }
  updateFoot && updateFoot();
}
async function snapshotBefore(reason) { try { await Store.set('state_prev', { at: nowS(), reason, state: JSON.parse(JSON.stringify(S)) }); } catch (e) { /* ok */ } }

// ---------- usuário atual, permissões e auditoria ----------
let CUR = null;
const currentUser = () => CUR;
const isAdmin = () => !!CUR && CUR.role === 'admin';
const OPER_ROUTES = new Set(['vender', 'caixa', 'vendas', 'operacao', 'clientes', 'estoque', 'satisfacao', 'ajuda', 'modulos']);
const canRoute = r => isAdmin() || OPER_ROUTES.has(r);

function logAudit(action, entity, summary, entityId) {
  const u = currentUser();
  S.audit.push({ id: uid(), at: nowS(), userId: u ? u.id : null, user: u ? u.name : 'Sistema', action, entity, summary, entityId: entityId || null });
  if (S.audit.length > 30000) S.audit.splice(0, S.audit.length - 30000);
}
function commit(action, entity, summary, entityId) {
  S.meta.rev++;
  if (action) logAudit(action, entity, summary, entityId);
  invalidate();
  scheduleSave();
}

// ---------- índices (recalculados quando o estado muda) ----------
let IX = null, IXrev = -1;
const MEMO = new Map();
function invalidate() { IX = null; MEMO.clear(); }
function ix() {
  if (IX && IXrev === S.meta.rev) return IX;
  const byId = arr => new Map(arr.map(x => [x.id, x]));
  const c = S.config;
  const custStats = new Map();
  const sorted = S.sales.filter(s => s.status !== 'cancelada').sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const s of sorted) {
    if (!s.customerId) continue;
    let cs = custStats.get(s.customerId);
    if (!cs) { cs = { count: 0, total: 0, first: s.date, last: s.date, dates: [], firstChannel: s.channelId }; custStats.set(s.customerId, cs); }
    cs.count++; cs.total += s.total; cs.last = s.date; cs.dates.push(s.date);
  }
  const movesByProd = groupBy(S.moves, m => m.productId);
  IX = {
    prod: byId(S.products), cust: byId(S.customers), emp: byId(S.employees), sup: byId(S.suppliers), user: byId(S.users),
    cat: byId(c.categories), pm: byId(c.paymentMethods), ch: byId(c.channels), sale: byId(S.sales), purchase: byId(S.purchases),
    custStats, movesByProd, salesSorted: sorted,
  };
  IXrev = S.meta.rev;
  return IX;
}
const prodName = id => ix().prod.get(id)?.name || 'Produto removido';
const custName = id => (id ? ix().cust.get(id)?.name || 'Cliente removido' : 'Consumidor não identificado');
const empName = id => (id ? ix().emp.get(id)?.name || 'Funcionário removido' : 'Sem vendedor');
const supName = id => ix().sup.get(id)?.name || 'Fornecedor removido';
const chName = id => ix().ch.get(id)?.name || 'Não informado';
const pmName = id => ix().pm.get(id)?.name || '—';
const catName = id => ix().cat.get(id)?.name || 'Sem categoria';
const catOf = id => ix().cat.get(id) || { group: 'variavel', name: 'Sem categoria', type: 'out' };
const unitCost = p => r2((+p.cost || 0) + (+p.extraCost || 0));
const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// ---------- financeiro: quando um lançamento foi efetivamente pago/recebido ----------
function paidDate(e) {
  if (e.status === 'pago') return e.paidDate || e.date;
  if (e.auto && e.dueDate && e.dueDate <= today()) return e.dueDate;
  return null;
}

// ---------- estoque ----------
function addMove(productId, qty, type, refId, cost, note, date) {
  const p = ix().prod.get(productId) || S.products.find(x => x.id === productId);
  if (!p) return;
  p.stock = r2((+p.stock || 0) + qty);
  S.moves.push({ id: uid(), date: date || nowS(), productId, qty, type, refId: refId || null, unitCost: cost ?? unitCost(p), note: note || '', user: currentUser()?.name || 'Sistema' });
}
const openCash = () => S.cash.find(c => !c.closedAt) || null;

// ---------- vendas ----------
function saveSale(d, opt = {}) {
  const cfg = S.config, I = ix();
  const pm = I.pm.get(d.paymentMethodId) || cfg.paymentMethods[0];
  const items = d.items.filter(it => +it.qty > 0).map(it => {
    const p = I.prod.get(it.productId);
    return { productId: it.productId, name: p ? p.name : it.name || 'Item', sku: p ? p.sku || '' : '', qty: +it.qty, price: r2(it.price), cost: p ? unitCost(p) : r2(it.cost || 0), discount: r2(it.discount || 0) };
  });
  const subtotal = r2(sum(items, i => i.qty * i.price - i.discount));
  const ful = d.fulfillment && d.fulfillment.type && d.fulfillment.type !== 'balcao' ? d.fulfillment : null;
  const shipCharged = r2(ful ? ful.shippingCharged || 0 : 0);
  const discount = r2(clamp(d.discount || 0, 0, subtotal));
  const goods = r2(subtotal - discount);
  const total = r2(goods + shipCharged);
  const fee = r2(total * (+pm.fee || 0) / 100);
  const emp = d.employeeId ? I.emp.get(d.employeeId) : null;
  const commPct = emp ? (emp.commissionPct ?? cfg.defaultCommission ?? 0) : 0;
  const date = d.date || nowS();
  const cs = opt.silent ? null : openCash();
  const sale = {
    id: d.id || uid(), number: ++S.meta.saleSeq, date, customerId: d.customerId || null, employeeId: d.employeeId || null,
    channelId: d.channelId || 'loja', items, subtotal, discount, total, paymentMethodId: pm.id, fee,
    tax: r2(goods * (+cfg.taxRate || 0) / 100), commission: r2(goods * (+commPct || 0) / 100), status: 'concluida',
    fulfillment: ful ? { type: ful.type, status: ful.status || 'novo', promisedAt: ful.promisedAt || null, processedAt: ful.processedAt || null, deliveredAt: ful.deliveredAt || null, shippingCharged: shipCharged, shippingCost: r2(ful.shippingCost || 0), address: ful.address || '' } : null,
    error: d.error || null,
    cashSessionId: d.cashSessionId !== undefined ? d.cashSessionId : (pm.kind === 'dinheiro' && cs ? cs.id : null),
    userId: d.userId || currentUser()?.id || null, notes: d.notes || '', createdAt: opt.silent ? date : nowS(),
  };
  S.sales.push(sale);
  for (const it of items) addMove(it.productId, -it.qty, 'venda', sale.id, it.cost, 'Venda #' + sale.number, date);
  const net = r2(total - fee);
  const day = date.slice(0, 10);
  const e = { id: uid(), type: 'in', date: day, amount: net, categoryId: 'vendas', description: 'Venda #' + sale.number + (fee ? ' (taxa de ' + fm(fee) + ' descontada)' : ''), saleId: sale.id, methodId: pm.id, createdAt: sale.createdAt };
  if (pm.kind === 'prazo') { e.status = 'pendente'; e.dueDate = d.dueDate || addDays(day, pm.days || 30); }
  else if ((+pm.days || 0) > 0) { e.status = 'pendente'; e.auto = true; e.dueDate = addDays(day, +pm.days); }
  else { e.status = 'pago'; e.paidDate = day; e.dueDate = day; }
  if (net > 0) S.ledger.push(e);
  if (!opt.silent) commit('criou', 'Venda', 'Venda #' + sale.number + ' — ' + fm(total) + ' (' + pm.name + ')' + (discount > 0 ? ', desconto de ' + fm(discount) : ''), sale.id);
  return sale;
}
function cancelSale(sale, reason, opt = {}) {
  sale.status = 'cancelada'; sale.cancelReason = reason; sale.cancelledAt = opt.at || nowS(); sale.cancelledBy = opt.by || currentUser()?.name || 'Sistema';
  for (const it of sale.items) addMove(it.productId, +it.qty, 'devolucao', sale.id, it.cost, 'Cancelamento da venda #' + sale.number, sale.cancelledAt);
  S.ledger = S.ledger.filter(e => e.saleId !== sale.id);
  if (!opt.silent) commit('cancelou', 'Venda', 'Venda #' + sale.number + ' (' + fm(sale.total) + ') — motivo: ' + reason, sale.id);
}

// ---------- recorrências (contas fixas mensais) ----------
function materializeRecurring(silent) {
  let created = 0;
  const limit = monthKey(addMonths(today(), 1));
  for (const rc of S.recurrences) {
    if (!rc.active) continue;
    let m = rc.startMonth, g = 0;
    const skip = new Set(rc.skip || []);
    const have = new Set(S.ledger.filter(e => e.recId === rc.id).map(e => e.recMonth));
    while (m <= limit && g++ < 600) {
      if (rc.endMonth && m > rc.endMonth) break;
      if (!have.has(m) && !skip.has(m)) {
        const last = +monthEnd(m + '-01').slice(8);
        const date = m + '-' + pad(Math.min(rc.day || 1, last));
        S.ledger.push({ id: uid(), type: rc.type, date, dueDate: date, amount: r2(rc.amount), categoryId: rc.categoryId, description: rc.description, status: 'pendente', recId: rc.id, recMonth: m, employeeId: rc.employeeId || null, channelId: rc.channelId || null, createdAt: nowS() });
        created++;
      }
      m = monthKey(addMonths(m + '-01', 1));
    }
  }
  if (created && !silent) commit(null);
  return created;
}
