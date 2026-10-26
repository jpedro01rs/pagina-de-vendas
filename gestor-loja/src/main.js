/* ============================================================
   Casca do aplicativo, navegação, eventos e inicialização
   ============================================================ */
const UI = { route: 'inicio', period: { id: 'mes' }, tabs: {}, tbl: {}, filters: {}, pdv: null, dashMonth: null, planYear: null };
const ROUTES = {
  inicio: { t: 'Painel executivo', r: pgInicio }, modulos: { t: 'Indicadores', r: pgModulos, p: 1 },
  vender: { t: 'Nova venda', r: pgVender }, caixa: { t: 'Caixa', r: pgCaixa },
  financeiro: { t: 'Financeiro', r: pgFinanceiro, p: 1 }, vendas: { t: 'Vendas', r: pgVendas, p: 1 },
  estoque: { t: 'Estoque', r: pgEstoque, p: 1 }, clientes: { t: 'Clientes', r: pgClientes, p: 1 },
  marketing: { t: 'Marketing', r: pgMarketing, p: 1 }, equipe: { t: 'Funcionários', r: pgEquipe, p: 1 },
  operacao: { t: 'Operação', r: pgOperacao, p: 1 }, fornecedores: { t: 'Fornecedores', r: pgFornecedores, p: 1 },
  precificacao: { t: 'Precificação', r: pgPrecificacao }, planejamento: { t: 'Planejamento', r: pgPlanejamento },
  seguranca: { t: 'Segurança', r: pgSeguranca, p: 1 }, satisfacao: { t: 'Satisfação', r: pgSatisfacao, p: 1 },
  config: { t: 'Configurações', r: pgConfig }, ajuda: { t: 'Ajuda', r: pgAjuda },
};
const NAV = [
  ['Dia a dia', [['inicio', 'Painel executivo', 'home', '13'], ['vender', 'Nova venda', 'cart'], ['caixa', 'Caixa', 'register'], ['modulos', 'Todos os indicadores', 'grid']]],
  ['Indicadores', MODS.filter(m => m[0] !== 'inicio').map(m => [m[0], m[2].replace(' e desempenho', '').replace(' e relacionamento', '').replace(' e publicidade', '').replace(' e produtividade', '').replace(' e logística', '').replace(' e compras', '').replace(' e rentabilidade', '').replace(' e estratégia', '').replace(' e auditoria', '').replace(' e reputação', ''), m[3], String(m[1])])],
  ['Sistema', [['config', 'Configurações', 'gear'], ['ajuda', 'Ajuda', 'help']]],
];
const homeRoute = () => (isAdmin() ? 'inicio' : 'vender');

