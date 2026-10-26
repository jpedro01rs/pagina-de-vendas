/* ============================================================
   Telas: financeiro, estoque, clientes, marketing, funcionários
   ============================================================ */

/* ---------- 1. Financeiro ---------- */
function pgFinanceiro() {
  const r = curRange(), c = calc(r), cp = calc(prevRange(r, UI.period.id));
  const P = pendings(); const bal = balanceAt(today());
  const tab = curTab('fin', 'geral');
  let h = pageHead('1 · Financeiro', 'Financeiro', 'Lucro líquido, fluxo de caixa, margem de contribuição e ponto de equilíbrio. Todo dinheiro que entra e sai fica aqui.', '<button class="btn pri" data-act="ledNew" data-t="out">' + ic('minus', 'sm') + 'Nova despesa</button><button class="btn" data-act="ledNew" data-t="in">' + ic('plus', 'sm') + 'Nova entrada</button>');
  const peTxt = isFinite(c.pe) ? fm(c.pe) : 'Sem margem';
  h += kpis([
    { l: 'Lucro líquido', v: '<span class="' + moneyCls(c.net) + '">' + fm(c.net) + '</span>', d: delta(c.net, cp.net), s: 'Margem líquida ' + fp(c.netPct), i: 'lucro', cls: 'hl' },
    { l: 'Fluxo de caixa', v: '<span class="' + moneyCls(c.flow) + '">' + fm(c.flow) + '</span>', s: 'Entrou ' + fm(c.cin) + ' · saiu ' + fm(c.cout), i: 'fluxo' },
    { l: 'Margem de contribuição', v: fm(c.mc), d: delta(c.mc, cp.mc), s: fp(c.mcPct) + ' do faturamento', i: 'mc' },
    { l: 'Ponto de equilíbrio financeiro', v: peTxt, s: isFinite(c.pe) ? (c.revenue >= c.pe ? 'Atingido. ' + fm(c.revenue - c.pe) + ' acima' : 'Faltam ' + fm(c.pe - c.revenue)) : 'Margem de contribuição negativa', i: 'pe', cls: isFinite(c.pe) && c.revenue < c.pe ? 'alert' : '' },
    { l: 'Saldo financeiro disponível', v: fm(bal), s: 'Hoje · a receber ' + fm(P.recTotal) + ' · a pagar ' + fm(P.payTotal), i: 'saldo' },
  ]);
  h += tabs('fin', [['geral', 'Visão geral'], ['lanc', 'Lançamentos'], ['contas', 'Contas a pagar e receber'], ['fixas', 'Contas fixas']], tab);
  if (tab === 'geral') {
    const bk = buckets(r);
    const ends = bk.keys.map(k => { let e = bk.kind === 'dia' ? k : bk.kind === 'semana' ? addDays(k, 6) : monthEnd(k + '-01'); return e > r.to ? r.to : e; });
    const paid = S.ledger.map(e => ({ e, d: paidDate(e) })).filter(x => x.d && inR(x.d, r));
    const ins = seriesOf(bk, paid.filter(x => x.e.type === 'in'), x => x.d, x => x.e.amount);
    const outs = seriesOf(bk, paid.filter(x => x.e.type === 'out'), x => x.d, x => x.e.amount);
    const balS = ends.map(d => balanceAt(d));
    const pePct = isFinite(c.pe) && c.pe > 0 ? div(c.revenue, c.pe) : 0;
    h += card('Ponto de equilíbrio', isFinite(c.pe) ? '<div class="meter ' + (pePct >= 1 ? 'good' : 'warn') + '"><i style="width:' + clamp(pePct * 100, 0, 100).toFixed(1) + '%"></i></div><div class="meter-row"><span>Faturamento <b>' + fm(c.revenue) + '</b> de <b>' + fm(c.pe) + '</b> necessários</span><span>' + (pePct >= 1 ? 'A loja já cobriu as despesas do período' : 'Ainda não cobriu as despesas do período') + '</span></div><p class="muted" style="margin-top:8px;font-size:13px">Despesas operacionais de ' + fm(c.opex) + ' ÷ margem de contribuição de ' + fp(c.mcPct) + '. Por dia: ' + fm(c.pe / daysInRange(r)) + '.</p>' : '<p class="muted">Sem margem de contribuição positiva no período. Revise preços e custos.</p>', { i: 'pe' });
    h += '<div class="grid2">' + card('Entradas e saídas de dinheiro por ' + bk.kind, chart({ type: 'bar', labels: bk.keys, series: [{ name: 'Entradas', values: ins, c: '--s1' }, { name: 'Saídas', values: outs, c: '--s2' }], h: 230, xf: bk.label, xt: bk.title, aria: 'Entradas e saídas' }), { i: 'fluxo' }) +
      card('Saldo em caixa e banco', chart({ type: 'line', labels: ends, series: [{ name: 'Saldo', values: balS, c: '--s1' }], h: 230, xf: fds, xt: k => 'Saldo em ' + fd(k), area: true, allowEmpty: true, aria: 'Saldo ao longo do período' }), { i: 'saldo' }) + '</div>';
    const cats = [...c.byCat].map(([k, v]) => ({ l: catName(k), v })).sort((a, b) => b.v - a.v);
    h += '<div class="grid2">' + card('Demonstrativo de resultado (DRE)', dreReceipt(c, 'Resultado do período'), { i: 'lucro' }) + card('Despesas por categoria', hbars(cats, fm, { empty: 'Nenhuma despesa no período' }) + (c.mercadoria || c.investimento || c.retirada ? '<p class="muted" style="margin-top:12px;font-size:13px">Fora do resultado: compras de mercadoria ' + fm(c.mercadoria) + ' (entram no estoque) · investimentos ' + fm(c.investimento) + ' · retiradas do dono ' + fm(c.retirada) + '.</p>' : '')) + '</div>';
  } else if (tab === 'lanc') {
    const f = UI.filters.ledT || 'todos';
    let rows = S.ledger.filter(e => inR(e.date, r));
    if (f === 'in') rows = rows.filter(e => e.type === 'in'); else if (f === 'out') rows = rows.filter(e => e.type === 'out'); else if (f === 'nv') rows = rows.filter(e => !e.saleId);
    rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    h += card('Lançamentos do período', '<div class="chips-f" style="margin-bottom:10px">' + [['todos', 'Todos'], ['nv', 'Sem as vendas'], ['in', 'Entradas'], ['out', 'Saídas']].map(([k, l]) => '<button class="' + (f === k ? 'on' : '') + '" data-act="filt" data-f="ledT" data-v="' + k + '">' + l + '</button>').join('') + '</div>' + table('led', {
      rows, act: 'ledView', ph: 'Buscar descrição ou categoria',
      text: e => e.description + ' ' + catName(e.categoryId),
      empty: 'Nenhum lançamento no período', emptyBtn: '<button class="btn sm pri" data-act="ledNew" data-t="out">Nova despesa</button>',
      tools: '<button class="btn sm" data-act="exportLedger">' + ic('download', 'sm') + 'Exportar</button>',
      cols: [
        { k: 'd', l: 'Descrição', f: e => '<b>' + esc(e.description) + '</b><small class="muted">' + fd(e.date) + ' · ' + esc(catName(e.categoryId)) + '</small>', s: e => e.date },
        { k: 'st', l: 'Situação', f: e => ledStatus(e), s: e => (paidDate(e) ? 1 : 0) },
        { k: 'v', l: 'Valor', num: 1, f: e => '<b class="' + (e.type === 'in' ? 'pos' : '') + '">' + (e.type === 'in' ? '+ ' : '− ') + fm(e.amount) + '</b>', s: e => (e.type === 'in' ? 1 : -1) * e.amount },
      ],
    }));
  } else if (tab === 'contas') {
    const row = (e) => '<tr><td class="main" data-l="Descrição"><b>' + esc(e.description) + '</b><small class="muted">' + esc(catName(e.categoryId)) + '</small></td><td data-l="Vencimento">' + ledStatus(e) + '</td><td class="num" data-l="Valor"><b>' + fm(e.amount) + '</b></td><td class="num" data-l="">' + (e.auto ? '<small class="muted">Automático</small>' : e.saleId && !isAdmin() ? '' : '<button class="btn sm" data-act="ledPay" data-id="' + e.id + '">' + (e.type === 'in' ? 'Receber' : 'Pagar') + '</button>') + '</td></tr>';
    const tbl = (list, empty) => list.length ? '<div class="tbl-wrap"><table class="rt"><thead><tr><th>Descrição</th><th>Vencimento</th><th class="num">Valor</th><th></th></tr></thead><tbody>' + list.slice(0, 80).map(row).join('') + '</tbody></table></div>' + (list.length > 80 ? '<p class="muted">Mostrando as 80 primeiras de ' + list.length + '.</p>' : '') : emptyBox(empty);
    const recManual = P.rec.filter(e => !e.auto), recAuto = P.rec.filter(e => e.auto);
    h += '<div class="kpis">' + kpi({ l: 'Contas a pagar', v: fm(P.payTotal), s: plural(P.overduePay.length, 'vencida', 'vencidas') + ' · ' + fm(sum(P.overduePay, e => e.amount)), i: 'apagar', cls: P.overduePay.length ? 'alert' : '' }) + kpi({ l: 'A receber (fiado, a prazo)', v: fm(sum(recManual, e => e.amount)), s: plural(P.overdueRec.length, 'atrasado', 'atrasados'), i: 'areceber' }) + kpi({ l: 'Cartões a cair', v: fm(sum(recAuto, e => e.amount)), s: 'Entram sozinhos na data prevista' }) + kpi({ l: 'Saldo após pagar e receber tudo', v: fm(bal + P.recTotal - P.payTotal) }) + '</div>';
    h += card('A pagar', tbl(P.pay, 'Nenhuma conta a pagar'), { a: '<button class="btn sm" data-act="ledNew" data-t="out" data-pend="1">' + ic('plus', 'sm') + 'Conta a pagar</button>' });
    h += card('A receber', tbl(recManual.concat(recAuto), 'Nada a receber'), { a: '<button class="btn sm" data-act="ledNew" data-t="in" data-pend="1">' + ic('plus', 'sm') + 'Conta a receber</button>' });
  } else {
    h += card('Contas fixas que se repetem todo mês', table('rec', {
      rows: S.recurrences.slice().sort((a, b) => (b.active - a.active) || a.description.localeCompare(b.description, 'pt-BR')), act: 'recEdit', search: false,
      empty: 'Nenhuma conta fixa cadastrada', emptySub: 'Cadastre aluguel, internet, contador, pró-labore… O sistema cria a conta de cada mês sozinho.',
      emptyBtn: '<button class="btn sm pri" data-act="recNew">Nova conta fixa</button>',
      tools: '<button class="btn sm pri" data-act="recNew">' + ic('plus', 'sm') + 'Nova conta fixa</button>',
      cols: [
        { k: 'd', l: 'Descrição', f: x => '<b>' + esc(x.description) + '</b><small class="muted">' + esc(catName(x.categoryId)) + '</small>' },
        { k: 'dia', l: 'Vence', f: x => 'Todo dia ' + x.day },
        { k: 'st', l: 'Situação', f: x => x.active ? chip('Ativa', 'good') : chip('Encerrada') },
        { k: 'v', l: 'Valor', num: 1, f: x => '<b>' + fm(x.amount) + '</b>' },
      ],
    }), { sub: 'As contas do mês atual e do próximo já aparecem em "Contas a pagar". Ao pagar, marque como paga.' });
  }
  return h;
}
function ledStatus(e) {
  const pd = paidDate(e); const t = today();
  if (pd) return chip((e.type === 'in' ? 'Recebido ' : 'Pago ') + fd(pd), 'good');
  const d = e.dueDate || e.date;
  if (e.auto) return chip('Cai em ' + fd(d), 'info');
  if (d < t) return chip('Vencido ' + fd(d), 'crit');
  if (d <= addDays(t, 3)) return chip('Vence ' + fd(d), 'warn');
  return chip('Vence ' + fd(d), 'plain');
}
const catOpts = type => S.config.categories.filter(c => c.type === type || (c.group === 'perda' && type === 'out' && c.type === 'out')).filter(c => c.group !== 'venda').map(c => [c.id, c.name]);
function ledgerForm(e, preset = {}) {
  const isNew = !e;
  if (e && e.saleId) { saleDetail(e.saleId); return; }
  const locked = !!(e && e.purchaseId);
  const v0 = e ? { ...e, catOut: e.type === 'out' ? e.categoryId : 'aluguel', catIn: e.type === 'in' ? e.categoryId : 'outras_rec', st: e.status } : { type: preset.type || 'out', catOut: preset.categoryId && preset.type !== 'in' ? preset.categoryId : 'aluguel', catIn: 'outras_rec', date: today(), paidDate: today(), dueDate: today(), st: preset.pend ? 'pendente' : 'pago', amount: '', channelId: preset.channelId || '', ...preset };
  const grp = v => catOf(v.type === 'in' ? v.catIn : v.catOut).group;
  const fields = [
    { k: 'type', l: 'Tipo', t: 'seg', opts: [['out', 'Saída (despesa)'], ['in', 'Entrada']], show: () => isNew },
    { k: 'description', l: 'Descrição', req: 1, ph: 'Ex.: Conta de luz de outubro', show: () => !locked },
    { k: 'catOut', l: 'Categoria', t: 'select', opts: () => catOpts('out'), show: v => v.type === 'out' && !locked, half: 1 },
    { k: 'catIn', l: 'Categoria', t: 'select', opts: () => catOpts('in'), show: v => v.type === 'in' && !locked, half: 1 },
    { k: 'amount', l: 'Valor', t: 'money', req: 1, half: 1, show: () => !locked },
    { k: 'date', l: 'Data de competência', t: 'date', req: 1, half: 1, help: 'Mês a que a despesa pertence.', show: () => !locked },
    { k: 'st', l: 'Situação', t: 'seg', opts: [['pago', 'Já foi pago'], ['pendente', 'Ainda vai pagar']], half: 1 },
    { k: 'paidDate', l: 'Data do pagamento', t: 'date', half: 1, show: v => v.st === 'pago' },
    { k: 'dueDate', l: 'Vencimento', t: 'date', half: 1, show: v => v.st === 'pendente' },
    { k: 'methodId', l: 'Forma de pagamento', t: 'select', half: 1, opts: () => [['', 'Não informar']].concat(S.config.paymentMethods.map(p => [p.id, p.name])) },
    { k: 'employeeId', l: 'Funcionário', t: 'select', half: 1, opts: () => [['', 'Nenhum']].concat(S.employees.map(x => [x.id, x.name])), show: v => grp(v) === 'pessoal' || grp(v) === 'comissao' },
    { k: 'channelId', l: 'Canal de marketing', t: 'select', half: 1, opts: () => [['', 'Não informado']].concat(S.config.channels.map(x => [x.id, x.name])), show: v => grp(v) === 'marketing' },
    { k: 'campaign', l: 'Campanha', half: 1, list: () => [...new Set(S.ledger.map(x => x.campaign).filter(Boolean))], show: v => grp(v) === 'marketing' },
    { k: 'repeat', l: 'Repetir todo mês (conta fixa)', t: 'check', help: 'Cria automaticamente a conta dos próximos meses, no mesmo dia.', show: () => isNew },
    { k: 'notes', l: 'Observações', show: () => !locked },
  ];
  openForm({
    title: isNew ? (v0.type === 'in' ? 'Nova entrada' : 'Nova despesa') : (locked ? 'Pagamento da compra' : 'Editar lançamento'),
    intro: locked ? esc(e.description) + ' — ' + fm(e.amount) + '. Os valores vêm da compra.' : (isNew ? '' : (e.recId ? 'Este lançamento veio de uma conta fixa. Alterar aqui muda só este mês.' : '')),
    fields, values: v0,
    live: v => { const g = GROUPS[grp(v)]; return g && !locked ? '<p class="muted" style="font-size:13px">' + esc(g.h) + '</p>' : ''; },
    danger: !isNew && isAdmin() && !locked ? { l: 'Excluir', f: () => delLedger(e) } : null,
    onSubmit: v => {
      if (!locked && !(v.amount > 0)) return 'Informe um valor maior que zero.';
      const catId = v.type === 'in' ? v.catIn : v.catOut;
      const g = catOf(catId).group;
      const data = locked ? {} : { type: v.type, description: v.description, categoryId: catId, amount: r2(v.amount), date: v.date, methodId: v.methodId || null, employeeId: (g === 'pessoal' || g === 'comissao') ? v.employeeId || null : null, channelId: g === 'marketing' ? v.channelId || null : null, campaign: g === 'marketing' ? v.campaign || '' : '', notes: v.notes };
      Object.assign(data, { status: v.st, paidDate: v.st === 'pago' ? (v.paidDate || today()) : null, dueDate: v.st === 'pendente' ? (v.dueDate || v.date) : (v.paidDate || (locked ? e.dueDate : v.date)) });
      if (locked) data.dueDate = e.dueDate;
      if (isNew) {
        const ent = { id: uid(), createdAt: nowS(), ...data };
        if (v.repeat) {
          const rc = { id: uid(), type: v.type, description: v.description, categoryId: catId, amount: r2(v.amount), day: +v.date.slice(8), startMonth: monthKey(v.date), active: true, employeeId: data.employeeId, channelId: data.channelId, skip: [] };
          S.recurrences.push(rc); ent.recId = rc.id; ent.recMonth = monthKey(v.date);
        }
        S.ledger.push(ent);
        if (v.repeat) materializeRecurring(true);
        commit('criou', 'Lançamento', (v.type === 'in' ? 'Entrada ' : 'Saída ') + v.description + ' — ' + fm(v.amount) + (v.repeat ? ' (conta fixa mensal)' : ''), ent.id);
        toast(v.type === 'in' ? 'Entrada registrada' : 'Despesa registrada');
      } else {
        const before = e.status + '/' + e.amount;
        Object.assign(e, data);
        commit('editou', 'Lançamento', e.description + ' — ' + fm(e.amount) + (before !== e.status + '/' + e.amount ? ' (antes: ' + before.replace('/', ', R$ ') + ')' : ''), e.id);
        toast('Lançamento atualizado');
      }
      render();
    },
  });
}
async function delLedger(e) {
  const ok = await ask({ title: 'Excluir lançamento', text: 'Excluir <b>' + esc(e.description) + '</b> (' + fm(e.amount) + ')? A exclusão fica registrada no histórico.', ok: 'Excluir', danger: true });
  if (!ok) return false;
  if (e.recId) { const rc = S.recurrences.find(x => x.id === e.recId); if (rc) { rc.skip = rc.skip || []; rc.skip.push(e.recMonth); } }
  S.ledger = S.ledger.filter(x => x.id !== e.id);
  commit('excluiu', 'Lançamento', e.description + ' — ' + fm(e.amount), e.id);
  toast('Lançamento excluído'); render();
}
ACT.ledNew = el => ledgerForm(null, { type: el.dataset.t, pend: !!el.dataset.pend, categoryId: el.dataset.cat });
ACT.ledView = el => { const e = S.ledger.find(x => x.id === el.dataset.id); if (e) ledgerForm(e); };
ACT.ledPay = el => {
  const e = S.ledger.find(x => x.id === el.dataset.id); if (!e) return;
  openForm({
    title: (e.type === 'in' ? 'Receber: ' : 'Pagar: ') + e.description, size: 'sm', submit: e.type === 'in' ? 'Confirmar recebimento' : 'Confirmar pagamento',
    fields: [{ k: 'paidDate', l: e.type === 'in' ? 'Data do recebimento' : 'Data do pagamento', t: 'date', req: 1 }, { k: 'amount', l: 'Valor', t: 'money', req: 1, help: 'Altere se pagou com juros ou desconto.' }],
    values: { paidDate: today(), amount: e.amount },
    onSubmit: v => {
      const old = e.amount;
      e.status = 'pago'; e.paidDate = v.paidDate; e.amount = r2(v.amount || e.amount);
      commit(e.type === 'in' ? 'recebeu' : 'pagou', 'Lançamento', e.description + ' — ' + fm(e.amount) + (old !== e.amount ? ' (valor original ' + fm(old) + ')' : ''), e.id);
      toast(e.type === 'in' ? 'Recebimento registrado' : 'Pagamento registrado'); render();
    },
  });
};
function recForm(rc) {
  const isNew = !rc;
  const v0 = rc ? { ...rc, catOut: rc.type === 'out' ? rc.categoryId : 'aluguel', catIn: rc.type === 'in' ? rc.categoryId : 'outras_rec', start: rc.startMonth + '-' + pad(Math.min(rc.day, 28)) } : { type: 'out', catOut: 'aluguel', catIn: 'outras_rec', day: 5, start: today(), amount: '' };
  openForm({
    title: isNew ? 'Nova conta fixa' : 'Conta fixa', intro: 'O sistema cria a conta de cada mês automaticamente, como "a pagar". Você só marca como paga.',
    fields: [
      { k: 'type', l: 'Tipo', t: 'seg', opts: [['out', 'Saída'], ['in', 'Entrada']], show: () => isNew },
      { k: 'description', l: 'Descrição', req: 1, ph: 'Ex.: Aluguel da loja' },
      { k: 'catOut', l: 'Categoria', t: 'select', opts: () => catOpts('out'), show: v => v.type === 'out' },
      { k: 'catIn', l: 'Categoria', t: 'select', opts: () => catOpts('in'), show: v => v.type === 'in' },
      { k: 'amount', l: 'Valor mensal', t: 'money', req: 1, half: 1 },
      { k: 'day', l: 'Dia do vencimento', t: 'int', req: 1, half: 1 },
      { k: 'start', l: 'Começa no mês de', t: 'date', req: 1, show: () => isNew, half: 1 },
      { k: 'employeeId', l: 'Funcionário', t: 'select', half: 1, opts: () => [['', 'Nenhum']].concat(S.employees.map(x => [x.id, x.name])), show: v => catOf(v.type === 'in' ? v.catIn : v.catOut).group === 'pessoal' },
    ],
    values: v0,
    danger: !isNew && rc.active ? { l: 'Encerrar conta fixa', f: async () => { const ok = await ask({ title: 'Encerrar conta fixa', text: 'As contas futuras ainda não pagas de <b>' + esc(rc.description) + '</b> serão removidas. As já pagas continuam no histórico.', ok: 'Encerrar', danger: true }); if (!ok) return false; rc.active = false; rc.endMonth = monthKey(today()); const cm = monthKey(today()); S.ledger = S.ledger.filter(x => !(x.recId === rc.id && x.recMonth > cm && !paidDate(x))); commit('encerrou', 'Conta fixa', rc.description, rc.id); toast('Conta fixa encerrada'); render(); } } : null,
    onSubmit: v => {
      const day = clamp(Math.round(v.day || 1), 1, 31);
      if (!(v.amount > 0)) return 'Informe um valor maior que zero.';
      const catId = (rc ? rc.type : v.type) === 'in' ? v.catIn : v.catOut;
      if (isNew) {
        const n = { id: uid(), type: v.type, description: v.description, categoryId: catId, amount: r2(v.amount), day, startMonth: monthKey(v.start), active: true, employeeId: v.employeeId || null, skip: [] };
        S.recurrences.push(n); materializeRecurring(true);
        commit('criou', 'Conta fixa', n.description + ' — ' + fm(n.amount) + ' todo dia ' + day, n.id);
      } else {
        const cm = monthKey(today());
        Object.assign(rc, { description: v.description, categoryId: catId, amount: r2(v.amount), day, employeeId: v.employeeId || null });
        for (const x of S.ledger) if (x.recId === rc.id && x.recMonth >= cm && !paidDate(x)) { x.amount = rc.amount; x.description = rc.description; x.categoryId = catId; const last = +monthEnd(x.recMonth + '-01').slice(8); x.date = x.dueDate = x.recMonth + '-' + pad(Math.min(day, last)); }
        commit('editou', 'Conta fixa', rc.description + ' — ' + fm(rc.amount), rc.id);
      }
      toast('Conta fixa salva'); render();
    },
  });
}
ACT.recNew = () => recForm(null);
ACT.recEdit = el => { const rc = S.recurrences.find(x => x.id === el.dataset.id); if (rc) recForm(rc); };
ACT.exportLedger = () => {
  const r = curRange(); const rows = S.ledger.filter(e => inR(e.date, r));
  exportFile('lancamentos_' + r.from + '_' + r.to + '.csv', csv(rows, [['Data', e => fd(e.date)], ['Tipo', e => (e.type === 'in' ? 'Entrada' : 'Saída')], ['Descrição', e => e.description], ['Categoria', e => catName(e.categoryId)], ['Valor', e => e.amount], ['Situação', e => (paidDate(e) ? 'Pago' : 'Pendente')], ['Pago em', e => fd(paidDate(e))], ['Vencimento', e => fd(e.dueDate)]]), 'text/csv;charset=utf-8');
};

