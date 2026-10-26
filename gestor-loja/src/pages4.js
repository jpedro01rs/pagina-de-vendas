/* ============================================================
   Telas: configurações, ajuda, entrada (login) e início do uso
   ============================================================ */
const SYS_CATS = new Set(['vendas', 'mercadoria', 'salarios', 'marketing', 'quebra', 'sobra', 'perda', 'investimento', 'comissoes', 'impostos', 'outras_rec']);
const KIND_L = { dinheiro: 'Dinheiro (entra na gaveta)', imediato: 'Recebe sozinho no prazo', prazo: 'A prazo (você marca quando receber)' };

function pgConfig() {
  const cfg = S.config;
  const tab = curTab('cfg', 'loja');
  let h = pageHead('Sistema', 'Configurações', 'Ajuste o sistema para a sua loja. Nada aqui exige conhecimento técnico.');
  h += tabs('cfg', [['loja', 'Loja'], ['fin', 'Financeiro'], ['pag', 'Formas de pagamento'], ['can', 'Canais'], ['cat', 'Categorias'], ['usr', 'Usuários'], ['dados', 'Backup e dados']], tab);
  const kv = list => '<div class="kv">' + list.map(([k, v]) => '<div><span>' + esc(k) + '</span><b>' + (v === '' || v === null || v === undefined ? '—' : v) + '</b></div>').join('') + '</div>';
  if (tab === 'loja') {
    h += card('Dados da loja', kv([['Nome da loja', esc(cfg.storeName)], ['Responsável', esc(cfg.ownerName)], ['CNPJ / CPF', esc(cfg.doc)], ['Telefone', esc(cfg.phone)], ['Endereço', esc(cfg.address)], ['Nome do sistema', esc(cfg.appName)], ['Tema', { auto: 'Automático', light: 'Claro', dark: 'Escuro' }[cfg.theme] || 'Automático']]) + '<button class="btn pri" data-act="cfgStore">' + ic('edit', 'sm') + 'Editar</button>', { sub: 'Aparecem no topo do sistema, no comprovante de venda e no resumo do mês.' });
  } else if (tab === 'fin') {
    h += card('Parâmetros financeiros', kv([['Saldo inicial (caixa + banco)', fm(cfg.initialBalance)], ['Imposto sobre vendas', fn(cfg.taxRate) + '%'], ['Margem de lucro desejada', fn(cfg.targetMargin) + '%'], ['Comissão padrão', fn(cfg.defaultCommission) + '%'], ['Meta mensal padrão', fm(cfg.monthlyGoal)], ['Cliente ativo se comprou nos últimos', fi(cfg.activeDays) + ' dias'], ['Estoque mínimo padrão', fn(cfg.lowStockDefault)], ['Alerta de desconto alto', fn(cfg.highDiscount) + '%']]) + '<button class="btn pri" data-act="cfgFin">' + ic('edit', 'sm') + 'Editar</button>', { sub: 'Estes números entram nos cálculos de lucro, preço mínimo e alertas.' });
  } else if (tab === 'pag') {
    h += card('Formas de pagamento', table('pms', {
      rows: cfg.paymentMethods, act: 'pmEdit', search: false, tools: '<button class="btn sm pri" data-act="pmNew">' + ic('plus', 'sm') + 'Nova forma de pagamento</button>',
      cols: [{ k: 'n', l: 'Nome', f: p => '<b>' + esc(p.name) + '</b>' }, { k: 'k', l: 'Como recebe', f: p => esc(KIND_L[p.kind] || p.kind) }, { k: 'd', l: 'Prazo', f: p => (p.kind === 'dinheiro' ? 'Na hora' : p.days ? 'D+' + p.days : 'Na hora') }, { k: 'f', l: 'Taxa', num: 1, f: p => fn(p.fee) + '%' }],
    }), { sub: 'Informe a taxa da maquininha e em quantos dias o dinheiro cai. O sistema desconta a taxa e lança o recebimento na data certa.' });
  } else if (tab === 'can') {
    h += card('Canais de aquisição', table('chs', {
      rows: cfg.channels, act: 'chEdit', search: false, tools: '<button class="btn sm pri" data-act="chNew">' + ic('plus', 'sm') + 'Novo canal</button>',
      cols: [{ k: 'n', l: 'Canal', f: c => '<b>' + esc(c.name) + '</b>' }, { k: 'p', l: 'Tipo', f: c => (c.paid ? chip('Pago (anúncios)', 'info') : chip('Orgânico', 'plain')) }],
    }), { sub: 'De onde vêm os clientes. Usado no marketing (CAC, ROAS e receita por canal).' });
  } else if (tab === 'cat') {
    const rows = cfg.categories.slice().sort((a, b) => (a.type < b.type ? 1 : a.type > b.type ? -1 : a.name.localeCompare(b.name, 'pt-BR')));
    h += card('Categorias financeiras', table('cats', {
      rows, act: 'catEdit', search: false, tools: '<button class="btn sm pri" data-act="catNew">' + ic('plus', 'sm') + 'Nova categoria</button>',
      cols: [{ k: 'n', l: 'Categoria', f: c => '<b>' + esc(c.name) + '</b>' }, { k: 't', l: 'Tipo', f: c => (c.type === 'in' ? chip('Entrada', 'info') : chip('Saída', 'plain')) }, { k: 'g', l: 'Como entra nos indicadores', f: c => esc(GROUPS[c.group]?.l || c.group) }],
    }), { sub: 'O grupo define se a categoria entra no lucro, no custo com funcionários, no marketing, no estoque ou só no caixa.' });
  } else if (tab === 'usr') {
    h += card('Usuários', table('usrs', {
      rows: S.users, act: 'usrEdit', search: false, tools: '<button class="btn sm pri" data-act="usrNew">' + ic('plus', 'sm') + 'Novo usuário</button>',
      cols: [{ k: 'n', l: 'Nome', f: u => '<b>' + esc(u.name) + '</b>' + (u.id === CUR.id ? '<small class="muted">Você</small>' : '') }, { k: 'r', l: 'Perfil', f: u => (u.role === 'admin' ? chip('Administrador', 'info') : chip('Operador', 'plain')) }, { k: 'p', l: 'PIN', f: u => (u.pin ? chip('Com PIN', 'good') : chip('Sem PIN', 'warn')) }, { k: 's', l: 'Situação', f: u => (u.active === false ? chip('Desativado') : chip('Ativo', 'good')) }],
    }), { sub: 'Administrador vê e faz tudo. Operador vende, abre e fecha o caixa, atende pedidos e clientes, mas não vê o financeiro nem apaga registros.' });
    h += card('Código de recuperação', '<p class="ink2">Se o administrador esquecer o PIN, este código permite entrar e criar um PIN novo. Anote e guarde em lugar seguro.</p><div class="code-box">' + esc(cfg.recoveryCode) + '</div><button class="btn sm" data-act="newRecovery">Gerar outro código</button>');
  } else {
    const lb = S.meta.lastBackup;
    h += card('Backup', '<p class="ink2" style="margin-bottom:12px">Seus dados ficam guardados apenas neste navegador, neste aparelho. Faça um backup toda semana e guarde o arquivo em um pendrive, e-mail ou Google Drive. ' + (lb ? 'Último backup: <b>' + fdt(lb) + '</b> (' + ago(lb) + ').' : '<b>Nenhum backup feito ainda.</b>') + '</p><div class="row"><button class="btn pri" data-act="backupDl">' + ic('download', 'sm') + 'Baixar backup</button><button class="btn" data-act="backupCopy">' + ic('copy', 'sm') + 'Copiar backup</button><button class="btn" data-act="restore">' + ic('upload', 'sm') + 'Restaurar backup</button></div>');
    h += card('Exportar para planilha (Excel)', '<div class="row"><button class="btn" data-act="exportSales">Vendas do período</button><button class="btn" data-act="exportLedger">Lançamentos do período</button><button class="btn" data-act="exportProducts">Produtos</button><button class="btn" data-act="exportCustomers">Clientes</button></div>', { sub: 'Arquivos .csv que abrem no Excel ou Google Planilhas. O período segue o filtro de datas.' });
    h += card('Usar em outro computador', '<p class="ink2">Baixe o backup aqui, abra o sistema no outro computador e use "Restaurar backup". Os aparelhos não sincronizam sozinhos.</p>');
    h += card('Zona de cuidado', '<div class="stack" style="gap:10px"><div class="row"><button class="btn" data-act="undoRestore">Desfazer a última restauração ou limpeza</button><small class="muted">Volta os dados para como estavam antes da última restauração, demonstração ou limpeza.</small></div><div class="row"><button class="btn" data-act="loadDemo">Carregar loja de demonstração</button><small class="muted">Substitui os dados atuais por dados fictícios.</small></div><div class="row"><button class="btn danger" data-act="wipe">Apagar todos os dados</button><small class="muted">Começa do zero. Faça um backup antes.</small></div></div>');
    h += '<p class="muted" style="font-size:12.5px" id="storage-info">Versão ' + APP_VERSION + '.</p>';
    setTimeout(async () => { try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); const el = $('#storage-info'); if (el) el.textContent = 'Versão ' + APP_VERSION + ' · espaço usado ' + fn((e.usage || 0) / 1048576) + ' MB de ' + fi((e.quota || 0) / 1048576) + ' MB disponíveis neste navegador.'; } } catch (e) { /* ok */ } }, 0);
  }
  return h;
}
ACT.cfgStore = () => {
  const c = S.config;
  openForm({
    title: 'Dados da loja',
    fields: [{ k: 'storeName', l: 'Nome da loja', req: 1 }, { k: 'ownerName', l: 'Responsável', half: 1 }, { k: 'doc', l: 'CNPJ / CPF', half: 1 }, { k: 'phone', l: 'Telefone', half: 1 }, { k: 'address', l: 'Endereço', half: 1 }, { k: 'appName', l: 'Nome do sistema (aparece no topo)', half: 1, req: 1 }, { k: 'theme', l: 'Tema', t: 'select', half: 1, opts: [['auto', 'Automático (igual ao aparelho)'], ['light', 'Claro'], ['dark', 'Escuro']] }],
    values: { ...c },
    onSubmit: v => { Object.assign(c, { storeName: v.storeName, ownerName: v.ownerName, doc: v.doc, phone: v.phone, address: v.address, appName: v.appName, theme: v.theme }); applyTheme(); commit('editou', 'Configurações', 'Dados da loja'); toast('Dados salvos'); renderShell(); render(); },
  });
};
ACT.cfgFin = () => {
  const c = S.config;
  openForm({
    title: 'Parâmetros financeiros',
    fields: [
      { k: 'initialBalance', l: 'Saldo inicial (caixa + banco)', t: 'money', help: 'Quanto a loja tinha no dia em que começou a usar o sistema.' },
      { k: 'taxRate', l: 'Imposto sobre vendas', t: 'pct', half: 1, help: 'Ex.: Simples Nacional, cerca de 4% a 8%.' },
      { k: 'targetMargin', l: 'Margem de lucro desejada', t: 'pct', half: 1, help: 'Usada no preço sugerido.' },
      { k: 'defaultCommission', l: 'Comissão padrão', t: 'pct', half: 1 },
      { k: 'monthlyGoal', l: 'Meta mensal padrão', t: 'money', half: 1, help: 'Usada nos meses sem meta própria.' },
      { k: 'activeDays', l: 'Cliente ativo: comprou nos últimos (dias)', t: 'int', half: 1 },
      { k: 'lowStockDefault', l: 'Estoque mínimo padrão (novos produtos)', t: 'num', half: 1 },
      { k: 'highDiscount', l: 'Alertar descontos a partir de', t: 'pct', half: 1 },
    ],
    values: { ...c },
    onSubmit: v => {
      const ch = [];
      for (const k of ['initialBalance', 'taxRate', 'targetMargin', 'defaultCommission', 'monthlyGoal', 'activeDays', 'lowStockDefault', 'highDiscount']) { const nv = +v[k] || 0; if (nv !== +c[k]) ch.push(k + ': ' + c[k] + ' → ' + nv); c[k] = nv; }
      if (!c.activeDays) c.activeDays = 90;
      commit('editou', 'Configurações', 'Parâmetros financeiros' + (ch.length ? ' (' + ch.join('; ') + ')' : '')); toast('Parâmetros salvos'); render();
    },
  });
};
function pmForm(p) {
  const isNew = !p;
  const used = p && S.sales.some(s => s.paymentMethodId === p.id);
  openForm({
    title: isNew ? 'Nova forma de pagamento' : p.name,
    fields: [{ k: 'name', l: 'Nome', req: 1 }, { k: 'kind', l: 'Como o dinheiro entra', t: 'select', opts: Object.entries(KIND_L) }, { k: 'fee', l: 'Taxa cobrada', t: 'pct', half: 1 }, { k: 'days', l: 'Dias para o dinheiro cair', t: 'int', half: 1, show: v => v.kind !== 'dinheiro', help: '0 = na hora. Crédito costuma ser 30.' }],
    values: p ? { ...p } : { kind: 'imediato', fee: 0, days: 0 },
    danger: !isNew && !used && S.config.paymentMethods.length > 1 ? { l: 'Remover', f: () => { S.config.paymentMethods = S.config.paymentMethods.filter(x => x.id !== p.id); commit('excluiu', 'Forma de pagamento', p.name); render(); } } : null,
    onSubmit: v => {
      const data = { name: v.name, kind: v.kind, fee: +v.fee || 0, days: v.kind === 'dinheiro' ? 0 : Math.max(0, +v.days || 0) };
      if (isNew) S.config.paymentMethods.push({ id: uid(), ...data }); else Object.assign(p, data);
      commit(isNew ? 'criou' : 'editou', 'Forma de pagamento', v.name + ' — taxa ' + fn(data.fee) + '%, D+' + data.days); toast('Salvo'); render();
    },
  });
}
ACT.pmNew = () => pmForm(null);
ACT.pmEdit = el => { const p = S.config.paymentMethods.find(x => x.id === el.dataset.id); if (p) pmForm(p); };
function chForm(c) {
  const isNew = !c;
  const used = c && (S.sales.some(s => s.channelId === c.id) || S.customers.some(x => x.channelId === c.id) || S.ledger.some(e => e.channelId === c.id));
  openForm({
    title: isNew ? 'Novo canal' : c.name, size: 'sm',
    fields: [{ k: 'name', l: 'Nome do canal', req: 1 }, { k: 'paid', l: 'Canal pago (anúncios)', t: 'check', help: 'Marque para canais onde você paga anúncios.' }],
    values: c ? { ...c } : { paid: false },
    danger: !isNew && !used ? { l: 'Remover', f: () => { S.config.channels = S.config.channels.filter(x => x.id !== c.id); commit('excluiu', 'Canal', c.name); render(); } } : null,
    onSubmit: v => { if (isNew) S.config.channels.push({ id: uid(), name: v.name, paid: v.paid }); else Object.assign(c, { name: v.name, paid: v.paid }); commit(isNew ? 'criou' : 'editou', 'Canal', v.name); toast('Salvo'); render(); },
  });
}
ACT.chNew = () => chForm(null);
ACT.chEdit = el => { const c = S.config.channels.find(x => x.id === el.dataset.id); if (c) chForm(c); };
function catForm(c) {
  const isNew = !c;
  const sys = c && SYS_CATS.has(c.id);
  const used = c && S.ledger.some(e => e.categoryId === c.id);
  const gOpts = type => Object.entries(GROUPS).filter(([k, g]) => (g.type === type || g.type === 'both') && k !== 'venda').map(([k, g]) => [k, g.l]);
  openForm({
    title: isNew ? 'Nova categoria' : c.name,
    fields: [
      { k: 'name', l: 'Nome', req: 1 },
      { k: 'type', l: 'Tipo', t: 'seg', opts: [['out', 'Saída'], ['in', 'Entrada']], show: () => isNew },
      { k: 'gOut', l: 'Como entra nos indicadores', t: 'select', opts: () => gOpts('out'), show: v => !sys && (isNew ? v.type : c.type) === 'out' },
      { k: 'gIn', l: 'Como entra nos indicadores', t: 'select', opts: () => gOpts('in'), show: v => !sys && (isNew ? v.type : c.type) === 'in' },
    ],
    values: c ? { ...c, gOut: c.group, gIn: c.group } : { type: 'out', gOut: 'fixa', gIn: 'outra' },
    live: v => { const g = GROUPS[(isNew ? v.type : c.type) === 'in' ? v.gIn : v.gOut]; return g && !sys ? '<p class="muted" style="font-size:13px">' + esc(g.h) + '</p>' : sys ? '<p class="muted" style="font-size:13px">Categoria usada pelo sistema. Você pode mudar só o nome.</p>' : ''; },
    danger: !isNew && !sys && !used ? { l: 'Remover', f: () => { S.config.categories = S.config.categories.filter(x => x.id !== c.id); commit('excluiu', 'Categoria', c.name); render(); } } : null,
    onSubmit: v => {
      const type = isNew ? v.type : c.type;
      const group = sys ? c.group : (type === 'in' ? v.gIn : v.gOut);
      if (isNew) S.config.categories.push({ id: uid(), name: v.name, type, group }); else Object.assign(c, { name: v.name, group });
      commit(isNew ? 'criou' : 'editou', 'Categoria', v.name + ' (' + GROUPS[group].l + ')'); toast('Salvo'); render();
    },
  });
}
ACT.catNew = () => catForm(null);
ACT.catEdit = el => { const c = S.config.categories.find(x => x.id === el.dataset.id); if (c) catForm(c); };
function usrForm(u) {
  const isNew = !u;
  openForm({
    title: isNew ? 'Novo usuário' : u.name,
    fields: [
      { k: 'name', l: 'Nome', req: 1 },
      { k: 'role', l: 'Perfil', t: 'seg', opts: [['operador', 'Operador'], ['admin', 'Administrador']] },
      { k: 'pin', l: isNew ? 'PIN de acesso (4 a 6 números)' : 'Novo PIN (deixe vazio para manter)', inputmode: 'numeric', max: 6, help: 'Opcional, mas recomendado quando várias pessoas usam o sistema.' },
      { k: 'clearPin', l: 'Remover o PIN deste usuário', t: 'check', show: () => !isNew && !!u.pin },
      { k: 'active', l: 'Usuário ativo', t: 'check', show: () => !isNew },
    ],
    values: u ? { name: u.name, role: u.role, active: u.active !== false } : { role: 'operador', active: true },
    onSubmit: v => {
      if (v.pin && !/^\d{4,6}$/.test(v.pin)) return 'O PIN deve ter de 4 a 6 números.';
      const admins = S.users.filter(x => x.role === 'admin' && x.active !== false && (!u || x.id !== u.id));
      if (!isNew && (v.role !== 'admin' || !v.active) && u.role === 'admin' && !admins.length) return 'É preciso manter pelo menos um administrador ativo.';
      if (isNew) { const n = { id: uid(), name: v.name, role: v.role, pin: v.pin ? hashPin(v.pin) : null, active: true }; S.users.push(n); commit('criou', 'Usuário', n.name + ' (' + n.role + ')', n.id); }
      else { Object.assign(u, { name: v.name, role: v.role, active: v.active }); if (v.pin) u.pin = hashPin(v.pin); else if (v.clearPin) u.pin = null; commit('editou', 'Usuário', u.name + (v.pin ? ' — PIN alterado' : v.clearPin ? ' — PIN removido' : ''), u.id); }
      toast('Usuário salvo');
      if (v.pin && v.role === 'admin') showRecovery();
      renderShell(); render();
    },
  });
}
ACT.usrNew = () => usrForm(null);
ACT.usrEdit = el => { const u = S.users.find(x => x.id === el.dataset.id); if (u) usrForm(u); };
function showRecovery() { modal({ title: 'Anote o código de recuperação', size: 'sm', body: '<p class="ink2">Se esquecer o PIN de administrador, use este código na tela de entrada.</p><div class="code-box">' + esc(S.config.recoveryCode) + '</div><p class="muted" style="font-size:13px">Ele também aparece em Configurações › Usuários.</p>', foot: '<span class="sp"></span><button type="button" class="btn pri" data-close>Anotei</button>' }); }
ACT.newRecovery = async () => { const ok = await ask({ title: 'Gerar novo código', text: 'O código atual deixa de funcionar.', ok: 'Gerar' }); if (!ok) return; S.config.recoveryCode = genCode(); commit('editou', 'Segurança', 'Novo código de recuperação gerado'); render(); showRecovery(); };