function renderShell() {
  const cfg = S.config;
  const nav = NAV.map(([g, items]) => { const vis = items.filter(i => canRoute(i[0])); if (!vis.length) return ''; return '<div class="nav-g">' + esc(g) + '</div>' + vis.map(([r, l, i, n]) => '<a href="#' + r + '" data-nav="' + r + '">' + ic(i) + '<span>' + esc(l) + '</span>' + (n ? '<span class="n">' + n + '</span>' : '') + '</a>').join(''); }).join('');
  const tb = (isAdmin() ? [['inicio', 'Início', 'home']] : [['vendas', 'Vendas', 'trend']]).concat([['modulos', 'Indicadores', 'grid'], ['vender', 'Vender', 'cart', 'sale'], ['caixa', 'Caixa', 'register']]);
  $('#root').innerHTML = '<div class="app" id="app"><aside class="side" id="side" aria-label="Menu principal"><div class="brand"><span class="brand-mark">' + esc(initials(cfg.appName)) + '</span><div class="brand-t"><b>' + esc(cfg.appName) + '</b><span>' + esc(cfg.storeName) + '</span></div></div>' +
    '<div class="who"><span class="av">' + esc(initials(CUR.name)) + '</span><div class="who-t"><b>' + esc(CUR.name) + '</b><span>' + (CUR.role === 'admin' ? 'Administrador' : 'Operador') + '</span></div><button class="icon-btn" data-act="logout" title="Trocar de usuário" aria-label="Trocar de usuário">' + ic('logout', 'sm') + '</button></div>' +
    '<nav class="nav">' + nav + '</nav><div class="side-foot" id="side-foot"></div></aside><div class="drawer-ovl" data-act="drawer"></div>' +
    '<div class="main"><header class="top"><button class="icon-btn menu-btn" data-act="drawer" aria-label="Abrir menu">' + ic('menu') + '</button><div class="top-t"><b id="top-title"></b></div><span id="top-per"></span><a class="btn pri hide-m" href="#vender" id="top-sale">' + ic('plus', 'sm') + 'Nova venda</a></header><main class="view" id="view" tabindex="-1"></main></div>' +
    '<nav class="tabbar" aria-label="Atalhos">' + tb.map(([r, l, i, c]) => '<a href="#' + r + '" data-tab="' + r + '" class="' + (c || '') + '">' + ic(i) + '<span>' + l + '</span></a>').join('') + '<button type="button" data-act="drawer">' + ic('menu') + '<span>Menu</span></button></nav></div>';
  updateFoot();
}
function updateFoot() {
  const el = document.getElementById('side-foot'); if (!el) return;
  el.innerHTML = saveOK ? '<span class="dot"></span><span>Dados salvos neste aparelho</span>' : '<span class="dot crit"></span><span>Falha ao salvar. Faça backup.</span>';
}
function banners() {
  let h = '';
  if (S.meta.demo && isAdmin() && ['inicio', 'modulos', 'config'].includes(UI.route)) h += '<div class="banner"><p><b>Loja de demonstração.</b> Os números são fictícios, para você conhecer o sistema. Quando quiser usar de verdade, comece com a sua loja.</p><button class="btn sm pri" data-act="startOwn">Começar com a minha loja</button></div>';
  if (!saveOK) h += '<div class="banner warn"><p>Este navegador não está permitindo salvar os dados. Não use aba anônima. Baixe um backup agora.</p><button class="btn sm" data-act="backupDl">Baixar backup</button></div>';
  return h;
}
function enterApp() {
  renderShell();
  render(true);
}
function render(scrollTop) {
  if (!CUR || !$('#view')) return;
  let r = UI.route;
  if (!ROUTES[r]) r = homeRoute();
  if (!canRoute(r)) r = homeRoute();
  UI.route = r;
  CH.clear(); TBL.clear(); hideTip();
  const R = ROUTES[r];
  const view = $('#view');
  try { view.innerHTML = banners() + R.r(); }
  catch (e) { console.error(e); view.innerHTML = banners() + card('', emptyBox('Não foi possível abrir esta tela', 'Erro: ' + esc(e.message || e) + '. Tente recarregar a página.', '<button class="btn" data-act="go" data-r="inicio">Voltar ao painel</button>')); }
  view.classList.toggle('has-bar', r === 'vender');
  for (const a of $$('[data-nav]')) a.classList.toggle('on', a.dataset.nav === r);
  for (const a of $$('[data-tab]')) a.classList.toggle('on', a.dataset.tab === r);
  $('#top-title').textContent = R.t;
  $('#top-sale').hidden = r === 'vender' || !canRoute('vender');
  const per = $('#top-per');
  if (R.p) { const pl = periodLabel(UI.period); per.innerHTML = '<button class="per-btn" data-act="period" aria-label="Mudar período">' + ic('cal', 'sm') + esc(pl.name) + ' <span class="hide-m">' + esc(pl.span) + '</span>' + ic('down', 'sm') + '</button>'; }
  else per.innerHTML = '';
  document.title = R.t + ' · ' + S.config.appName;
  drawCharts();
  if (r === 'vender') pdvRefresh(['tot']);
  if (scrollTop) window.scrollTo(0, 0);
}
function go(route, tab) {
  if (tab) UI.tabs[tab[0]] = tab[1];
  closeAllModals();
  if (location.hash.slice(1) === route) { UI.route = route; render(true); }
  else location.hash = route;
}

/* ---------- ações gerais ---------- */
ACT.info = el => showInfo(el.dataset.k);
ACT.period = () => openPeriod();
ACT.drawer = () => document.body.classList.toggle('drawer-open');
ACT.go = el => go(el.dataset.r, el.dataset.tg ? [el.dataset.tg, el.dataset.tv] : null);
ACT.tab = el => { UI.tabs[el.dataset.g] = el.dataset.v; render(); };
ACT.filt = el => { UI.filters[el.dataset.f] = el.dataset.v; render(); };
CHG.filt = el => { UI.filters[el.dataset.f] = el.value; render(); };
ACT.tsort = el => { const st = UI.tbl[el.dataset.t]; if (!st) return; if (st.sort === el.dataset.k) st.dir = -st.dir; else { st.sort = el.dataset.k; st.dir = -1; } refreshTable(el.dataset.t); };
ACT.tmore = el => { const st = UI.tbl[el.dataset.t]; if (!st) return; st.lim += 100; refreshTable(el.dataset.t); };
let tblTimer = null;
INP.tblq = el => { const st = UI.tbl[el.dataset.t]; if (!st) return; st.q = el.value; st.lim = Math.max(50, TBL.get(el.dataset.t)?.limit || 50); clearTimeout(tblTimer); tblTimer = setTimeout(() => refreshTable(el.dataset.t), 120); };

function applyTheme() {
  const t = S.config.theme;
  const root = document.documentElement;
  if (t === 'light' || t === 'dark') { root.dataset.theme = t; root.dataset.ccTheme = '1'; }
  else if (root.dataset.ccTheme) { delete root.dataset.theme; delete root.dataset.ccTheme; }
}