/* ---------- 3. Estoque ---------- */
function pgEstoque() {
  const r = curRange(), st = stockMetrics(r);
  const tab = curTab('est', 'prod');
  const adm = isAdmin();
  let h = pageHead('3 · Estoque', 'Estoque', 'Quantidade por produto, custo do estoque, giro e o que precisa ser reposto.', (adm ? '<button class="btn pri" data-act="prodNew">' + ic('plus', 'sm') + 'Novo produto</button><button class="btn" data-act="stockAdj">Entrada ou ajuste</button>' : '') + '<button class="btn" data-act="countNew">Contagem de estoque</button>' + (adm ? '<button class="btn" data-act="lossNew">Registrar perda</button>' : ''));
  h += kpis([
    { l: 'Quantidade disponível', v: fn(st.units) + ' un', s: plural(st.act.length, 'produto ativo', 'produtos ativos'), i: 'qtd' },
    { l: 'Custo total do estoque', v: fm(st.cost), s: 'Valor de venda ' + fm(st.saleValue), i: 'custoest', cls: 'hl' },
    { l: 'Giro de estoque', v: f1(st.giro).replace(',0', '') + 'x', s: 'no período · estoque médio ' + fm(st.avgStock), i: 'giro' },
    { l: 'Cobertura do estoque', v: isFinite(st.cover) ? fi(st.cover) + ' dias' : '—', s: 'no ritmo de vendas do período', i: 'cobertura' },
    { l: 'Estoque baixo ou zerado', v: fi(st.low.length + st.zero.length), s: fi(st.zero.length) + ' zerados · ' + fi(st.low.length) + ' baixos', i: 'baixo', cls: st.zero.length ? 'alert' : '' },
  ]);
  const need = st.zero.concat(st.low);
  if (need.length) {
    h += card('Produtos para repor', '<div class="tbl-wrap"><table class="rt"><thead><tr><th>Produto</th><th>Situação</th><th class="num">Estoque</th><th class="num">Mínimo</th><th>Fornecedor</th><th></th></tr></thead><tbody>' + need.slice(0, 30).map(p => '<tr><td class="main" data-l="Produto"><b>' + esc(p.name) + '</b></td><td data-l="Situação">' + (stockStatus(p) === 'zero' ? chip('Zerado', 'crit') : chip('Baixo', 'warn')) + '</td><td class="num" data-l="Estoque">' + fn(p.stock) + '</td><td class="num" data-l="Mínimo">' + fn(p.minStock) + '</td><td data-l="Fornecedor">' + esc(p.supplierId ? supName(p.supplierId) : '—') + '</td><td class="num" data-l="">' + (adm ? '<button class="btn sm" data-act="buyNew" data-p="' + p.id + '">Comprar</button>' : '') + '</td></tr>').join('') + '</tbody></table></div>', { i: 'baixo' });
  }
  h += tabs('est', [['prod', 'Produtos'], ['mov', 'Movimentações'], ['cont', 'Contagens']], tab);
  if (tab === 'prod') {
    const cat = UI.filters.estCat || '';
    const cats = [...new Set(S.products.map(p => p.category).filter(Boolean))].sort();
    let rows = S.products.slice();
    if (cat === '__inativos') rows = rows.filter(p => p.active === false); else { rows = rows.filter(p => p.active !== false); if (cat) rows = rows.filter(p => p.category === cat); }
    h += card('', table('prods', {
      rows, act: adm ? 'prodEdit' : null, sort: 'name', dir: 1, ph: 'Buscar produto ou código',
      text: p => p.name + ' ' + (p.sku || '') + ' ' + (p.category || ''),
      tools: '<select class="inp" style="max-width:220px;min-height:36px;padding:4px 10px" data-chg="filt" data-f="estCat" aria-label="Filtrar categoria"><option value="">Todas as categorias</option>' + cats.map(c => '<option' + (c === cat ? ' selected' : '') + '>' + esc(c) + '</option>').join('') + '<option value="__inativos"' + (cat === '__inativos' ? ' selected' : '') + '>Produtos desativados</option></select>' + (adm ? '<button class="btn sm" data-act="exportProducts">' + ic('download', 'sm') + 'Exportar</button>' : ''),
      empty: 'Nenhum produto cadastrado', emptyBtn: adm ? '<button class="btn sm pri" data-act="prodNew">Cadastrar produto</button>' : '',
      cols: [
        { k: 'name', l: 'Produto', f: p => '<b>' + esc(p.name) + '</b><small class="muted">' + esc([p.sku, p.category].filter(Boolean).join(' · ')) + '</small>', s: p => p.name.toLowerCase() },
        { k: 'st', l: 'Situação', f: p => { const s = stockStatus(p); return s === 'zero' ? chip('Zerado', 'crit') : s === 'baixo' ? chip('Baixo', 'warn') : chip('OK', 'good'); }, s: p => p.stock - p.minStock },
        { k: 'stock', l: 'Estoque', num: 1, f: p => '<b>' + fn(p.stock) + '</b> ' + esc(p.unit || 'un'), s: p => p.stock },
        { k: 'cost', l: 'Custo', num: 1, f: p => fm(p.cost), s: p => p.cost },
        { k: 'price', l: 'Preço', num: 1, f: p => fm(p.price), s: p => p.price },
        { k: 'val', l: 'Valor em estoque', num: 1, f: p => fm(Math.max(0, p.stock) * p.cost), s: p => p.stock * p.cost },
      ],
    }));
  } else if (tab === 'mov') {
    const rows = S.moves.filter(m => inR(m.date, r)).sort((a, b) => (a.date < b.date ? 1 : -1));
    const TL = { inicial: 'Estoque inicial', compra: 'Compra recebida', venda: 'Venda', devolucao: 'Devolução / cancelamento', ajuste: 'Ajuste manual', entrada: 'Entrada manual', perda: 'Perda', inventario: 'Ajuste de contagem' };
    h += card('Movimentações do período', table('moves', {
      rows, ph: 'Buscar produto ou tipo', text: m => prodName(m.productId) + ' ' + (TL[m.type] || m.type) + ' ' + m.note + ' ' + m.user,
      empty: 'Nenhuma movimentação no período',
      cols: [
        { k: 'p', l: 'Produto', f: m => '<b>' + esc(prodName(m.productId)) + '</b><small class="muted">' + fdt(m.date) + '</small>', s: m => m.date },
        { k: 't', l: 'Tipo', f: m => esc(TL[m.type] || m.type), s: m => m.type },
        { k: 'n', l: 'Detalhe', f: m => esc(m.note || '—') },
        { k: 'u', l: 'Usuário', f: m => esc(m.user || '') },
        { k: 'q', l: 'Qtd.', num: 1, f: m => '<b class="' + (m.qty > 0 ? 'pos' : 'neg') + '">' + (m.qty > 0 ? '+' : '') + fn(m.qty) + '</b>', s: m => m.qty },
      ],
    }));
  } else {
    const rows = S.counts.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    h += card('Contagens de estoque', table('counts', {
      rows, act: 'countView', search: false, empty: 'Nenhuma contagem feita', emptySub: 'Conte os produtos da prateleira e compare com o sistema para achar divergências.', emptyBtn: '<button class="btn sm pri" data-act="countNew">Fazer contagem</button>',
      cols: [
        { k: 'd', l: 'Data', f: c => '<b>' + fdt(c.date) + '</b><small class="muted">' + esc(c.user) + '</small>' },
        { k: 'i', l: 'Itens contados', num: 1, f: c => fi(c.items.length) },
        { k: 'dv', l: 'Com divergência', num: 1, f: c => fi(c.items.filter(i => i.countedQty !== i.systemQty).length) },
        { k: 'a', l: 'Ajuste', f: c => c.applied ? chip('Aplicado', 'good') : chip('Só conferência', 'plain') },
        { k: 'v', l: 'Diferença (custo)', num: 1, f: c => { const v = sum(c.items, i => (i.countedQty - i.systemQty) * (i.unitCost || 0)); return '<b class="' + moneyCls(v) + '">' + fm(v) + '</b>'; } },
      ],
    }), { i: 'divest' });
  }
  return h;
}
function productForm(p, onSaved) {
  const isNew = !p;
  const cats = [...new Set(S.products.map(x => x.category).filter(Boolean))].sort();
  const ctx = pricingCtx();
  openForm({
    title: isNew ? 'Novo produto' : 'Editar produto',
    fields: [
      { k: 'name', l: 'Nome do produto', req: 1, ph: 'Ex.: Camiseta básica preta M' },
      { k: 'sku', l: 'Código / código de barras', half: 1 },
      { k: 'category', l: 'Categoria', half: 1, list: cats },
      { k: 'cost', l: 'Custo de compra (unidade)', t: 'money', req: 1, half: 1 },
      { k: 'extraCost', l: 'Outros custos por unidade', t: 'money', half: 1, help: 'Embalagem, etiqueta, frete da compra.' },
      { k: 'price', l: 'Preço de venda', t: 'money', req: 1, half: 1 },
      { k: 'unit', l: 'Unidade', t: 'select', half: 1, opts: [['un', 'Unidade'], ['par', 'Par'], ['kg', 'Quilo'], ['g', 'Grama'], ['m', 'Metro'], ['l', 'Litro'], ['cx', 'Caixa'], ['pct', 'Pacote'], ['kit', 'Kit']] },
      { k: 'stock', l: 'Estoque atual', t: 'num', half: 1, show: () => isNew, help: 'Quantidade que você tem hoje.' },
      { k: 'minStock', l: 'Estoque mínimo', t: 'num', half: 1, help: 'Abaixo disso o produto aparece para repor.' },
      { k: 'supplierId', l: 'Fornecedor principal', t: 'select', half: 1, opts: () => [['', 'Nenhum']].concat(S.suppliers.map(s => [s.id, s.name])) },
      { k: 'active', l: 'Produto ativo (aparece na venda)', t: 'check', show: () => !isNew },
    ],
    values: p ? { ...p } : { unit: 'un', minStock: S.config.lowStockDefault, stock: 0, active: true, extraCost: 0 },
    live: v => { if (!(v.price > 0)) return ''; const x = priceRow({ cost: v.cost, extraCost: v.extraCost, price: v.price }, ctx); return '<div class="preview"><div><span>Custo total</span><b>' + fm(x.unit) + '</b></div><div><span>Margem de contribuição</span><b class="' + moneyCls(x.mc) + '">' + fm(x.mc) + ' (' + fp(x.mcPct, 0) + ')</b></div><div><span>Preço mínimo sustentável</span><b>' + (isFinite(x.min) ? fm(x.min) : '—') + '</b></div><div><span>Preço sugerido</span><b>' + (isFinite(x.sug) ? fm(x.sug) : '—') + '</b></div></div>' + (x.status === 'crit' ? '<p class="neg" style="font-size:13px;margin-top:6px">O preço está abaixo do mínimo sustentável: este produto dá prejuízo.</p>' : ''); },
    danger: !isNew ? { l: 'Excluir', f: async () => { const used = S.sales.some(s => s.items.some(i => i.productId === p.id)) || S.purchases.some(x => x.items.some(i => i.productId === p.id)); if (used) { p.active = false; commit('desativou', 'Produto', p.name, p.id); toast('O produto tem histórico e foi desativado'); render(); return; } const ok = await ask({ title: 'Excluir produto', text: 'Excluir <b>' + esc(p.name) + '</b>?', ok: 'Excluir', danger: true }); if (!ok) return false; S.products = S.products.filter(x => x.id !== p.id); S.moves = S.moves.filter(m => m.productId !== p.id); commit('excluiu', 'Produto', p.name, p.id); toast('Produto excluído'); render(); } } : null,
    onSubmit: v => {
      if (!(v.price > 0)) return 'Informe o preço de venda.';
      if (v.sku && S.products.some(x => x.sku && x.sku === v.sku && (!p || x.id !== p.id))) return 'Já existe um produto com este código.';
      if (isNew) {
        const n = { id: uid(), name: v.name, sku: v.sku, category: v.category, cost: r2(v.cost), extraCost: r2(v.extraCost), price: r2(v.price), unit: v.unit, stock: 0, minStock: +v.minStock || 0, supplierId: v.supplierId || null, active: true, createdAt: nowS() };
        S.products.push(n); invalidate();
        if (v.stock) addMove(n.id, +v.stock, 'inicial', null, n.cost, 'Estoque inicial');
        commit('criou', 'Produto', n.name + ' — custo ' + fm(n.cost) + ', preço ' + fm(n.price) + ', estoque ' + fn(v.stock || 0), n.id);
        toast('Produto cadastrado'); if (onSaved) onSaved(n);
      } else {
        const ch = [];
        if (r2(v.price) !== p.price) ch.push('preço ' + fm(p.price) + ' → ' + fm(v.price));
        if (r2(v.cost) !== p.cost) ch.push('custo ' + fm(p.cost) + ' → ' + fm(v.cost));
        if (v.active !== (p.active !== false)) ch.push(v.active ? 'reativado' : 'desativado');
        Object.assign(p, { name: v.name, sku: v.sku, category: v.category, cost: r2(v.cost), extraCost: r2(v.extraCost), price: r2(v.price), unit: v.unit, minStock: +v.minStock || 0, supplierId: v.supplierId || null, active: v.active });
        commit('editou', 'Produto', p.name + (ch.length ? ' — ' + ch.join('; ') : ''), p.id);
        toast('Produto atualizado');
      }
      render();
    },
  });
}
ACT.prodNew = () => productForm(null);
ACT.prodEdit = el => { const p = ix().prod.get(el.dataset.id); if (p) productForm(p); };
const prodOpts = (blank) => (blank ? [['', blank]] : []).concat(S.products.filter(p => p.active !== false).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(p => [p.id, p.name + ' (' + fn(p.stock) + ')']));
ACT.stockAdj = el => {
  if (!S.products.length) { toast('Cadastre um produto primeiro.', 'err'); return; }
  openForm({
    title: 'Entrada ou ajuste de estoque', intro: 'Para compras de fornecedor use <b>Fornecedores › Nova compra</b>: ela também registra o pagamento.',
    fields: [
      { k: 'productId', l: 'Produto', t: 'select', req: 1, opts: () => prodOpts() },
      { k: 'kind', l: 'O que aconteceu', t: 'seg', opts: [['entrada', 'Entrada'], ['saida', 'Saída'], ['definir', 'Corrigir quantidade']] },
      { k: 'qty', l: 'Quantidade', t: 'num', req: 1, half: 1, help: 'Em "Corrigir", informe a quantidade certa.' },
      { k: 'cost', l: 'Custo unitário', t: 'money', half: 1, show: v => v.kind === 'entrada', help: 'Atualiza o custo médio do produto.' },
      { k: 'note', l: 'Motivo', req: 1, ph: 'Ex.: devolução ao fornecedor, brinde, correção' },
    ],
    values: { productId: el.dataset.p || '', kind: 'entrada' },
    onChange: (v, frm) => { const p = ix().prod.get(v.productId); const c = frm.elements.cost; if (p && c && !c.dataset.touched) c.value = toInput(p.cost); if (c && !c._b) { c._b = 1; c.addEventListener('input', () => { c.dataset.touched = 1; }); } },
    onSubmit: v => {
      const p = ix().prod.get(v.productId); if (!p) return 'Escolha o produto.';
      const q = +v.qty || 0;
      let delta = v.kind === 'entrada' ? q : v.kind === 'saida' ? -q : r2(q - (p.stock || 0));
      if (v.kind !== 'definir' && !(q > 0)) return 'Informe uma quantidade maior que zero.';
      if (!delta) return 'A quantidade informada é igual à do sistema.';
      if (v.kind === 'entrada' && v.cost > 0) { const old = Math.max(0, p.stock || 0); p.cost = r2((old * p.cost + q * v.cost) / (old + q)); }
      addMove(p.id, delta, v.kind === 'entrada' ? 'entrada' : 'ajuste', null, v.kind === 'entrada' ? v.cost : p.cost, v.note);
      commit('ajustou', 'Estoque', p.name + ': ' + (delta > 0 ? '+' : '') + fn(delta) + ' (' + v.note + ')', p.id);
      toast('Estoque atualizado'); render();
    },
  });
};
ACT.countNew = () => {
  const prods = S.products.filter(p => p.active !== false).sort((a, b) => (a.category || '').localeCompare(b.category || '', 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR'));
  if (!prods.length) { toast('Cadastre produtos primeiro.', 'err'); return; }
  const m = modal({
    title: 'Contagem de estoque', size: 'lg',
    body: '<p class="ink2" style="margin-bottom:12px">Conte o que está na prateleira e digite a quantidade. Deixe em branco o que não contou.</p><label class="search" style="max-width:none;margin-bottom:10px">' + ic('search', 'sm') + '<input type="search" id="cnt-q" placeholder="Filtrar produtos"></label><div class="tbl-wrap"><table class="rt"><thead><tr><th>Produto</th><th class="num">No sistema</th><th class="num">Contado</th></tr></thead><tbody>' + prods.map(p => '<tr data-name="' + esc((p.name + ' ' + (p.sku || '') + ' ' + (p.category || '')).toLowerCase()) + '"><td class="main" data-l="Produto"><b>' + esc(p.name) + '</b><small class="muted">' + esc(p.category || '') + '</small></td><td class="num" data-l="No sistema">' + fn(p.stock) + '</td><td class="num" data-l="Contado"><input class="inp" style="width:90px;min-height:34px;text-align:right" inputmode="decimal" data-cnt="' + p.id + '" aria-label="Quantidade contada de ' + esc(p.name) + '"></td></tr>').join('') + '</tbody></table></div>' + (isAdmin() ? '<label class="ck" style="margin-top:14px"><input type="checkbox" id="cnt-apply" checked><span>Corrigir o estoque do sistema para as quantidades contadas</span></label>' : '<p class="muted" style="margin-top:12px">A contagem fica registrada para o administrador conferir.</p>'),
    foot: '<span class="sp"></span><button type="button" class="btn" data-close>Cancelar</button><button type="button" class="btn pri" id="cnt-ok">Salvar contagem</button>',
  });
  $('#cnt-q', m.el).addEventListener('input', e => { const q = e.target.value.toLowerCase(); for (const tr of $$('tbody tr', m.el)) tr.hidden = q && !tr.dataset.name.includes(q); });
  $('#cnt-ok', m.el).onclick = () => {
    const items = [];
    for (const inp of $$('[data-cnt]', m.el)) { if (inp.value.trim() === '') continue; const p = ix().prod.get(inp.dataset.cnt); items.push({ productId: p.id, name: p.name, systemQty: p.stock || 0, countedQty: parseNum(inp.value), unitCost: p.cost }); }
    if (!items.length) { toast('Informe pelo menos uma quantidade.', 'err'); return; }
    const apply = isAdmin() && $('#cnt-apply', m.el)?.checked;
    const ct = { id: uid(), date: nowS(), user: CUR.name, items, applied: !!apply };
    S.counts.push(ct);
    if (apply) for (const it of items) { const d = r2(it.countedQty - it.systemQty); if (d) addMove(it.productId, d, 'inventario', ct.id, it.unitCost, 'Contagem de ' + fd(ct.date)); }
    const div2 = items.filter(i => i.countedQty !== i.systemQty);
    commit('registrou', 'Contagem de estoque', plural(items.length, 'item contado', 'itens contados') + ', ' + plural(div2.length, 'divergência', 'divergências') + ' (' + fm(sum(div2, i => (i.countedQty - i.systemQty) * i.unitCost)) + ')' + (apply ? ', estoque corrigido' : ''), ct.id);
    m.close(); toast('Contagem salva'); UI.tabs.est = 'cont'; render();
  };
};
ACT.countView = el => {
  const c = S.counts.find(x => x.id === el.dataset.id); if (!c) return;
  const rows = c.items.slice().sort((a, b) => Math.abs((b.countedQty - b.systemQty) * b.unitCost) - Math.abs((a.countedQty - a.systemQty) * a.unitCost));
  modal({ title: 'Contagem de ' + fdt(c.date), size: 'lg', body: '<p class="ink2" style="margin-bottom:10px">Feita por ' + esc(c.user) + '. ' + (c.applied ? 'O estoque foi corrigido.' : 'Somente conferência, sem correção.') + '</p><div class="tbl-wrap"><table class="rt"><thead><tr><th>Produto</th><th class="num">Sistema</th><th class="num">Contado</th><th class="num">Diferença</th><th class="num">Valor</th></tr></thead><tbody>' + rows.map(i => { const d = i.countedQty - i.systemQty; return '<tr><td class="main" data-l="Produto"><b>' + esc(i.name || prodName(i.productId)) + '</b></td><td class="num" data-l="Sistema">' + fn(i.systemQty) + '</td><td class="num" data-l="Contado">' + fn(i.countedQty) + '</td><td class="num" data-l="Diferença"><b class="' + moneyCls(d) + '">' + (d > 0 ? '+' : '') + fn(d) + '</b></td><td class="num" data-l="Valor">' + fm(d * i.unitCost) + '</td></tr>'; }).join('') + '</tbody></table></div>' });
};
const LOSS_TYPES = [['furto', 'Furto'], ['fraude', 'Fraude / golpe'], ['erro', 'Erro operacional'], ['avaria', 'Avaria / quebra'], ['vencimento', 'Vencimento / validade'], ['outro', 'Outro']];
const lossName = t => (LOSS_TYPES.find(x => x[0] === t) || [, 'Outro'])[1];
ACT.lossNew = () => {
  openForm({
    title: 'Registrar perda', intro: 'Faltas no fechamento do caixa já são calculadas automaticamente. Não registre aqui.',
    fields: [
      { k: 'type', l: 'Tipo de perda', t: 'select', opts: LOSS_TYPES, half: 1 },
      { k: 'date', l: 'Data', t: 'date', req: 1, half: 1 },
      { k: 'productId', l: 'Produto perdido', t: 'select', opts: () => prodOpts('Nenhum (perda em dinheiro)') },
      { k: 'qty', l: 'Quantidade', t: 'num', half: 1, show: v => !!v.productId },
      { k: 'amount', l: 'Valor da perda', t: 'money', half: 1, help: 'Com produto, deixe em branco para usar o custo.' },
      { k: 'deduct', l: 'Descontar do saldo financeiro (o dinheiro saiu ou deixou de entrar)', t: 'check', show: v => !v.productId },
      { k: 'description', l: 'O que aconteceu', t: 'textarea', req: 1 },
    ],
    values: { type: 'furto', date: today(), qty: 1, deduct: true },
    onSubmit: v => {
      const p = v.productId ? ix().prod.get(v.productId) : null;
      if (p && !(v.qty > 0)) return 'Informe a quantidade.';
      const amount = r2(v.amount || (p ? v.qty * p.cost : 0));
      if (!(amount > 0)) return 'Informe o valor da perda.';
      const l = { id: uid(), date: v.date, type: v.type, productId: p ? p.id : null, qty: p ? +v.qty : 0, amount, description: v.description, user: CUR.name, createdAt: nowS() };
      S.losses.push(l);
      if (p) addMove(p.id, -l.qty, 'perda', l.id, p.cost, lossName(v.type) + ': ' + v.description);
      else if (v.deduct) S.ledger.push({ id: uid(), type: 'out', date: v.date, amount, categoryId: 'perda', description: lossName(v.type) + ': ' + v.description, status: 'pago', paidDate: v.date, dueDate: v.date, lossId: l.id, createdAt: nowS() });
      commit('registrou', 'Perda', lossName(v.type) + ' — ' + fm(amount) + (p ? ' (' + fn(l.qty) + 'x ' + p.name + ')' : '') + ': ' + v.description, l.id);
      toast('Perda registrada'); render();
    },
  });
};
ACT.exportProducts = () => exportFile('produtos.csv', csv(S.products, [['Código', p => p.sku], ['Produto', p => p.name], ['Categoria', p => p.category], ['Estoque', p => p.stock], ['Mínimo', p => p.minStock], ['Custo', p => p.cost], ['Outros custos', p => p.extraCost], ['Preço', p => p.price], ['Ativo', p => (p.active === false ? 'Não' : 'Sim')]]), 'text/csv;charset=utf-8');

/* ---------- 4. Clientes e relacionamento ---------- */
const SEG = { ativo: ['Ativo', 'good'], novo: ['Novo', 'info'], risco: ['Em risco', 'warn'], inativo: ['Inativo', 'plain'], sem: ['Sem compras', 'plain'] };
function pgClientes() {
  const r = curRange(), cm = custMetrics(r), cp = custMetrics(prevRange(r, UI.period.id));
  const mk = mktMetrics(r);
  const ltvCac = mk.cac > 0 ? cm.ltvProfit / mk.cac : 0;
  let h = pageHead('4 · Clientes e relacionamento', 'Clientes', 'Quem compra, quem volta e quanto cada cliente vale para a loja.', '<button class="btn pri" data-act="custNew">' + ic('plus', 'sm') + 'Novo cliente</button>');
  h += kpis([
    { l: 'Clientes ativos', v: fi(cm.active), d: delta(cm.active, cp.active), s: 'Compraram nos últimos ' + (S.config.activeDays || 90) + ' dias', i: 'ativos', cls: 'hl' },
    { l: 'Taxa de recompra', v: fp(cm.repurchase), s: fi(cm.repeaters) + ' de ' + fi(cm.buyers) + ' clientes voltaram', i: 'recompra' },
    { l: 'Ticket médio por cliente', v: fm(cm.ticketCli), d: delta(cm.ticketCli, cp.ticketCli), s: f1(cm.freq) + ' compras por cliente no período', i: 'ticketcli' },
    { l: 'Lifetime Value (LTV)', v: fm(cm.ltv), s: 'Em lucro: ' + fm(cm.ltvProfit) + (ltvCac ? ' · ' + f1(ltvCac) + 'x o CAC' : ''), i: 'ltv' },
    { l: 'Novos clientes', v: fi(cm.newC), d: delta(cm.newC, cp.newC), s: fi(cm.returning) + ' clientes antigos compraram de novo', i: 'novos' },
  ]);
  if (cm.identPct < 0.5 && salesIn(r).length > 5) h += '<div class="banner"><p>Apenas ' + fp(cm.identPct, 0) + ' das vendas do período têm cliente identificado. Identifique o cliente na venda para medir recompra e LTV com precisão.</p></div>';
  const bk = buckets(r);
  const sr = salesIn(r).filter(s => s.customerId);
  const st = ix().custStats;
  const isNewSale = s => { const cs = st.get(s.customerId); return cs && cs.first === s.date; };
  h += card('Clientes novos e recorrentes por ' + bk.kind, chart({ type: 'bar', labels: bk.keys, series: [{ name: 'Novos', values: seriesOf(bk, sr.filter(isNewSale), s => s.date), c: '--s1' }, { name: 'Recorrentes', values: seriesOf(bk, sr.filter(s => !isNewSale(s)), s => s.date), c: '--s3' }], h: 200, xf: bk.label, xt: bk.title, yf: v => fi(v), vf: v => plural(v, 'venda', 'vendas') }), { sub: 'Número de vendas para clientes na primeira compra e para quem já tinha comprado.' });
  const seg = UI.filters.cliSeg || 'todos';
  const all = customerRows();
  const counts = { todos: all.length, ativo: 0, novo: 0, risco: 0, inativo: 0, vip: 0 };
  for (const x of all) { if (counts[x.seg] !== undefined) counts[x.seg]++; if (x.vip) counts.vip++; }
  const rows = seg === 'todos' ? all : seg === 'vip' ? all.filter(x => x.vip) : all.filter(x => x.seg === seg);
  h += card('Carteira de clientes', '<div class="chips-f" style="margin-bottom:10px">' + [['todos', 'Todos'], ['ativo', 'Ativos'], ['novo', 'Novos'], ['risco', 'Em risco'], ['inativo', 'Inativos'], ['vip', 'Top 10%']].map(([k, l]) => '<button class="' + (seg === k ? 'on' : '') + '" data-act="filt" data-f="cliSeg" data-v="' + k + '">' + l + ' <span class="muted">' + fi(counts[k]) + '</span></button>').join('') + '</div>' + (seg === 'risco' ? '<p class="note" style="margin-bottom:10px">Clientes que compraram mais de uma vez e sumiram. Chame no WhatsApp com uma novidade ou cupom.</p>' : '') + table('custs', {
    rows, act: 'custView', sort: 'total', ph: 'Nome ou telefone',
    text: c => c.name + ' ' + (c.phone || '') + ' ' + (c.email || ''),
    empty: 'Nenhum cliente nesta lista', emptyBtn: seg === 'todos' ? '<button class="btn sm pri" data-act="custNew">Cadastrar cliente</button>' : '',
    cols: [
      { k: 'name', l: 'Cliente', f: c => '<b>' + esc(c.name) + (c.vip ? ' <span class="tag">TOP</span>' : '') + '</b><small class="muted">' + esc(c.phone || chName(c.channelId)) + '</small>', s: c => c.name.toLowerCase() },
      { k: 'seg', l: 'Situação', f: c => chip(SEG[c.seg][0], SEG[c.seg][1]), s: c => c.seg },
      { k: 'count', l: 'Compras', num: 1, f: c => fi(c.count), s: c => c.count },
      { k: 'last', l: 'Última compra', f: c => (c.last ? ago(c.last) : '—'), s: c => c.last || '' },
      { k: 'total', l: 'Total gasto', num: 1, f: c => '<b>' + fm(c.total) + '</b>', s: c => c.total },
    ],
  }));
  return h;
}
function customerForm(c, onSaved, preset = {}) {
  const isNew = !c;
  openForm({
    title: isNew ? 'Novo cliente' : 'Editar cliente',
    fields: [
      { k: 'name', l: 'Nome', req: 1 },
      { k: 'phone', l: 'WhatsApp / telefone', half: 1, inputmode: 'tel', ph: '(11) 91234-5678' },
      { k: 'email', l: 'E-mail', half: 1, inputmode: 'email' },
      { k: 'channelId', l: 'Como conheceu a loja', t: 'select', half: 1, opts: () => S.config.channels.map(x => [x.id, x.name]) },
      { k: 'birth', l: 'Aniversário', t: 'date', half: 1 },
      { k: 'doc', l: 'CPF', half: 1 },
      { k: 'city', l: 'Cidade / bairro', half: 1 },
      { k: 'notes', l: 'Observações', t: 'textarea', ph: 'Preferências, tamanho, gostos…' },
    ],
    values: c ? { ...c } : { channelId: 'loja', ...preset },
    danger: !isNew && isAdmin() ? { l: 'Excluir', f: async () => { const ok = await ask({ title: 'Excluir cliente', text: 'Excluir <b>' + esc(c.name) + '</b>? As vendas continuam registradas como "cliente removido".', ok: 'Excluir', danger: true }); if (!ok) return false; S.customers = S.customers.filter(x => x.id !== c.id); commit('excluiu', 'Cliente', c.name, c.id); toast('Cliente excluído'); render(); } } : null,
    onSubmit: v => {
      const ph = (v.phone || '').replace(/\D/g, '');
      if (ph.length >= 8 && S.customers.some(x => (!c || x.id !== c.id) && (x.phone || '').replace(/\D/g, '') === ph)) return 'Já existe um cliente com este telefone.';
      const data = { name: v.name, phone: v.phone, email: v.email, channelId: v.channelId, birth: v.birth, doc: v.doc, city: v.city, notes: v.notes };
      if (isNew) { const n = { id: uid(), createdAt: nowS(), ...data }; S.customers.push(n); commit('criou', 'Cliente', n.name, n.id); toast('Cliente cadastrado'); if (onSaved) onSaved(n); else render(); }
      else { Object.assign(c, data); commit('editou', 'Cliente', c.name, c.id); toast('Cliente atualizado'); render(); }
    },
  });
}
ACT.custNew = () => customerForm(null);
ACT.custView = el => {
  const c = ix().cust.get(el.dataset.id); if (!c) return;
  const sales = S.sales.filter(s => s.customerId === c.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const ok = sales.filter(s => s.status !== 'cancelada');
  const rv = S.reviews.filter(x => x.customerId === c.id), cp = S.complaints.filter(x => x.customerId === c.id);
  const ph = (c.phone || '').replace(/\D/g, '');
  const wa = ph.length >= 10 ? 'https://wa.me/' + (ph.length <= 11 ? '55' : '') + ph : '';
  const fav = [...groupBy(ok.flatMap(s => s.items), i => i.name)].map(([k, v]) => [k, sum(v, i => i.qty)]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const m = modal({
    title: c.name, size: 'lg',
    body: '<div class="kv"><div><span>Telefone</span><b>' + esc(c.phone || '—') + '</b></div><div><span>E-mail</span><b>' + esc(c.email || '—') + '</b></div><div><span>Origem</span><b>' + esc(chName(c.channelId)) + '</b></div><div><span>Aniversário</span><b>' + (c.birth ? fd(c.birth).slice(0, 5) : '—') + '</b></div><div><span>Compras</span><b>' + fi(ok.length) + '</b></div><div><span>Total gasto</span><b>' + fm(sum(ok, s => s.total)) + '</b></div><div><span>Ticket médio</span><b>' + fm(div(sum(ok, s => s.total), ok.length)) + '</b></div><div><span>Cliente desde</span><b>' + (ok.length ? fd(ok[ok.length - 1].date) : '—') + '</b></div></div>' +
      (fav.length ? '<p class="ink2" style="margin-bottom:10px">Mais comprados: ' + fav.map(f => esc(f[0]) + ' (' + fn(f[1]) + ')').join(', ') + '</p>' : '') + (c.notes ? '<div class="note" style="margin-bottom:10px">' + esc(c.notes) + '</div>' : '') +
      (rv.length || cp.length ? '<p style="margin-bottom:10px">' + (rv.length ? 'Nota média ' + stars(avg(rv.map(x => x.rating))) + ' · ' : '') + plural(cp.length, 'reclamação', 'reclamações') + '</p>' : '') +
      (sales.length ? '<div class="tbl-wrap"><table class="rt"><thead><tr><th>Venda</th><th>Itens</th><th class="num">Total</th></tr></thead><tbody>' + sales.slice(0, 30).map(s => '<tr class="click" data-act="saleView" data-id="' + s.id + '"><td class="main" data-l="Venda"><b class="mono">#' + s.number + '</b><small class="muted">' + fdt(s.date) + (s.status === 'cancelada' ? ' · cancelada' : '') + '</small></td><td data-l="Itens">' + esc(s.items.map(i => i.qty + 'x ' + i.name).join(', ')) + '</td><td class="num" data-l="Total">' + fm(s.total) + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">Nenhuma compra ainda.</p>'),
    foot: (wa ? '<a class="btn sm" href="' + wa + '" target="_blank" rel="noopener">' + ic('chat', 'sm') + 'Chamar no WhatsApp</a>' : '') + '<button type="button" class="btn sm" data-act="reviewNew" data-cust="' + c.id + '">' + ic('star', 'sm') + 'Avaliação</button><button type="button" class="btn sm" data-act="complaintNew" data-cust="' + c.id + '">Reclamação</button><span class="sp"></span><button type="button" class="btn sm pri" data-act="custEdit" data-id="' + c.id + '">' + ic('edit', 'sm') + 'Editar</button>',
  });
  m.el.addEventListener('click', e => { if (e.target.closest('[data-act]')) m.close(); });
};
ACT.custEdit = el => { const c = ix().cust.get(el.dataset.id); if (c) customerForm(c); };

/* ---------- 5. Marketing e publicidade ---------- */
function pgMarketing() {
  const r = curRange(), k = mktMetrics(r), kp = mktMetrics(prevRange(r, UI.period.id));
  const cm = custMetrics(r);
  let h = pageHead('5 · Marketing e publicidade', 'Marketing', 'Quanto você investe, quanto custa cada cliente novo e quanto cada canal traz de volta.', '<button class="btn pri" data-act="mktNew">' + ic('plus', 'sm') + 'Registrar investimento</button>');
  h += kpis([
    { l: 'Investimento total em marketing', v: fm(k.invest), d: delta(k.invest, kp.invest, false), s: plural(k.ents.length, 'lançamento', 'lançamentos'), i: 'invmkt' },
    { l: 'Custo de aquisição de clientes (CAC)', v: k.newC ? fm(k.cac) : '—', d: k.newC && kp.newC ? delta(k.cac, kp.cac, false) : '', s: plural(k.newC, 'cliente novo', 'clientes novos'), i: 'cac' },
    { l: 'Retorno sobre gasto em anúncios (ROAS)', v: k.invest ? f1(k.roas).replace(',0', '') + 'x' : '—', d: k.invest && kp.invest ? delta(k.roas, kp.roas) : '', s: 'Vendas de canais pagos: ' + fm(k.paidRev), i: 'roas', cls: 'hl' },
    { l: 'ROI de marketing', v: k.invest ? fp(k.roi, 0) : '—', s: 'LTV ÷ CAC: ' + (k.cac ? f1(cm.ltvProfit / k.cac) + 'x' : '—'), i: 'roimkt' },
  ]);
  h += '<div class="grid2">' + card('Receita gerada por canal de aquisição', hbars(k.rows.filter(x => x.rev > 0).map(x => ({ l: x.name, v: x.rev, sub: fp(div(x.rev, calc(r).revenue), 0) }))), { i: 'receitacanal' }) +
    card('Investimento por canal', hbars(k.rows.filter(x => x.spend > 0).sort((a, b) => b.spend - a.spend).map(x => ({ l: x.name, v: x.spend, c: '--s2' })), fm, { empty: 'Nenhum investimento no período' })) + '</div>';
  h += card('Desempenho por canal', table('mkch', {
    rows: k.rows.filter(x => x.rev > 0 || x.spend > 0), search: false, sort: 'rev',
    cols: [
      { k: 'name', l: 'Canal', f: x => '<b>' + esc(x.name) + '</b>', s: x => x.name },
      { k: 'spend', l: 'Investido', num: 1, f: x => fm(x.spend), s: x => x.spend },
      { k: 'count', l: 'Vendas', num: 1, f: x => fi(x.count), s: x => x.count },
      { k: 'rev', l: 'Receita', num: 1, f: x => '<b>' + fm(x.rev) + '</b>', s: x => x.rev },
      { k: 'newC', l: 'Clientes novos', num: 1, f: x => fi(x.newC), s: x => x.newC },
      { k: 'cac', l: 'CAC', num: 1, f: x => (x.spend && x.newC ? fm(x.cac) : '—'), s: x => x.cac },
      { k: 'roas', l: 'ROAS', num: 1, f: x => (x.spend ? chip(f1(x.roas).replace(',0', '') + 'x', x.roas >= 4 ? 'good' : x.roas >= 2.5 ? 'warn' : 'crit') : '<span class="muted">orgânico</span>'), s: x => x.roas },
    ],
  }), { i: 'roas', sub: 'ROAS acima de 4x é bom. Entre 2,5x e 4x, acompanhe. Abaixo disso, o anúncio pode dar prejuízo.' });
  const camp = [...k.campaigns].map(([n, v]) => ({ l: n, v: sum(v, e => e.amount), sub: plural(v.length, 'lançamento', 'lançamentos') })).sort((a, b) => b.v - a.v);
  h += '<div class="grid2">' + card('Investimento por campanha', hbars(camp, fm, { empty: 'Nenhuma campanha no período' })) + card('Lançamentos de marketing', table('mkents', {
    rows: k.ents.slice().sort((a, b) => (a.date < b.date ? 1 : -1)), act: 'ledView', search: false, limit: 12,
    empty: 'Nenhum investimento registrado', emptyBtn: '<button class="btn sm pri" data-act="mktNew">Registrar investimento</button>',
    cols: [{ k: 'd', l: 'Lançamento', f: e => '<b>' + esc(e.campaign || e.description) + '</b><small class="muted">' + fd(e.date) + ' · ' + esc(chName(e.channelId)) + '</small>' }, { k: 'v', l: 'Valor', num: 1, f: e => fm(e.amount) }],
  })) + '</div>';
  return h;
}
ACT.mktNew = () => {
  openForm({
    title: 'Registrar investimento em marketing', intro: 'Informe o canal para o sistema calcular o ROAS e o CAC de cada um. Nas vendas, informe por onde o cliente chegou.',
    fields: [
      { k: 'channelId', l: 'Canal', t: 'select', req: 1, half: 1, opts: () => S.config.channels.map(x => [x.id, x.name]) },
      { k: 'date', l: 'Data', t: 'date', req: 1, half: 1 },
      { k: 'campaign', l: 'Campanha', ph: 'Ex.: Liquida de verão', list: () => [...new Set(S.ledger.map(x => x.campaign).filter(Boolean))] },
      { k: 'amount', l: 'Valor investido', t: 'money', req: 1, half: 1 },
      { k: 'st', l: 'Situação', t: 'seg', half: 1, opts: [['pago', 'Pago'], ['pendente', 'A pagar']] },
      { k: 'dueDate', l: 'Vencimento', t: 'date', show: v => v.st === 'pendente', half: 1 },
    ],
    values: { channelId: 'insta', date: today(), st: 'pago', dueDate: today() },
    onSubmit: v => {
      if (!(v.amount > 0)) return 'Informe o valor.';
      const e = { id: uid(), type: 'out', date: v.date, amount: r2(v.amount), categoryId: S.config.categories.find(c => c.group === 'marketing')?.id || 'marketing', description: 'Anúncio ' + chName(v.channelId) + (v.campaign ? ' — ' + v.campaign : ''), channelId: v.channelId, campaign: v.campaign, status: v.st, paidDate: v.st === 'pago' ? v.date : null, dueDate: v.st === 'pago' ? v.date : v.dueDate, createdAt: nowS() };
      S.ledger.push(e);
      commit('criou', 'Marketing', e.description + ' — ' + fm(e.amount), e.id);
      toast('Investimento registrado'); render();
    },
  });
};

/* ---------- 6. Funcionários e produtividade ---------- */
function pgEquipe() {
  const r = curRange(), tm = teamMetrics(r), tp = teamMetrics(prevRange(r, UI.period.id));
  const tab = curTab('eq', 'rank');
  let h = pageHead('6 · Funcionários e produtividade', 'Funcionários', 'Custo da equipe, vendas e produtividade de cada um e controle de faltas.', '<button class="btn pri" data-act="empNew">' + ic('plus', 'sm') + 'Novo funcionário</button><button class="btn" data-act="absNew">Registrar falta ou atraso</button><button class="btn" data-act="payroll">Lançar folha do mês</button>');
  h += kpis([
    { l: 'Custo total com funcionários', v: fm(tm.cost), d: delta(tm.cost, tp.cost, false), s: tm.usedEstimate ? 'Estimado pelo cadastro (sem lançamentos)' : 'Salários, encargos e benefícios lançados', i: 'custofunc' },
    { l: 'Vendas por funcionário', v: fm(tm.perSeller), s: 'Média de ' + plural(tm.sellers, 'vendedor', 'vendedores'), i: 'vendfunc' },
    { l: 'Produtividade por hora trabalhada', v: fm(tm.perH) + '/h', d: delta(tm.perH, tp.perH), s: fi(sum(tm.rows, x => x.worked)) + ' horas trabalhadas', i: 'prodh', cls: 'hl' },
    { l: 'Taxa de absenteísmo', v: fp(tm.abs), d: delta(tm.abs, tp.abs, false), s: f1(tm.totAbs) + ' h de faltas e atrasos', i: 'absent', cls: tm.abs > 0.03 ? 'alert' : '' },
  ]);
  h += tabs('eq', [['rank', 'Desempenho'], ['cad', 'Cadastro'], ['faltas', 'Faltas e atrasos']], tab);
  if (tab === 'rank') {
    const rows = tm.rows.filter(x => x.e.active !== false || x.count > 0);
    h += card('Vendas por funcionário', hbars(rows.filter(x => x.rev > 0).sort((a, b) => b.rev - a.rev).map(x => ({ l: x.name, v: x.rev, sub: plural(x.count, 'venda', 'vendas') })).concat(tm.none.length ? [{ l: 'Sem vendedor', v: sum(tm.none, s => s.total), sub: plural(tm.none.length, 'venda', 'vendas'), c: '--line-2' }] : [])), { i: 'vendfunc' });
    h += card('Produtividade da equipe', table('team', {
      rows, search: false, sort: 'rev', empty: 'Nenhum funcionário cadastrado', emptyBtn: '<button class="btn sm pri" data-act="empNew">Cadastrar funcionário</button>', act: 'empEdit',
      cols: [
        { k: 'name', l: 'Funcionário', f: x => '<b>' + esc(x.name) + '</b><small class="muted">' + esc(x.role || '') + '</small>', s: x => x.name },
        { k: 'count', l: 'Vendas', num: 1, f: x => fi(x.count), s: x => x.count },
        { k: 'rev', l: 'Faturamento', num: 1, f: x => '<b>' + fm(x.rev) + '</b>', s: x => x.rev },
        { k: 'ticket', l: 'Ticket', num: 1, f: x => fm(x.ticket), s: x => x.ticket },
        { k: 'perH', l: 'R$ por hora', num: 1, f: x => fm(x.perH), s: x => x.perH },
        { k: 'comm', l: 'Comissão', num: 1, f: x => fm(x.comm), s: x => x.comm },
        { k: 'abs', l: 'Absenteísmo', num: 1, f: x => chip(fp(x.abs), x.abs > 0.05 ? 'crit' : x.abs > 0.03 ? 'warn' : 'good'), s: x => x.abs },
      ],
    }), { sub: 'Horas previstas pela jornada semanal do cadastro, menos faltas e atrasos registrados.' });
  } else if (tab === 'cad') {
    h += card('', table('emps', {
      rows: S.employees, act: 'empEdit', search: false,
      empty: 'Nenhum funcionário cadastrado', emptyBtn: '<button class="btn sm pri" data-act="empNew">Cadastrar funcionário</button>',
      cols: [
        { k: 'n', l: 'Funcionário', f: e => '<b>' + esc(e.name) + '</b><small class="muted">' + esc(e.role || '') + (e.hireDate ? ' · desde ' + fd(e.hireDate) : '') + '</small>' },
        { k: 'st', l: 'Situação', f: e => (e.active === false ? chip('Desligado') : chip('Ativo', 'good')) },
        { k: 'h', l: 'Jornada', f: e => fi(e.weeklyHours) + ' h/semana' },
        { k: 'c', l: 'Comissão', num: 1, f: e => fn(e.commissionPct || 0) + '%' },
        { k: 'v', l: 'Custo mensal', num: 1, f: e => '<b>' + fm((+e.salary || 0) * (1 + (+e.chargesPct || 0) / 100) + (+e.benefits || 0)) + '</b>' },
      ],
    }));
  } else {
    const rows = S.absences.filter(a => inR(a.date, r)).sort((a, b) => (a.date < b.date ? 1 : -1));
    h += card('Faltas e atrasos no período', table('abs', {
      rows, act: 'absEdit', search: false, empty: 'Nenhuma falta registrada no período',
      cols: [
        { k: 'e', l: 'Funcionário', f: a => '<b>' + esc(empName(a.employeeId)) + '</b><small class="muted">' + fd(a.date) + '</small>' },
        { k: 't', l: 'Tipo', f: a => esc(a.kind === 'atraso' ? 'Atraso' : a.kind === 'saida' ? 'Saída antecipada' : 'Falta') },
        { k: 'j', l: 'Justificada', f: a => (a.justified ? chip('Sim', 'good') : chip('Não', 'warn')) },
        { k: 'm', l: 'Motivo', f: a => esc(a.reason || '—') },
        { k: 'h', l: 'Horas', num: 1, f: a => f1(a.hours) },
      ],
    }));
  }
  return h;
}
function empForm(e) {
  const isNew = !e;
  openForm({
    title: isNew ? 'Novo funcionário' : 'Editar funcionário',
    fields: [
      { k: 'name', l: 'Nome', req: 1 }, { k: 'role', l: 'Cargo', half: 1, list: ['Vendedor', 'Vendedora', 'Caixa', 'Gerente', 'Estoquista', 'Entregador', 'Atendente'] },
      { k: 'hireDate', l: 'Data de admissão', t: 'date', half: 1 },
      { k: 'salary', l: 'Salário mensal', t: 'money', req: 1, half: 1 }, { k: 'chargesPct', l: 'Encargos', t: 'pct', half: 1, help: 'INSS, FGTS, férias e 13º. Use cerca de 30% se não souber.' },
      { k: 'benefits', l: 'Benefícios por mês', t: 'money', half: 1, help: 'Vale-transporte, vale-refeição.' }, { k: 'weeklyHours', l: 'Horas por semana', t: 'num', req: 1, half: 1 },
      { k: 'commissionPct', l: 'Comissão sobre vendas', t: 'pct', half: 1 },
      { k: 'userId', l: 'Usuário do sistema', t: 'select', half: 1, opts: () => [['', 'Nenhum']].concat(S.users.map(u => [u.id, u.name])), help: 'Preenche o vendedor automaticamente na venda.' },
      { k: 'active', l: 'Funcionário ativo', t: 'check', show: () => !isNew },
    ],
    values: e ? { ...e } : { chargesPct: 30, weeklyHours: 44, commissionPct: 0, hireDate: today(), active: true },
    live: v => '<div class="preview"><div><span>Custo mensal total</span><b>' + fm((v.salary || 0) * (1 + (v.chargesPct || 0) / 100) + (v.benefits || 0)) + '</b></div><div><span>Custo por hora</span><b>' + fm(div((v.salary || 0) * (1 + (v.chargesPct || 0) / 100) + (v.benefits || 0), (+v.weeklyHours || 0) * 4.345)) + '</b></div></div>',
    danger: !isNew ? { l: 'Excluir', f: async () => { if (S.sales.some(s => s.employeeId === e.id)) { e.active = false; e.leftDate = today(); commit('desligou', 'Funcionário', e.name, e.id); toast('Funcionário com vendas foi marcado como desligado'); render(); return; } const ok = await ask({ title: 'Excluir funcionário', text: 'Excluir <b>' + esc(e.name) + '</b>?', ok: 'Excluir', danger: true }); if (!ok) return false; S.employees = S.employees.filter(x => x.id !== e.id); commit('excluiu', 'Funcionário', e.name, e.id); render(); } } : null,
    onSubmit: v => {
      const data = { name: v.name, role: v.role, hireDate: v.hireDate, salary: r2(v.salary), chargesPct: +v.chargesPct || 0, benefits: r2(v.benefits), weeklyHours: +v.weeklyHours || 0, commissionPct: +v.commissionPct || 0, userId: v.userId || null };
      if (isNew) { const n = { id: uid(), active: true, ...data }; S.employees.push(n); commit('criou', 'Funcionário', n.name, n.id); toast('Funcionário cadastrado'); }
      else { const was = e.active !== false; Object.assign(e, data, { active: v.active }); if (was && !v.active) e.leftDate = today(); commit('editou', 'Funcionário', e.name, e.id); toast('Funcionário atualizado'); }
      render();
    },
  });
}
ACT.empNew = () => empForm(null);
ACT.empEdit = el => { const e = ix().emp.get(el.dataset.id); if (e) empForm(e); };
function absForm(a) {
  if (!S.employees.length) { toast('Cadastre um funcionário primeiro.', 'err'); return; }
  const isNew = !a;
  openForm({
    title: isNew ? 'Registrar falta ou atraso' : 'Editar registro', size: 'sm',
    fields: [
      { k: 'employeeId', l: 'Funcionário', t: 'select', req: 1, opts: () => S.employees.filter(x => x.active !== false || (a && x.id === a.employeeId)).map(x => [x.id, x.name]) },
      { k: 'kind', l: 'Tipo', t: 'seg', opts: [['falta', 'Falta'], ['atraso', 'Atraso'], ['saida', 'Saída antecipada']] },
      { k: 'date', l: 'Data', t: 'date', req: 1, half: 1 },
      { k: 'hours', l: 'Horas perdidas', t: 'num', req: 1, half: 1 },
      { k: 'justified', l: 'Justificada (atestado, combinado)', t: 'check' },
      { k: 'reason', l: 'Motivo' },
    ],
    values: a ? { ...a } : { kind: 'falta', date: today(), hours: '' },
    onChange: (v, frm) => { const h = frm.elements.hours; if (h && !h.value && v.kind === 'falta' && v.employeeId) { const e = ix().emp.get(v.employeeId); if (e) h.value = String(r2((e.weeklyHours || 44) / 6)).replace('.', ','); } },
    danger: !isNew ? { l: 'Excluir', f: () => { S.absences = S.absences.filter(x => x.id !== a.id); commit('excluiu', 'Falta', empName(a.employeeId) + ' em ' + fd(a.date), a.id); render(); } } : null,
    onSubmit: v => {
      if (!(v.hours > 0)) return 'Informe as horas.';
      const data = { employeeId: v.employeeId, kind: v.kind, date: v.date, hours: +v.hours, justified: v.justified, reason: v.reason };
      if (isNew) { const n = { id: uid(), ...data }; S.absences.push(n); commit('registrou', 'Falta', empName(v.employeeId) + ': ' + v.kind + ' de ' + f1(v.hours) + ' h em ' + fd(v.date), n.id); }
      else { Object.assign(a, data); commit('editou', 'Falta', empName(v.employeeId) + ' em ' + fd(v.date), a.id); }
      toast('Registro salvo'); render();
    },
  });
}
ACT.absNew = () => absForm(null);
ACT.absEdit = el => { const a = S.absences.find(x => x.id === el.dataset.id); if (a) absForm(a); };
ACT.payroll = () => {
  const emps = S.employees.filter(e => e.active !== false);
  if (!emps.length) { toast('Cadastre os funcionários primeiro.', 'err'); return; }
  const months = [-2, -1, 0].map(n => monthKey(addMonths(today(), n)));
  const m = modal({
    title: 'Lançar folha do mês', size: 'lg',
    body: '<p class="ink2" style="margin-bottom:12px">Cria um lançamento de salário + encargos + benefícios para cada funcionário. O valor entra no lucro do mês de referência.</p><div class="frm"><div class="fld half"><label for="pr-m">Mês de referência</label><select id="pr-m">' + months.map(k => '<option value="' + k + '"' + (k === months[1] && +today().slice(8) <= 10 ? ' selected' : k === months[2] && +today().slice(8) > 10 ? ' selected' : '') + '>' + monthLabel(k) + '</option>').join('') + '</select></div><div class="fld half"><label for="pr-d">Data do pagamento</label><input type="date" id="pr-d" value="' + today() + '"></div><div class="fld chk"><label class="ck"><input type="checkbox" id="pr-paid" checked><span>Já foi pago</span></label></div></div><div id="pr-list" style="margin-top:12px"></div>',
    foot: '<span class="sp"></span><button type="button" class="btn" data-close>Cancelar</button><button type="button" class="btn pri" id="pr-ok">Lançar folha</button>',
  });
  const draw = () => {
    const mk = $('#pr-m', m.el).value;
    $('#pr-list', m.el).innerHTML = '<div class="tbl-wrap"><table class="rt"><thead><tr><th>Funcionário</th><th>Situação</th><th class="num">Valor</th></tr></thead><tbody>' + emps.map(e => { const done = S.ledger.some(x => x.payroll === mk && x.employeeId === e.id); const v = (+e.salary || 0) * (1 + (+e.chargesPct || 0) / 100) + (+e.benefits || 0); return '<tr><td class="main" data-l="Funcionário"><label class="ck"><input type="checkbox" data-pe="' + e.id + '"' + (done ? '' : ' checked') + '><span>' + esc(e.name) + '</span></label></td><td data-l="Situação">' + (done ? chip('Já lançada', 'warn') : chip('Pendente', 'plain')) + '</td><td class="num" data-l="Valor"><input class="inp" style="width:120px;min-height:34px;text-align:right" inputmode="decimal" data-pv="' + e.id + '" value="' + toInput(v) + '"></td></tr>'; }).join('') + '</tbody></table></div>';
  };
  draw(); $('#pr-m', m.el).onchange = draw;
  $('#pr-ok', m.el).onclick = () => {
    const mk = $('#pr-m', m.el).value, pd = $('#pr-d', m.el).value || today(), paid = $('#pr-paid', m.el).checked;
    const ref = monthEnd(mk + '-01') < today() ? monthEnd(mk + '-01') : today();
    let n = 0, tot = 0;
    for (const cb of $$('[data-pe]', m.el)) {
      if (!cb.checked) continue;
      const e = ix().emp.get(cb.dataset.pe); const v = parseNum($('[data-pv="' + e.id + '"]', m.el).value); if (!(v > 0)) continue;
      S.ledger.push({ id: uid(), type: 'out', date: ref, amount: r2(v), categoryId: 'salarios', description: 'Folha ' + monthShort(mk) + ' — ' + e.name, employeeId: e.id, payroll: mk, status: paid ? 'pago' : 'pendente', paidDate: paid ? pd : null, dueDate: pd, createdAt: nowS() });
      n++; tot += v;
    }
    if (!n) { toast('Nenhum funcionário selecionado.', 'err'); return; }
    commit('lançou', 'Folha de pagamento', monthLabel(mk) + ': ' + plural(n, 'funcionário', 'funcionários') + ', total ' + fm(tot));
    m.close(); toast('Folha lançada: ' + fm(tot)); render();
  };
};