/* ---------- backup, restauração, demonstração e limpeza ---------- */
const backupJSON = () => JSON.stringify({ app: 'caixa-claro', version: APP_VERSION, exportedAt: nowS(), state: S });
const backupName = () => 'backup-' + S.config.storeName.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '') + '-' + today() + '.json';
ACT.backupDl = () => { S.meta.lastBackup = nowS(); logAudit('exportou', 'Backup', 'Backup baixado'); S.meta.rev++; invalidate(); scheduleSave(); exportFile(backupName(), backupJSON(), 'application/json'); };
ACT.backupCopy = () => { S.meta.lastBackup = nowS(); logAudit('exportou', 'Backup', 'Backup copiado'); S.meta.rev++; invalidate(); scheduleSave(); copyText(backupJSON(), 'Backup copiado. Cole em um arquivo de texto e guarde.'); };
ACT.exportCustomers = () => { const rows = customerRows(); exportFile('clientes.csv', csv(rows, [['Nome', c => c.name], ['Telefone', c => c.phone], ['E-mail', c => c.email], ['Canal', c => chName(c.channelId)], ['Compras', c => c.count], ['Total gasto', c => c.total], ['Última compra', c => fd(c.last)], ['Situação', c => SEG[c.seg][0]]]), 'text/csv;charset=utf-8'); };
function parseBackup(txt) {
  let o; try { o = JSON.parse(txt); } catch (e) { return null; }
  const st = o && o.app === 'caixa-claro' && o.state ? o.state : o;
  if (!st || !st.meta || !Array.isArray(st.sales) || !Array.isArray(st.products) || !st.config) return null;
  return st;
}
async function applyState(st, reason) {
  await snapshotBefore(reason);
  S = migrate(st); invalidate(); materializeRecurring(true);
  S.meta.rev = (S.meta.rev || 0) + 1;
  await flushSave();
  UI.pdv = null; UI.tbl = {}; UI.tabs = {}; UI.filters = {};
  const u = CUR && S.users.find(x => x.id === CUR.id && x.active !== false);
  if (u) CUR = u; else CUR = null;
  applyTheme();
  if (!CUR) { if (!needLogin()) CUR = S.users.find(x => x.active !== false) || null; }
  if (CUR) { logAudit(reason === 'restauração' ? 'restaurou' : 'iniciou', 'Sistema', reason === 'restauração' ? 'Backup restaurado' : reason); commit(null); enterApp(); } else showGate();
}
ACT.restore = () => {
  const m = modal({
    title: 'Restaurar backup',
    body: '<p class="ink2">Escolha o arquivo de backup (.json). Os dados atuais serão substituídos. Uma cópia de segurança dos dados atuais é guardada para você poder desfazer.</p><div class="fld" style="margin:14px 0"><label for="rs-f">Arquivo de backup</label><input type="file" id="rs-f" accept=".json,application/json,text/plain"></div><details><summary class="lb" style="cursor:pointer">Ou cole o conteúdo do backup</summary><textarea class="raw" id="rs-t" style="margin-top:8px" placeholder="Cole aqui o texto do backup"></textarea></details><div class="frm-err" id="rs-e" style="margin-top:10px"></div>',
    foot: '<span class="sp"></span><button type="button" class="btn" data-close>Cancelar</button><button type="button" class="btn pri" id="rs-ok">Restaurar</button>',
  });
  $('#rs-ok', m.el).onclick = async () => {
    const f = $('#rs-f', m.el).files[0];
    let txt = $('#rs-t', m.el).value.trim();
    if (f) txt = await f.text();
    const st = parseBackup(txt);
    if (!st) { $('#rs-e', m.el).textContent = 'Este arquivo não é um backup válido do sistema.'; return; }
    m.close();
    const ok = await ask({ title: 'Confirmar restauração', text: 'Restaurar o backup de <b>' + esc(st.config.storeName) + '</b> com ' + plural(st.sales.length, 'venda', 'vendas') + ' e ' + plural(st.products.length, 'produto', 'produtos') + '? Os dados atuais serão substituídos.', ok: 'Restaurar' });
    if (!ok) return;
    await applyState(st, 'restauração'); toast('Backup restaurado');
  };
};
ACT.undoRestore = async () => {
  const prev = await Store.get('state_prev');
  if (!prev || !prev.state) { toast('Não há nada para desfazer.', 'err'); return; }
  const ok = await ask({ title: 'Desfazer', text: 'Voltar os dados para como estavam em <b>' + fdt(prev.at) + '</b> (antes de: ' + esc(prev.reason) + ')? Os dados atuais serão substituídos.', ok: 'Desfazer' });
  if (!ok) return;
  await applyState(prev.state, 'desfazer ' + prev.reason); toast('Dados restaurados');
};
ACT.loadDemo = async () => {
  const ok = await ask({ title: 'Carregar demonstração', text: 'Os dados atuais serão substituídos por uma loja fictícia. Faça um backup antes se quiser guardar os dados atuais.', ok: 'Carregar demonstração', danger: !S.meta.demo, type: S.meta.demo ? '' : 'DEMO' });
  if (!ok) return;
  const st = buildDemo(); st.meta.demo = true;
  LS.set('lastUser', st.users[0].id);
  CUR = st.users[0];
  await applyState(st, 'demonstração'); toast('Demonstração carregada'); go('inicio');
};
ACT.wipe = async () => {
  const ok = await ask({ title: 'Apagar todos os dados', text: 'Vendas, produtos, clientes, financeiro e histórico serão apagados deste aparelho.', ok: 'Apagar tudo', danger: true, type: 'APAGAR' });
  if (!ok) return;
  startOwnStore(true);
};
ACT.startOwn = () => startOwnStore(false);
function startOwnStore(fromWipe) {
  openForm({
    title: 'Começar com a minha loja',
    intro: (S.meta.demo ? 'Os dados de demonstração serão apagados. ' : fromWipe ? 'Todos os dados serão apagados. ' : '') + 'Preencha o básico. Tudo pode ser alterado depois em Configurações.',
    submit: 'Começar',
    fields: [
      { k: 'storeName', l: 'Nome da loja', req: 1 },
      { k: 'ownerName', l: 'Seu nome', req: 1, half: 1 },
      { k: 'pin', l: 'Crie um PIN (opcional)', inputmode: 'numeric', max: 6, half: 1, help: '4 a 6 números. Protege o acesso de administrador.' },
      { k: 'initialBalance', l: 'Quanto a loja tem hoje (caixa + banco)', t: 'money', help: 'Base para o saldo disponível e o fluxo de caixa.' },
      { k: 'taxRate', l: 'Imposto sobre vendas', t: 'pct', half: 1, help: 'Não sabe? Use 6%.' },
      { k: 'monthlyGoal', l: 'Meta de faturamento por mês', t: 'money', half: 1 },
    ],
    values: { taxRate: 6, storeName: S.meta.demo ? '' : S.config.storeName, ownerName: S.meta.demo ? '' : S.config.ownerName },
    onSubmit: async v => {
      if (v.pin && !/^\d{4,6}$/.test(v.pin)) return 'O PIN deve ter de 4 a 6 números.';
      const st = newState();
      Object.assign(st.config, { storeName: v.storeName, ownerName: v.ownerName, initialBalance: r2(v.initialBalance), taxRate: +v.taxRate || 0, monthlyGoal: r2(v.monthlyGoal), startDate: today() });
      st.users = [{ id: uid(), name: v.ownerName, role: 'admin', pin: v.pin ? hashPin(v.pin) : null, active: true }];
      st.meta.setupDone = true;
      CUR = st.users[0];
      LS.set('lastUser', CUR.id);
      try { sessionStorage.setItem('cc_uid', CUR.id); } catch (e) { /* ok */ }
      await applyState(st, fromWipe ? 'limpeza dos dados' : 'início do uso');
      go('inicio');
      if (v.pin) showRecovery(); else toast('Pronto! Siga os primeiros passos.');
    },
  });
}