function bindEvents() {
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-act]');
    if (a && !a.disabled) { const f = ACT[a.dataset.act]; if (f) { e.preventDefault(); try { f(a, e); } catch (err) { console.error(err); toast('Algo deu errado: ' + (err.message || err), 'err'); } return; } }
    if (e.target.closest('.nav a, .tabbar a')) document.body.classList.remove('drawer-open');
  });
  document.addEventListener('input', e => { const a = e.target.closest('[data-inp]'); if (a && INP[a.dataset.inp]) INP[a.dataset.inp](a, e); });
  document.addEventListener('change', e => { const a = e.target.closest('[data-chg]'); if (a && CHG[a.dataset.chg]) CHG[a.dataset.chg](a, e); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if ($('.ovl')) closeTopModal(); else document.body.classList.remove('drawer-open'); }
    if (e.key === 'Enter' && e.target.matches && e.target.matches('tr.click')) { e.preventDefault(); e.target.click(); }
    if (e.key === 'Enter' && e.target.id === 'pdv-q') {
      e.preventDefault();
      const q = e.target.value.trim().toLowerCase(); if (!q) return;
      const act = S.products.filter(p => p.active !== false);
      const exact = act.find(p => (p.sku || '').toLowerCase() === q);
      const first = exact || act.find(p => (p.name + ' ' + (p.sku || '')).toLowerCase().includes(q));
      if (first) { pdvAddProduct(first.id); e.target.value = ''; pdvState().q = ''; pdvRefresh(['res']); }
      else toast('Produto não encontrado', 'err');
    }
  });
  document.addEventListener('pointermove', e => { const el = e.target.closest && e.target.closest('.chart'); if (el && el.id) chartHover(el, e.clientX, e.clientY); else if (!$('#tip').hidden) hideTip(); }, { passive: true });
  document.addEventListener('pointerdown', e => { const el = e.target.closest && e.target.closest('.chart'); if (el && el.id) chartHover(el, e.clientX, e.clientY); else hideTip(); }, { passive: true });
  window.addEventListener('scroll', () => { if (!$('#tip').hidden) hideTip(); }, { passive: true });
  window.addEventListener('hashchange', () => { const r = location.hash.slice(1); if (r && r !== UI.route) { UI.route = r; closeAllModals(); document.body.classList.remove('drawer-open'); render(true); } });
  let rz = null, lastW = innerWidth;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (Math.abs(innerWidth - lastW) > 4) { lastW = innerWidth; drawCharts(); } }, 150); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && saveTimer) flushSave(); });
  window.addEventListener('pagehide', () => { if (saveTimer) flushSave(); });
}
function setupSync() {
  try {
    BC = new BroadcastChannel('caixa-claro');
    BC.onmessage = async ev => {
      if (!ev.data || ev.data.tab === TAB_ID || !(ev.data.rev > S.meta.rev)) return;
      const st = await Store.get('state'); if (!st || !st.meta) return;
      S = migrate(st); invalidate();
      if (CUR) { CUR = S.users.find(u => u.id === CUR.id) || CUR; if ($('.ovl')) return; render(); toast('Atualizado com as alterações feitas em outra janela'); }
    };
  } catch (e) { /* navegador sem BroadcastChannel */ }
}
function setupPWA() {
  try {
    if (!/^https?:$/.test(location.protocol) || window.top !== window.self) return;
    if (/claude|anthropic/i.test(location.hostname)) return;
    const l = document.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.webmanifest'; document.head.appendChild(l);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* sem modo offline */ });
  } catch (e) { /* ok */ }
}

async function boot() {
  await Store.open();
  let st = null;
  try { st = await Store.get('state'); } catch (e) { st = null; }
  if (st && st.meta && Array.isArray(st.sales)) S = migrate(st);
  else { S = buildDemo(); S.meta.demo = true; LS.set('lastUser', S.users[0].id); await flushSave(); }
  materializeRecurring(true);
  invalidate();
  applyTheme();
  UI.period = LS.get('period', { id: 'mes' }) || { id: 'mes' };
  if (UI.period.id === 'custom' && !(UI.period.from && UI.period.to)) UI.period = { id: 'mes' };
  UI.route = location.hash.slice(1) || 'inicio';
  bindEvents(); setupSync(); setupPWA();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { }); } catch (e) { /* ok */ }
  const act = activeUsers();
  let sid = null; try { sid = sessionStorage.getItem('cc_uid'); } catch (e) { /* ok */ }
  const bySession = act.find(u => u.id === sid);
  const last = act.find(u => u.id === LS.get('lastUser', ''));
  if (!needLogin()) CUR = act[0] || S.users[0];
  else if (bySession) CUR = bySession;
  else if (last && !last.pin) CUR = last;
  if (CUR) enterApp(); else showGate();
}
boot().catch(e => { console.error(e); const r = document.getElementById('root'); if (r) r.innerHTML = '<div class="gate"><div class="gate-box"><h1>Não foi possível abrir</h1><p>' + esc(e.message || e) + '</p><p class="muted">Use o Google Chrome ou o Microsoft Edge atualizados e não use aba anônima.</p></div></div>'; });