/* ---------- Ajuda ---------- */
const GLOSS = [
  ['1 · Financeiro', ['lucro', 'fluxo', 'mc', 'pe', 'saldo', 'areceber', 'apagar']], ['2 · Vendas e desempenho comercial', ['fat', 'ticket', 'nvendas', 'margemprod', 'abc']],
  ['3 · Estoque', ['qtd', 'custoest', 'giro', 'cobertura', 'baixo']], ['4 · Clientes e relacionamento', ['ativos', 'novos', 'recompra', 'ticketcli', 'ltv', 'ltvcac']],
  ['5 · Marketing e publicidade', ['invmkt', 'cac', 'roas', 'receitacanal', 'roimkt']], ['6 · Funcionários e produtividade', ['custofunc', 'vendfunc', 'prodh', 'absent']],
  ['7 · Operação e logística', ['tproc', 'noprazo', 'erros', 'custoped']], ['8 · Fornecedores e compras', ['custoaq', 'prazoent', 'prazopag', 'fornprazo']],
  ['9 · Precificação e rentabilidade', ['custoprod', 'preco', 'mcprod', 'precomin', 'precosug']], ['10 · Planejamento e estratégia', ['fatprev', 'lucroprev', 'projecao', 'roi']],
  ['11 · Segurança, auditoria e prevenção de perdas', ['difcaixa', 'divest', 'perdas', 'audit']], ['12 · Satisfação e reputação', ['nota', 'taxarecl', 'tresol', 'recompexp']],
  ['13 · Indicadores executivos', ['fatmes', 'lucromes', 'saldo', 'meta', 'ritmo']],
];
const FAQ = [
  ['Onde ficam guardados os meus dados?', 'Neste aparelho, dentro do navegador. Nada é enviado para a internet e não há mensalidade. Por isso é importante fazer backup toda semana em Configurações › Backup e dados.'],
  ['Como faço backup?', 'Em Configurações › Backup e dados, toque em "Baixar backup". Guarde o arquivo em um pendrive, no e-mail ou no Google Drive. Para voltar, use "Restaurar backup".'],
  ['Quero usar em outro computador ou trocar de computador.', 'No computador antigo, baixe o backup. No novo, abra o sistema e use "Restaurar backup". Cada aparelho guarda os seus próprios dados: eles não sincronizam sozinhos.'],
  ['Funciona no celular?', 'Sim. A tela se adapta ao celular e ao tablet. Lembre que os dados do celular são separados dos dados do computador.'],
  ['O navegador pode apagar meus dados?', 'Sim, se você usar "Limpar dados de navegação" marcando cookies e dados de sites, ou se usar aba anônima. Evite essas duas coisas e mantenha o backup em dia.'],
  ['Esqueci o PIN.', 'Operador: peça ao administrador para criar um PIN novo em Configurações › Usuários. Administrador: na tela de entrada, toque em "Esqueci o PIN" e digite o código de recuperação.'],
  ['Qual a diferença entre lucro e fluxo de caixa?', 'O lucro mostra se a loja ganhou dinheiro no período (pela data da venda e da despesa). O fluxo de caixa mostra o dinheiro que realmente entrou e saiu (pela data do pagamento). Uma venda no crédito entra no lucro hoje e no caixa em 30 dias.'],
  ['Por que a compra de mercadoria não aparece como despesa no lucro?', 'Porque a mercadoria vai para o estoque. O custo dela entra no lucro quando o produto é vendido (custo da mercadoria vendida). No fluxo de caixa, o pagamento da compra aparece normalmente.'],
  ['Registrei uma venda errada.', 'Abra a venda em Vendas e toque em "Cancelar venda". Os produtos voltam ao estoque e o valor sai do financeiro. Depois registre a venda correta. O cancelamento fica no histórico.'],
  ['O saldo do sistema não bate com o banco.', 'Confira se todas as despesas foram lançadas e marcadas como pagas, se o saldo inicial está correto em Configurações › Financeiro e se as taxas e prazos das maquininhas estão certos. Para corrigir uma diferença, lance uma entrada ou saída de ajuste.'],
  ['Como uso o leitor de código de barras?', 'Cadastre o código no campo "Código" do produto. Na tela de venda, clique na busca e passe o leitor: o produto entra direto na venda.'],
  ['Como instalar como aplicativo?', 'No computador, abra no Google Chrome ou Microsoft Edge e adicione aos favoritos ou crie um atalho na área de trabalho. Se o sistema estiver em um endereço de internet (https), o navegador mostra a opção "Instalar aplicativo".'],
];
function pgAjuda() {
  const q = (UI.filters.helpQ || '').toLowerCase();
  let h = pageHead('Ajuda', 'Como usar', 'Tudo o que você precisa para usar o sistema sozinho.');
  h += '<div class="grid2">' + card('Primeiros passos', '<div class="steps">' + [
    ['Configure a loja', 'Configurações › Loja e Financeiro: nome, saldo inicial, imposto e formas de pagamento com as taxas da maquininha.', 'config'],
    ['Cadastre os produtos', 'Estoque › Novo produto: custo, preço e quantidade atual.', 'estoque'],
    ['Cadastre funcionários e fornecedores', 'Salário, jornada e comissão. Fornecedores com prazos de entrega e pagamento.', 'equipe'],
    ['Lance as contas fixas', 'Financeiro › Contas fixas: aluguel, internet, contador. O sistema cria a conta de cada mês.', 'financeiro'],
    ['Defina as metas', 'Planejamento › Definir metas do ano.', 'planejamento'],
    ['Venda!', 'Nova venda. Identifique o cliente sempre que puder.', 'vender'],
  ].map((s, i) => '<a class="step" href="#' + s[2] + '"><span class="nb">' + (i + 1) + '</span><span>' + esc(s[0]) + '<small>' + esc(s[1]) + '</small></span></a>').join('') + '</div>') +
    card('Rotina recomendada', '<div class="stack" style="gap:12px"><div><h3>Todo dia</h3><p class="ink2">Abra o caixa, registre as vendas e pedidos, lance as despesas pagas e feche o caixa contando o dinheiro.</p></div><div><h3>Toda semana</h3><p class="ink2">Confira as contas a pagar e a receber, veja os alertas do painel e faça o backup.</p></div><div><h3>Todo mês</h3><p class="ink2">Lance a folha, faça a contagem de estoque, revise os preços em Precificação e compare o mês com a meta.</p></div></div>') + '</div>';
  h += card('Como cada indicador é calculado', '<label class="search" style="max-width:none;margin-bottom:6px">' + ic('search', 'sm') + '<input type="search" placeholder="Buscar indicador" value="' + esc(UI.filters.helpQ || '') + '" data-inp="helpq" aria-label="Buscar indicador"></label><div class="gl" id="gloss">' + glossHtml(q) + '</div>');
  h += card('Perguntas frequentes', '<div class="faq">' + FAQ.map(([p, r]) => '<details><summary>' + esc(p) + '</summary><p>' + esc(r) + '</p></details>').join('') + '</div>');
  return h;
}
function glossHtml(q) {
  return GLOSS.map(([g, keys]) => { const items = keys.filter(k => !q || (INFO[k][0] + ' ' + INFO[k][1] + ' ' + INFO[k][2]).toLowerCase().includes(q)); if (!items.length) return ''; return '<h3 style="margin-top:14px">' + esc(g) + '</h3>' + items.map(k => '<div class="gl-i"><b>' + esc(INFO[k][0]) + '</b><div class="info-f">' + esc(INFO[k][1]) + '</div>' + (INFO[k][2] ? '<p>' + esc(INFO[k][2]) + '</p>' : '') + '</div>').join(''); }).join('') || '<p class="muted">Nenhum indicador encontrado.</p>';
}
INP.helpq = el => { UI.filters.helpQ = el.value; const g = $('#gloss'); if (g) g.innerHTML = glossHtml(el.value.toLowerCase()); };

/* ---------- Entrada (escolha de usuário e PIN) ---------- */
const activeUsers = () => S.users.filter(u => u.active !== false);
const needLogin = () => activeUsers().length > 1 || activeUsers().some(u => u.pin);
function showGate() {
  closeAllModals();
  document.body.classList.remove('drawer-open');
  const root = $('#root');
  const cfg = S.config;
  root.innerHTML = '<div class="gate"><div class="gate-box"><div class="brand" style="padding:0"><span class="brand-mark">' + esc(initials(cfg.appName)) + '</span><div class="brand-t"><b>' + esc(cfg.appName) + '</b><span>' + esc(cfg.storeName) + '</span></div></div><h1>Quem está usando?</h1><p>Escolha seu usuário para entrar.</p><div class="users">' + activeUsers().map(u => '<button type="button" data-gu="' + u.id + '"><span class="av">' + esc(initials(u.name)) + '</span><span><b>' + esc(u.name) + '</b><small class="muted">' + (u.role === 'admin' ? 'Administrador' : 'Operador') + (u.pin ? ' · com PIN' : '') + '</small></span>' + ic(u.pin ? 'lock' : 'right', 'sm') + '</button>').join('') + '</div>' + (S.meta.demo ? '<p class="muted" style="margin-top:14px;font-size:13px">Demonstração: o PIN do Bruno é 1234.</p>' : '') + '</div></div>';
  root.onclick = e => {
    const b = e.target.closest('[data-gu]'); if (!b) return;
    const u = S.users.find(x => x.id === b.dataset.gu); if (!u) return;
    if (!u.pin) { login(u); return; }
    pinPad(u);
  };
}
function pinPad(u) {
  const root = $('#root');
  let pin = '';
  const draw = () => {
    root.innerHTML = '<div class="gate"><div class="gate-box"><button class="btn sm ghost" data-pb="back">' + ic('left', 'sm') + 'Voltar</button><h1>Olá, ' + esc(u.name.split(' ')[0]) + '</h1><p>Digite seu PIN.</p><div class="pin-dots" id="pdots">' + Array.from({ length: 6 }, (_, i) => '<i class="' + (i < pin.length ? 'on' : '') + '"></i>').join('') + '</div><input type="password" inputmode="numeric" autocomplete="off" id="pin-in" maxlength="6" aria-label="PIN" style="position:absolute;opacity:0;width:1px;height:1px" autofocus><div class="pinpad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 'x', 0, 'ok'].map(k => '<button type="button" data-pk="' + k + '" aria-label="' + (k === 'x' ? 'Apagar' : k === 'ok' ? 'Entrar' : k) + '">' + (k === 'x' ? '⌫' : k === 'ok' ? '✓' : k) + '</button>').join('') + '</div>' + (u.role === 'admin' ? '<button class="btn sm ghost" style="margin-top:14px" data-pb="forgot">Esqueci o PIN</button>' : '<p class="muted" style="margin-top:14px;font-size:13px">Esqueceu? Peça ao administrador para criar um PIN novo.</p>') + '</div></div>';
    const inp = $('#pin-in'); if (inp && matchMedia('(pointer:fine)').matches) inp.focus();
  };
  const tryPin = () => {
    if (pin.length < 4) return;
    if (hashPin(pin) === u.pin) { login(u); return; }
    pin = ''; draw(); const d = $('#pdots'); if (d) { d.classList.add('shake'); }
    toast('PIN incorreto', 'err');
  };
  draw();
  root.onclick = e => {
    const k = e.target.closest('[data-pk]'); const b = e.target.closest('[data-pb]');
    if (b && b.dataset.pb === 'back') { showGate(); return; }
    if (b && b.dataset.pb === 'forgot') { recoverPin(u); return; }
    if (!k) return;
    const v = k.dataset.pk;
    if (v === 'x') pin = pin.slice(0, -1); else if (v === 'ok') { tryPin(); return; } else if (pin.length < 6) pin += v;
    $$('#pdots i').forEach((el, i) => el.classList.toggle('on', i < pin.length));
    if (pin.length === 6) tryPin();
  };
  root.oninput = e => { if (e.target.id === 'pin-in') { pin = e.target.value.replace(/\D/g, '').slice(0, 6); $$('#pdots i').forEach((el, i) => el.classList.toggle('on', i < pin.length)); } };
  root.onkeydown = e => { if (e.target.id === 'pin-in' && e.key === 'Enter') tryPin(); };
}
function recoverPin(u) {
  openForm({
    title: 'Recuperar acesso', size: 'sm', submit: 'Entrar', intro: 'Digite o código de recuperação que apareceu quando o PIN foi criado (também está em Configurações › Usuários).',
    fields: [{ k: 'code', l: 'Código de recuperação', req: 1, ph: 'XXXX-XXXX' }],
    onSubmit: v => {
      const norm = s => String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (norm(v.code) !== norm(S.config.recoveryCode)) return 'Código incorreto.';
      u.pin = null; CUR = u;
      commit('recuperou', 'Usuário', u.name + ' entrou com o código de recuperação e o PIN foi removido', u.id);
      login(u, true);
      setTimeout(() => usrForm(u), 300);
    },
  });
}
function login(u, silent) {
  CUR = u;
  try { sessionStorage.setItem('cc_uid', u.id); } catch (e) { /* ok */ }
  LS.set('lastUser', u.id);
  if (!silent) { logAudit('entrou', 'Acesso', u.name + ' entrou no sistema'); commit(null); }
  UI.pdv = null;
  enterApp();
}
ACT.logout = () => { if (CUR) { logAudit('saiu', 'Acesso', CUR.name + ' saiu do sistema'); commit(null); } CUR = null; try { sessionStorage.removeItem('cc_uid'); } catch (e) { /* ok */ } LS.set('lastUser', ''); if (needLogin()) showGate(); else { CUR = activeUsers()[0]; enterApp(); } };
