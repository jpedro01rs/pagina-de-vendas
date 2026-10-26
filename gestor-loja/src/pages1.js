/* ============================================================
   Telas: painel executivo, indicadores, nova venda, caixa, vendas
   ============================================================ */
const ACT = {}; // ações de clique: data-act="nome"
const INP = {}; // ações de digitação: data-inp="nome"

/* ---------- 13. Painel executivo ---------- */
function pgInicio() {
  const t = today();
  const m = UI.dashMonth || monthKey(t);
  const isCur = m === monthKey(t);
  const r = monthRange(m);
  const c = calc(r);
  const pr = prevRange(r, 'mes');
  const cp = calc(pr);
  const g = goalFor(m);
  const dim = +monthEnd(m + '-01').slice(8);
  const elapsed = isCur ? +t.slice(8) : (m < monthKey(t) ? dim : 0);
  const pace = elapsed ? c.revenue / elapsed * dim : 0;
  const pct = div(c.revenue, g.revenue);
  const bal = balanceAt(t);
  const P = pendings();
  const al = alerts();

  // acumulado do mês x meta linear
  const days = eachDay({ from: m + '-01', to: monthEnd(m + '-01') });
  const byDay = new Map(); for (const s of c.sales) { const d = s.date.slice(0, 10); byDay.set(d, (byDay.get(d) || 0) + s.total); }
  let acc = 0; const real = [], goalLine = [];
  days.forEach((d, i) => { acc += byDay.get(d) || 0; real.push(d <= r.to && (isCur ? d <= t : true) ? acc : null); goalLine.push(g.revenue ? g.revenue / dim * (i + 1) : null); });
  const series = [{ name: 'Faturamento acumulado', values: real, c: '--s1' }];
  if (g.revenue) series.push({ name: 'Meta (ritmo para bater)', values: goalLine, c: '--s2', dash: true });

  const top = productPerf(r).slice(0, 6);
  const mk = mktMetrics(r);
  const chRows = mk.rows.filter(x => x.rev > 0).slice(0, 6);
  const meterCls = pct >= 1 ? 'good' : '';
  const onboarding = !S.meta.demo && (S.products.length < 1 || S.sales.length < 1 || !g.revenue);

  let h = '<div class="ph"><div><div class="eyebrow">13 · Indicadores executivos</div><h1>' + esc(S.config.storeName) + '</h1><p>Resumo do mês: faturamento, lucro, saldo e meta.</p></div><div class="ph-a"><div class="month-sw"><button class="icon-btn" data-act="dashMonth" data-d="-1" aria-label="Mês anterior">' + ic('left') + '</button><b>' + cap(monthLabel(m)) + '</b><button class="icon-btn" data-act="dashMonth" data-d="1" aria-label="Próximo mês"' + (isCur ? ' disabled' : '') + '>' + ic('right') + '</button></div><button class="btn" data-act="shareMonth">' + ic('chat', 'sm') + 'Resumo para WhatsApp</button></div></div>';
  if (onboarding) h += firstSteps();

  h += '<div class="hero"><section class="card hero-main"><div class="hero-l">Faturamento do mês <button class="qi" data-act="info" data-k="fatmes" aria-label="Como é calculado">?</button></div><div class="hero-v">' + fm(c.revenue) + '</div>' + delta(c.revenue, cp.revenue) +
    (g.revenue ? '<div class="meter ' + meterCls + '" role="progressbar" aria-valuenow="' + Math.round(pct * 100) + '" aria-valuemin="0" aria-valuemax="100" aria-label="Meta de vendas"><i style="width:' + clamp(pct * 100, 0, 100).toFixed(1) + '%"></i></div><div class="meter-row"><span><b>' + fp(pct, 0) + '</b> da meta de ' + fm(g.revenue) + '</span><span>' + (pct >= 1 ? 'Meta batida' : 'Faltam ' + fm(g.revenue - c.revenue)) + '</span></div>'
      : '<p class="muted" style="margin-top:10px">Defina uma meta de faturamento para acompanhar o percentual atingido. <a href="#planejamento">Definir meta</a></p>') +
    (isCur && elapsed ? '<p class="muted" style="margin-top:10px;font-size:13px">No ritmo atual, o mês fecha em <b class="ink2">' + fm(pace) + '</b> <button class="qi" data-act="info" data-k="ritmo" aria-label="Como é calculado" style="display:inline-grid;vertical-align:middle">?</button></p>' : '') +
    heroMini(c, r, isCur) + '</section>' + card('Faturamento acumulado no mês', chart({ type: 'line', labels: days, series, h: 210, xf: fds, xt: k => fd(k), area: true, aria: 'Faturamento acumulado no mês comparado à meta' })) + '</div>';

  h += kpis([
    { l: 'Lucro líquido do mês', v: '<span class="' + moneyCls(c.net) + '">' + fm(c.net) + '</span>', d: delta(c.net, cp.net), s: 'Margem líquida de ' + fp(c.netPct) + (g.profit ? ' · meta ' + fm(g.profit) : ''), i: 'lucromes', cls: 'hl' },
    { l: 'Saldo financeiro disponível', v: fm(bal), s: 'A receber ' + fm(P.recTotal) + ' · a pagar ' + fm(P.payTotal), i: 'saldo' },
    { l: 'Atingimento da meta de vendas', v: g.revenue ? fp(pct, 0) : '—', s: g.revenue ? 'Meta ' + fm(g.revenue) : 'Sem meta definida', i: 'meta' },
    { l: 'Vendas no mês', v: fi(c.count), d: delta(c.count, cp.count), s: 'Ticket médio ' + fm(c.ticket), i: 'nvendas' },
  ]);

  h += '<div class="grid2">' + card('O que precisa de atenção', al.length ? '<div class="alerts">' + al.map(a => '<button class="al ' + a.sev + '" data-act="go" data-r="' + a.go + '"' + (a.tab ? ' data-tg="' + a.tab[0] + '" data-tv="' + a.tab[1] + '"' : '') + '><span class="sev">' + ic(a.sev === 'info' ? 'info' : 'alert') + '</span><span>' + a.t + '</span>' + ic('right', 'sm') + '</button>').join('') + '</div>' : '<div class="alerts"><div class="al good"><span class="sev">' + ic('check') + '</span><span>Tudo em ordem. Nenhum alerta no momento.</span></div></div>') +
    card('Resultado do mês', dreReceipt(c, 'Resultado de ' + monthLabel(m)), { i: 'lucro' }) + '</div>';

  h += '<div class="grid2">' + card('Produtos que mais faturaram', hbars(top.map(x => ({ l: x.name, v: x.rev, sub: fi(x.qty) + ' un' }))), { a: '<a class="btn sm ghost" href="#vendas">Ver todos</a>' }) +
    card('Faturamento por canal', hbars(chRows.map(x => ({ l: x.name, v: x.rev }))), { i: 'receitacanal', a: '<a class="btn sm ghost" href="#marketing">Marketing</a>' }) + '</div>';
  return h;
}
function heroMini(c, r, isCur) {
  const t = today();
  const byDay = groupBy(c.sales, s => s.date.slice(0, 10));
  let best = null; for (const [d, l] of byDay) { const v = sum(l, s => s.total); if (!best || v > best.v) best = { d, v }; }
  const td = byDay.get(t) || [];
  const days = Math.max(1, daysInRange(r));
  const cell = (l, v, s) => '<div><span>' + l + '</span><b>' + v + '</b>' + (s ? '<small class="muted">' + s + '</small>' : '') + '</div>';
  return '<div class="mini">' + (isCur ? cell('Hoje', fm(sum(td, s => s.total)), plural(td.length, 'venda', 'vendas')) : cell('Vendas', fi(c.count), 'no mês')) + cell('Média por dia', fm(c.revenue / days), f1(c.count / days) + ' vendas') + (best ? cell('Melhor dia', fm(best.v), fd(best.d)) : '') + '</div>';
}
function firstSteps() {
  const s = [
    [S.config.storeName !== 'Minha Loja', 'Configure os dados da loja', 'Nome, saldo inicial, impostos e formas de pagamento', 'config'],
    [S.products.length > 0, 'Cadastre seus produtos', 'Com custo, preço de venda e estoque atual', 'estoque'],
    [S.employees.length > 0, 'Cadastre os funcionários', 'Salário, horas de trabalho e comissão', 'equipe'],
    [S.recurrences.length > 0 || S.ledger.some(e => e.type === 'out'), 'Registre as despesas fixas', 'Aluguel, energia, internet... marque "repetir todo mês"', 'financeiro'],
    [!!goalFor(monthKey(today())).revenue, 'Defina a meta de faturamento do mês', 'Para acompanhar o atingimento no painel', 'planejamento'],
    [S.sales.length > 0, 'Faça a primeira venda', 'Pelo botão Nova venda', 'vender'],
  ];
  const done = s.filter(x => x[0]).length;
  return card('Primeiros passos (' + done + ' de ' + s.length + ')', '<div class="steps">' + s.map((x, i) => '<a class="step ' + (x[0] ? 'done' : '') + '" href="#' + x[3] + '"><span class="nb">' + (x[0] ? '✓' : i + 1) + '</span><span>' + esc(x[1]) + '<small>' + esc(x[2]) + '</small></span>' + ic('right', 'sm') + '</a>').join('') + '</div>', { sub: 'Siga a ordem abaixo. Os indicadores ficam completos conforme você registra o dia a dia.' });
}
function dreReceipt(c, title) {
  const L = (k, v, cls = '') => '<div class="rl ' + cls + '"><span class="k">' + esc(k) + '</span><span class="lead"></span><span class="v">' + v + '</span></div>';
  const neg = v => (v ? '− ' + fm(v) : fm(0));
  return '<div class="receipt" aria-label="Demonstrativo de resultado"><div class="rh">' + esc(S.config.storeName) + '</div><div class="rs">' + esc(title) + ' · ' + fd(c.r.from) + ' a ' + fd(c.r.to) + '</div>' +
    L('Faturamento (' + plural(c.count, 'venda', 'vendas') + ')', fm(c.revenue), 'tot') +
    L('Mercadoria vendida (CMV)', neg(c.cmv), 'sub') + L('Impostos sobre vendas', neg(c.taxes), 'sub') + L('Taxas de cartão', neg(c.fees), 'sub') + L('Comissões', neg(c.comm), 'sub') + (c.ship ? L('Custo das entregas', neg(c.ship), 'sub') : '') +
    '<hr>' + L('Margem de contribuição · ' + fp(c.mcPct), fm(c.mc), 'tot') +
    L('Despesas fixas', neg(c.fixa), 'sub') + L('Despesas variáveis e marketing', neg(c.variavel), 'sub') + (c.outra ? L('Outras receitas', '+ ' + fm(c.outra), 'sub') : '') + (Math.abs(c.perdas) > 0.004 ? L('Perdas e quebras', c.perdas > 0 ? neg(c.perdas) : '+ ' + fm(-c.perdas), 'sub') : '') +
    '<hr>' + L('LUCRO LÍQUIDO · ' + fp(c.netPct), '<span class="' + moneyCls(c.net) + '">' + fm(c.net) + '</span>', 'tot') + '</div>';
}
ACT.dashMonth = el => { const m = UI.dashMonth || monthKey(today()); const n = monthKey(addMonths(m + '-01', +el.dataset.d)); if (n > monthKey(today())) return; UI.dashMonth = n; render(); };
ACT.shareMonth = () => {
  const m = UI.dashMonth || monthKey(today()); const c = calc(monthRange(m)); const g = goalFor(m); const st = stockMetrics(monthRange(m));
  const txt = '*' + S.config.storeName + ' — ' + monthLabel(m) + '*\n' +
    'Faturamento: ' + fm(c.revenue) + (g.revenue ? ' (' + fp(div(c.revenue, g.revenue), 0) + ' da meta)' : '') + '\n' +
    'Vendas: ' + fi(c.count) + ' · Ticket médio: ' + fm(c.ticket) + '\n' +
    'Margem de contribuição: ' + fm(c.mc) + ' (' + fp(c.mcPct) + ')\n' +
    'Despesas operacionais: ' + fm(c.opex) + '\n' +
    'Lucro líquido: ' + fm(c.net) + ' (' + fp(c.netPct) + ')\n' +
    'Saldo disponível hoje: ' + fm(balanceAt(today())) + '\n' +
    'Estoque a custo: ' + fm(st.cost) + ' · ' + plural(st.low.length + st.zero.length, 'produto para repor', 'produtos para repor');
  copyText(txt, 'Resumo copiado. Cole no WhatsApp.');
};

/* ---------- Grade de indicadores (13 módulos) ---------- */
const MODS = [
  ['inicio', 13, 'Indicadores executivos', 'home'], ['financeiro', 1, 'Financeiro', 'wallet'], ['vendas', 2, 'Vendas e desempenho', 'trend'],
  ['estoque', 3, 'Estoque', 'box'], ['clientes', 4, 'Clientes e relacionamento', 'users'], ['marketing', 5, 'Marketing e publicidade', 'mega'],
  ['equipe', 6, 'Funcionários e produtividade', 'badge'], ['operacao', 7, 'Operação e logística', 'truck'], ['fornecedores', 8, 'Fornecedores e compras', 'factory'],
  ['precificacao', 9, 'Precificação e rentabilidade', 'tag'], ['planejamento', 10, 'Planejamento e estratégia', 'target'], ['seguranca', 11, 'Segurança e auditoria', 'shield'],
  ['satisfacao', 12, 'Satisfação e reputação', 'star'],
];
function pgModulos() {
  const r = curRange();
  const head = (k) => {
    try {
      switch (k) {
        case 'inicio': { const m = monthKey(today()); const c = calc(monthRange(m)); const g = goalFor(m); return [fm(c.revenue), g.revenue ? fp(div(c.revenue, g.revenue), 0) + ' da meta do mês' : 'Faturamento do mês']; }
        case 'financeiro': { const c = calc(r); return [fm(c.net), 'Lucro líquido · margem ' + fp(c.netPct)]; }
        case 'vendas': { const c = calc(r); return [fm(c.revenue), plural(c.count, 'venda', 'vendas') + ' · ticket ' + fm(c.ticket)]; }
        case 'estoque': { const s = stockMetrics(r); return [fm(s.cost), 'Custo do estoque · ' + plural(s.low.length + s.zero.length, 'item para repor', 'itens para repor')]; }
        case 'clientes': { const c = custMetrics(r); return [fi(c.active), 'Clientes ativos · recompra ' + fp(c.repurchase, 0)]; }
        case 'marketing': { const k2 = mktMetrics(r); return [k2.invest ? f1(k2.roas).replace(',0', '') + 'x' : '—', 'ROAS · CAC ' + (k2.newC ? fm(k2.cac) : '—')]; }
        case 'equipe': { const tm = teamMetrics(r); return [fm(tm.perH) + '/h', 'Produtividade · absenteísmo ' + fp(tm.abs)]; }
        case 'operacao': { const o = opsMetrics(r); return [o.deliv.length ? fp(o.onTimePct, 0) : '—', 'Entregas no prazo · erros ' + fp(o.errPct)]; }
        case 'fornecedores': { const s = supMetrics(r); return [s.recvN ? f1(s.lead).replace(',0', '') + ' dias' : '—', 'Prazo médio de entrega · ' + fm(s.total) + ' comprados']; }
        case 'precificacao': { const ctx = pricingCtx(); const rows = S.products.filter(p => p.active !== false && p.price > 0).map(p => priceRow(p, ctx)); const b = rows.filter(x => x.status === 'crit').length; return [fi(b), b === 1 ? 'Produto abaixo do preço mínimo' : 'Produtos abaixo do preço mínimo']; }
        case 'planejamento': { const p = projection(30); return [fm(p.b[30]), 'Saldo previsto em 30 dias']; }
        case 'seguranca': { const s = secMetrics(r); return [fm(s.lossTotal), 'Perdas e faltas de caixa no período']; }
        case 'satisfacao': { const s = satMetrics(r); return [s.rv.length ? f1(s.avgRating) + ' ★' : '—', 'Nota média · ' + plural(s.cp.length, 'reclamação', 'reclamações')]; }
      }
    } catch (e) { console.error(e); }
    return ['—', ''];
  };
  const list = MODS.filter(x => canRoute(x[0]));
  return pageHead('Visão geral', 'Indicadores da loja', 'Os 13 grupos de indicadores. Toque em um para ver os detalhes. Período: ' + esc(periodLabel(UI.period).span) + '.') +
    '<div class="mods">' + list.map(([k, n, t, i]) => { const [v, s] = head(k); return '<a class="mod" href="#' + k + '"><div class="mod-h"><span class="mod-ic">' + ic(i) + '</span><span class="mod-n">' + pad(n) + '</span></div><h3>' + esc(t) + '</h3><div class="mod-v">' + v + '</div><div class="mod-s">' + esc(s) + '</div></a>'; }).join('') + '</div>';
}

/* ---------- Nova venda (PDV) ---------- */
function pdvState() {
  if (!UI.pdv) {
    const myEmp = S.employees.find(e => e.userId && e.userId === CUR?.id && e.active !== false);
    UI.pdv = { items: [], customerId: null, channelId: 'loja', employeeId: myEmp ? myEmp.id : (LS.get('lastEmp', '') || ''), pm: LS.get('lastPm', 'pix'), discount: '', delivery: false, ful: { type: 'entrega', promisedAt: addHours(nowS(), 24), shippingCharged: 0, shippingCost: 0, address: '' }, received: '', dueDate: addDays(today(), 30), date: '', notes: '', q: '' };
  }
  return UI.pdv;
}
function pdvTotals() {
  const P = pdvState();
  const subtotal = r2(sum(P.items, i => i.qty * i.price));
  const raw = String(P.discount || '').trim();
  let discount = raw.endsWith('%') ? subtotal * parseNum(raw) / 100 : parseNum(raw);
  discount = r2(clamp(discount, 0, subtotal));
  const ship = P.delivery ? r2(P.ful.shippingCharged || 0) : 0;
  const total = r2(subtotal - discount + ship);
  const pm = ix().pm.get(P.pm);
  return { subtotal, discount, ship, total, fee: r2(total * (pm?.fee || 0) / 100), pm };
}
function pgVender() {
  const P = pdvState();
  const cfg = S.config;
  const cs = openCash();
  const empOpts = [['', 'Sem vendedor']].concat(S.employees.filter(e => e.active !== false).map(e => [e.id, e.name]));
  let h = pageHead('Dia a dia', 'Nova venda', 'Busque pelo nome ou código, ou leia o código de barras. A venda baixa o estoque e lança o dinheiro no financeiro.', '<a class="btn" href="#vendas">' + ic('list', 'sm') + 'Vendas registradas</a>');
  if (!cs) h += '<div class="banner warn"><p>' + ic('alert', 'sm') + ' O caixa está fechado. Abra o caixa para conferir o dinheiro no fim do dia.</p><button class="btn sm" data-act="cashOpen">Abrir caixa</button></div>';
  if (!S.products.filter(p => p.active !== false).length) h += '<div class="banner"><p>Você ainda não tem produtos cadastrados.</p><button class="btn sm pri" data-act="prodNew">Cadastrar produto</button></div>';
  h += '<div class="pdv"><div class="stack"><div class="pdv-search">' + ic('search') + '<input id="pdv-q" type="search" placeholder="Buscar produto ou código…" autocomplete="off" value="' + esc(P.q) + '" data-inp="pdvq" aria-label="Buscar produto"></div><div id="pdv-res">' + pdvResults() + '</div></div>';
  h += '<div class="pdv-cart"><section class="card"><div class="card-h"><h2>Itens da venda</h2><button class="btn sm ghost" data-act="pdvClear">Limpar</button></div><div id="pdv-items">' + pdvItems() + '</div>' +
    '<div class="frm" style="margin-top:6px">' +
    '<div class="fld"><span class="lb">Cliente</span><div id="pdv-cust">' + pdvCust() + '</div></div>' +
    '<div class="fld half"><label for="pdv-ch">Como o cliente chegou</label><select id="pdv-ch" data-chg="pdvf" data-k="channelId">' + cfg.channels.map(c => '<option value="' + esc(c.id) + '"' + (c.id === P.channelId ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select></div>' +
    '<div class="fld half"><label for="pdv-emp">Vendedor</label><select id="pdv-emp" data-chg="pdvf" data-k="employeeId">' + empOpts.map(([v, l]) => '<option value="' + esc(v) + '"' + (v === P.employeeId ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select></div>' +
    '<div class="fld"><span class="lb">Forma de pagamento</span><div class="pay" role="radiogroup" aria-label="Forma de pagamento">' + cfg.paymentMethods.map(p => '<label><input type="radio" name="pdv-pm" value="' + esc(p.id) + '"' + (p.id === P.pm ? ' checked' : '') + ' data-chg="pdvpm"><span>' + esc(p.name) + '</span></label>').join('') + '</div></div>' +
    '<div class="fld half" id="pdv-rec-w"><label for="pdv-rec">Valor recebido (troco)</label><div class="inp-pre"><span>R$</span><input id="pdv-rec" inputmode="decimal" value="' + esc(P.received) + '" data-inp="pdvf" data-k="received" placeholder="0,00"></div></div>' +
    '<div class="fld half" id="pdv-due-w"><label for="pdv-due">Vencimento do pagamento</label><input type="date" id="pdv-due" value="' + esc(P.dueDate) + '" data-chg="pdvf" data-k="dueDate"></div>' +
    '<div class="fld half"><label for="pdv-disc">Desconto</label><input id="pdv-disc" class="inp" inputmode="decimal" value="' + esc(P.discount) + '" data-inp="pdvf" data-k="discount" placeholder="R$ ou 10%"></div>' +
    '<div class="fld chk"><label class="ck"><input type="checkbox" id="pdv-del"' + (P.delivery ? ' checked' : '') + ' data-chg="pdvdel"><span>Pedido para entrega ou retirada</span></label></div>' +
    '<div class="frm g-wide" id="pdv-ful" style="grid-column:1/-1"' + (P.delivery ? '' : ' hidden') + '>' +
    '<div class="fld half"><label for="pdv-ft">Tipo</label><select id="pdv-ft" data-chg="pdvful" data-k="type"><option value="entrega"' + (P.ful.type === 'entrega' ? ' selected' : '') + '>Entrega</option><option value="retirada"' + (P.ful.type === 'retirada' ? ' selected' : '') + '>Retirada na loja</option></select></div>' +
    '<div class="fld half"><label for="pdv-fp">Prazo prometido</label><input type="datetime-local" id="pdv-fp" value="' + esc(P.ful.promisedAt) + '" data-chg="pdvful" data-k="promisedAt"></div>' +
    '<div class="fld half"><label for="pdv-fs">Taxa de entrega cobrada</label><div class="inp-pre"><span>R$</span><input id="pdv-fs" inputmode="decimal" value="' + esc(toInput(P.ful.shippingCharged || '')) + '" data-inp="pdvful" data-k="shippingCharged" data-n="1" placeholder="0,00"></div></div>' +
    '<div class="fld half"><label for="pdv-fc">Custo da entrega para a loja</label><div class="inp-pre"><span>R$</span><input id="pdv-fc" inputmode="decimal" value="' + esc(toInput(P.ful.shippingCost || '')) + '" data-inp="pdvful" data-k="shippingCost" data-n="1" placeholder="0,00"></div></div>' +
    '<div class="fld"><label for="pdv-fa">Endereço / observação da entrega</label><input id="pdv-fa" value="' + esc(P.ful.address) + '" data-inp="pdvful" data-k="address"></div></div>' +
    '<details class="fld"><summary class="lb" style="cursor:pointer">Mais opções</summary><div class="frm" style="margin-top:10px"><div class="fld half"><label for="pdv-dt">Data da venda</label><input type="datetime-local" id="pdv-dt" value="' + esc(P.date) + '" data-chg="pdvf" data-k="date"><small>Deixe vazio para usar agora. Use para lançar vendas de dias anteriores.</small></div><div class="fld"><label for="pdv-ob">Observações</label><input id="pdv-ob" value="' + esc(P.notes) + '" data-inp="pdvf" data-k="notes"></div></div></details>' +
    '</div><div id="pdv-tot">' + pdvTotalsHtml() + '</div><button class="btn pri lg block" data-act="pdvFinish" id="pdv-go">Finalizar venda</button></section></div></div>';
  h += '<div class="pdv-bar"><div class="sp"><small class="muted" id="pdv-bar-n">' + plural(sum(P.items, i => i.qty), 'item', 'itens') + '</small><br><b id="pdv-bar-t">' + fm(pdvTotals().total) + '</b></div><button class="btn pri lg" data-act="pdvGoCart">Revisar e pagar</button></div>';
  return h;
}
function pdvResults() {
  const P = pdvState();
  const q = (P.q || '').trim().toLowerCase();
  let list = S.products.filter(p => p.active !== false);
  if (q) list = list.filter(p => (p.name + ' ' + (p.sku || '') + ' ' + (p.category || '')).toLowerCase().includes(q));
  else {
    const pop = new Map(); const from = addDays(today(), -30);
    for (const s of S.sales) if (s.status !== 'cancelada' && s.date >= from) for (const it of s.items) pop.set(it.productId, (pop.get(it.productId) || 0) + it.qty);
    list = list.slice().sort((a, b) => (pop.get(b.id) || 0) - (pop.get(a.id) || 0));
  }
  if (!list.length) return emptyBox(q ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado', '', isAdmin() ? '<button class="btn sm" data-act="prodNew">Cadastrar produto</button>' : '');
  return (q ? '' : '<small class="muted">Mais vendidos nos últimos 30 dias</small>') + '<div class="prods">' + list.slice(0, 24).map(p => { const st = stockStatus(p); return '<button class="prod ' + (st === 'zero' ? 'out' : '') + '" data-act="pdvAdd" data-id="' + p.id + '"><b>' + esc(p.name) + '</b><span class="pr">' + fm(p.price) + '</span><small class="' + (st === 'ok' ? 'muted' : 'neg') + '">' + (st === 'zero' ? 'Sem estoque' : fn(p.stock) + ' em estoque') + '</small></button>'; }).join('') + '</div>';
}
function pdvItems() {
  const P = pdvState();
  if (!P.items.length) return '<div class="empty" style="padding:16px"><span>Toque nos produtos para adicionar.</span></div>';
  return '<div class="cart-items">' + P.items.map((it, i) => { const p = ix().prod.get(it.productId); const warn = p && it.qty > (p.stock || 0); return '<div class="ci"><div class="ci-n">' + esc(p ? p.name : it.name) + (warn ? '<small class="neg">Estoque no sistema: ' + fn(p.stock) + '</small>' : '<small class="muted">' + fm(it.price) + ' cada</small>') + '</div><div class="ci-t">' + fm(it.qty * it.price) + '</div><div class="ci-c"><div class="qty"><button type="button" data-act="pdvQty" data-i="' + i + '" data-d="-1" aria-label="Diminuir">−</button><input inputmode="decimal" value="' + esc(String(it.qty).replace('.', ',')) + '" data-inp="pdvQtyIn" data-i="' + i + '" aria-label="Quantidade"><button type="button" data-act="pdvQty" data-i="' + i + '" data-d="1" aria-label="Aumentar">+</button></div>' + (isAdmin() ? '<input class="pin" inputmode="decimal" value="' + esc(toInput(it.price)) + '" data-inp="pdvPrice" data-i="' + i + '" aria-label="Preço unitário">' : '') + '<span class="sp"></span><button type="button" class="icon-btn" data-act="pdvDel" data-i="' + i + '" aria-label="Remover item">' + ic('trash', 'sm') + '</button></div></div>'; }).join('') + '</div>';
}
function pdvCust() {
  const P = pdvState();
  if (!P.customerId) return '<button type="button" class="sel-cust" data-act="pdvCust">' + ic('user') + '<span>Identificar cliente<small class="muted">Opcional. Necessário para medir recompra, LTV e satisfação.</small></span>' + ic('right', 'sm') + '</button>';
  const c = ix().cust.get(P.customerId); const cs = ix().custStats.get(P.customerId);
  return '<div class="sel-cust has">' + ic('user') + '<span><b>' + esc(c ? c.name : '—') + '</b><small class="muted">' + (cs ? plural(cs.count, 'compra', 'compras') + ' · ' + fm(cs.total) : 'Primeira compra') + '</small></span><button type="button" class="icon-btn" data-act="pdvCust" aria-label="Trocar cliente">' + ic('edit', 'sm') + '</button><button type="button" class="icon-btn" data-act="pdvCustClear" aria-label="Remover cliente">' + ic('x', 'sm') + '</button></div>';
}
function pdvTotalsHtml() {
  const P = pdvState(); const T = pdvTotals();
  const rec = parseNum(P.received);
  return '<div class="tot-lines"><div><span class="muted">Subtotal</span><span class="tnum">' + fm(T.subtotal) + '</span></div>' + (T.discount ? '<div><span class="muted">Desconto</span><span class="tnum">− ' + fm(T.discount) + '</span></div>' : '') + (T.ship ? '<div><span class="muted">Taxa de entrega</span><span class="tnum">+ ' + fm(T.ship) + '</span></div>' : '') + '<div class="big"><span>Total</span><span class="tnum">' + fm(T.total) + '</span></div>' + (T.fee ? '<div><small class="muted">Taxa da operadora (' + fn(T.pm.fee) + '%)</small><small class="muted tnum">' + fm(T.fee) + '</small></div>' : '') + (T.pm && T.pm.kind === 'dinheiro' && rec > 0 ? '<div><b>Troco</b><b class="tnum ' + (rec < T.total ? 'neg' : '') + '">' + (rec < T.total ? 'Falta ' + fm(T.total - rec) : fm(rec - T.total)) + '</b></div>' : '') + '</div>';
}
function pdvRefresh(parts = ['items', 'tot']) {
  const P = pdvState();
  if (parts.includes('items')) { const el = $('#pdv-items'); if (el) el.innerHTML = pdvItems(); }
  if (parts.includes('res')) { const el = $('#pdv-res'); if (el) el.innerHTML = pdvResults(); }
  if (parts.includes('cust')) { const el = $('#pdv-cust'); if (el) el.innerHTML = pdvCust(); }
  const tEl = $('#pdv-tot'); if (tEl) tEl.innerHTML = pdvTotalsHtml();
  const pm = ix().pm.get(P.pm);
  const rw = $('#pdv-rec-w'); if (rw) rw.hidden = !(pm && pm.kind === 'dinheiro');
  const dw = $('#pdv-due-w'); if (dw) dw.hidden = !(pm && pm.kind === 'prazo');
  const T = pdvTotals();
  const bt = $('#pdv-bar-t'); if (bt) bt.textContent = fm(T.total);
  const bn = $('#pdv-bar-n'); if (bn) bn.textContent = plural(sum(P.items, i => i.qty), 'item', 'itens');
}
function pdvAddProduct(id) {
  const P = pdvState(); const p = ix().prod.get(id); if (!p) return;
  const ex = P.items.find(i => i.productId === id);
  if (ex) ex.qty = r2(ex.qty + 1); else P.items.push({ productId: id, qty: 1, price: +p.price || 0 });
  pdvRefresh();
}
ACT.pdvAdd = el => pdvAddProduct(el.dataset.id);
ACT.pdvQty = el => { const P = pdvState(); const it = P.items[+el.dataset.i]; if (!it) return; it.qty = r2(it.qty + (+el.dataset.d)); if (it.qty <= 0) P.items.splice(+el.dataset.i, 1); pdvRefresh(); };
ACT.pdvDel = el => { pdvState().items.splice(+el.dataset.i, 1); pdvRefresh(); };
ACT.pdvClear = () => { UI.pdv = null; render(); };
ACT.pdvGoCart = () => { const c = $('.pdv-cart'); if (c) c.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); };
INP.pdvq = el => { pdvState().q = el.value; pdvRefresh(['res']); };
INP.pdvQtyIn = el => { const it = pdvState().items[+el.dataset.i]; if (!it) return; const v = parseNum(el.value); if (v > 0) { it.qty = v; pdvRefresh(['tot']); const cis = $$('#pdv-items .ci-t'); if (cis[+el.dataset.i]) cis[+el.dataset.i].textContent = fm(it.qty * it.price); } };
INP.pdvPrice = el => { const it = pdvState().items[+el.dataset.i]; if (!it) return; it.price = parseNum(el.value); pdvRefresh(['tot']); const cis = $$('#pdv-items .ci-t'); if (cis[+el.dataset.i]) cis[+el.dataset.i].textContent = fm(it.qty * it.price); };
INP.pdvf = el => { pdvState()[el.dataset.k] = el.value; pdvRefresh(['tot']); };
INP.pdvful = el => { const P = pdvState(); P.ful[el.dataset.k] = el.dataset.n ? parseNum(el.value) : el.value; pdvRefresh(['tot']); };
const CHG = {};
CHG.pdvf = el => { pdvState()[el.dataset.k] = el.value; pdvRefresh(['tot']); };
CHG.pdvful = el => { pdvState().ful[el.dataset.k] = el.value; };
CHG.pdvpm = el => { pdvState().pm = el.value; pdvRefresh(['tot']); };
CHG.pdvdel = el => { pdvState().delivery = el.checked; const f = $('#pdv-ful'); if (f) f.hidden = !el.checked; pdvRefresh(['tot']); };
ACT.pdvCustClear = () => { pdvState().customerId = null; pdvRefresh(['cust']); };
ACT.pdvCust = () => pickCustomer(id => { const P = pdvState(); P.customerId = id; const c = ix().cust.get(id); if (c && c.channelId) { P.channelId = c.channelId; const s = $('#pdv-ch'); if (s) s.value = c.channelId; } pdvRefresh(['cust']); });
function pickCustomer(cb) {
  const list = S.customers.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const row = c => { const cs = ix().custStats.get(c.id); return '<button type="button" class="step" data-pick="' + c.id + '"><span class="av">' + esc(initials(c.name)) + '</span><span>' + esc(c.name) + '<small class="muted">' + esc(c.phone || '') + (cs ? ' · ' + plural(cs.count, 'compra', 'compras') : '') + '</small></span></button>'; };
  const m = modal({ title: 'Identificar cliente', body: '<div class="row" style="margin-bottom:10px"><label class="search" style="max-width:none">' + ic('search', 'sm') + '<input type="search" id="pk-q" placeholder="Nome ou telefone" autofocus></label><button type="button" class="btn pri" id="pk-new">' + ic('plus', 'sm') + 'Novo</button></div><div class="steps" id="pk-list">' + list.slice(0, 40).map(row).join('') + '</div>' });
  const q = $('#pk-q', m.el);
  q.addEventListener('input', () => { const s = q.value.toLowerCase().trim(); const digits = s.replace(/\D/g, ''); $('#pk-list', m.el).innerHTML = list.filter(c => !s || c.name.toLowerCase().includes(s) || (digits && (c.phone || '').replace(/\D/g, '').includes(digits))).slice(0, 40).map(row).join('') || '<p class="muted">Nenhum cliente encontrado.</p>'; });
  m.el.addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (b) { m.close(); cb(b.dataset.pick); } });
  $('#pk-new', m.el).onclick = () => { const name = q.value.trim(); m.close(); customerForm(null, c => cb(c.id), /\d{6,}/.test(name) ? { phone: name } : { name }); };
}
ACT.pdvFinish = async () => {
  const P = pdvState(); const T = pdvTotals();
  if (!P.items.length) { toast('Adicione pelo menos um produto.', 'err'); return; }
  if (P.items.some(i => !(i.qty > 0))) { toast('Confira as quantidades.', 'err'); return; }
  const pm = T.pm;
  if (pm && pm.kind === 'prazo' && !P.customerId) { toast('Venda a prazo precisa de cliente identificado.', 'err'); return; }
  const rec = parseNum(P.received);
  if (pm && pm.kind === 'dinheiro' && rec > 0 && rec < T.total) { toast('O valor recebido é menor que o total.', 'err'); return; }
  const sale = saveSale({
    items: P.items, customerId: P.customerId, employeeId: P.employeeId, channelId: P.channelId, paymentMethodId: P.pm, discount: T.discount,
    dueDate: P.dueDate, date: P.date ? P.date.slice(0, 16) : '', notes: P.notes,
    fulfillment: P.delivery ? { type: P.ful.type, status: 'novo', promisedAt: P.ful.promisedAt, shippingCharged: P.ful.shippingCharged, shippingCost: P.ful.shippingCost, address: P.ful.address } : null,
  });
  LS.set('lastPm', P.pm); LS.set('lastEmp', P.employeeId);
  const change = pm && pm.kind === 'dinheiro' && rec > T.total ? rec - T.total : 0;
  UI.pdv = null; render();
  const m = modal({ title: 'Venda #' + sale.number + ' registrada', size: 'sm', body: '<div class="hero-v" style="font-size:2rem">' + fm(sale.total) + '</div><p class="ink2">' + esc(pmName(sale.paymentMethodId)) + ' · ' + plural(sum(sale.items, i => i.qty), 'item', 'itens') + (change ? ' · <b>Troco ' + fm(change) + '</b>' : '') + '</p>', foot: '<button type="button" class="btn" id="rc-copy">' + ic('copy', 'sm') + 'Copiar comprovante</button><span class="sp"></span><button type="button" class="btn pri" data-close autofocus>Nova venda</button>' });
  $('#rc-copy', m.el).onclick = () => copyText(receiptText(sale), 'Comprovante copiado');
  setTimeout(() => { const q = $('#pdv-q'); if (q && matchMedia('(pointer:fine)').matches && !$('.ovl')) q.focus(); }, 50);
};
function receiptText(s) {
  const cfg = S.config;
  return cfg.storeName + (cfg.doc ? '\nCNPJ/CPF ' + cfg.doc : '') + (cfg.phone ? '\n' + cfg.phone : '') + '\n------------------------------\nComprovante de venda #' + s.number + '\n' + fdt(s.date) + '\n' + (s.customerId ? 'Cliente: ' + custName(s.customerId) + '\n' : '') + '------------------------------\n' +
    s.items.map(i => i.qty + 'x ' + i.name + '  ' + fm(i.qty * i.price - (i.discount || 0))).join('\n') + '\n------------------------------\n' +
    (s.discount ? 'Desconto: −' + fm(s.discount) + '\n' : '') + (s.fulfillment?.shippingCharged ? 'Entrega: ' + fm(s.fulfillment.shippingCharged) + '\n' : '') + 'TOTAL: ' + fm(s.total) + '\nPagamento: ' + pmName(s.paymentMethodId) + '\n\nObrigado pela preferência!';
}

/* ---------- Caixa (abertura, sangria, suprimento, fechamento) ---------- */
function cashExpected(cs) {
  const cashSales = S.sales.filter(s => s.cashSessionId === cs.id && s.status !== 'cancelada');
  const sales = sum(cashSales, s => s.total);
  const sup = sum((cs.movements || []).filter(m => m.type === 'suprimento'), m => m.amount);
  const sang = sum((cs.movements || []).filter(m => m.type === 'sangria'), m => m.amount);
  return { sales, count: cashSales.length, sup, sang, expected: r2((cs.openingAmount || 0) + sales + sup - sang) };
}
function pgCaixa() {
  const cs = openCash();
  let h = pageHead('Dia a dia', 'Caixa', 'Abra o caixa com o troco do dia, registre sangrias e suprimentos e feche contando o dinheiro da gaveta. O sistema mostra a diferença.');
  if (!cs) {
    h += card('', '<div class="empty" style="padding:30px 10px">' + ic('lock') + '<b>O caixa está fechado</b><span>Informe o valor em dinheiro na gaveta para começar o dia.</span><button class="btn pri lg" data-act="cashOpen">Abrir caixa</button></div>');
  } else {
    const x = cashExpected(cs);
    h += '<section class="card"><div class="card-h"><h2>Caixa aberto</h2>' + chip('Aberto', 'good') + '<div class="sub">Aberto por ' + esc(cs.openedBy) + ' em ' + fdt(cs.openedAt) + '</div></div>' +
      kpis([
        { l: 'Abertura (troco)', v: fm(cs.openingAmount) },
        { l: 'Vendas em dinheiro', v: fm(x.sales), s: plural(x.count, 'venda', 'vendas') },
        { l: 'Suprimentos − sangrias', v: fm(x.sup - x.sang), s: 'Entraram ' + fm(x.sup) + ' · saíram ' + fm(x.sang) },
        { l: 'Esperado na gaveta', v: fm(x.expected), cls: 'hl', i: 'difcaixa' },
      ]) +
      '<div class="row" style="margin-top:14px"><button class="btn" data-act="cashMove" data-t="sangria">' + ic('upload', 'sm') + 'Sangria (retirar)</button><button class="btn" data-act="cashMove" data-t="suprimento">' + ic('download', 'sm') + 'Suprimento (colocar)</button><span class="sp"></span><button class="btn pri" data-act="cashClose">Fechar caixa</button></div>' +
      ((cs.movements || []).length ? '<div style="margin-top:14px">' + table('cashmv', { search: false, rows: cs.movements.slice().reverse(), cols: [{ k: 'at', l: 'Horário', f: m => fdt(m.at) }, { k: 't', l: 'Tipo', f: m => chip(m.type === 'sangria' ? 'Sangria' : 'Suprimento', m.type === 'sangria' ? 'warn' : 'info') }, { k: 'n', l: 'Motivo', f: m => esc(m.note || '—') }, { k: 'u', l: 'Usuário', f: m => esc(m.user || '') }, { k: 'v', l: 'Valor', num: 1, f: m => fm(m.amount) }] }) + '</div>' : '') + '</section>';
  }
  const closed = S.cash.filter(c => c.closedAt).sort((a, b) => (a.closedAt < b.closedAt ? 1 : -1));
  h += card('Fechamentos anteriores', table('cashhist', {
    rows: closed, act: 'cashView', ph: 'Buscar por operador ou data',
    empty: 'Nenhum caixa fechado ainda',
    text: c => c.openedBy + ' ' + c.closedBy + ' ' + fd(c.openedAt),
    cols: [
      { k: 'd', l: 'Data', f: c => '<b>' + fd(c.openedAt) + '</b><small class="muted">' + c.openedAt.slice(11, 16) + ' às ' + c.closedAt.slice(11, 16) + '</small>', s: c => c.openedAt },
      { k: 'op', l: 'Operador', f: c => esc(c.closedBy || c.openedBy), s: c => c.closedBy || '' },
      { k: 'e', l: 'Esperado', num: 1, f: c => fm(c.expectedAmount), s: c => c.expectedAmount },
      { k: 'c', l: 'Contado', num: 1, f: c => fm(c.countedAmount), s: c => c.countedAmount },
      { k: 'df', l: 'Diferença', num: 1, f: c => Math.abs(c.difference) < 0.005 ? chip('Sem diferença', 'good') : '<span class="' + moneyCls(c.difference) + '">' + (c.difference > 0 ? '+' : '') + fm(c.difference) + '</span>', s: c => c.difference },
    ],
  }), { i: 'difcaixa' });
  return h;
}
ACT.cashOpen = () => {
  if (openCash()) { go('caixa'); return; }
  const last = S.cash.filter(c => c.closedAt).sort((a, b) => (a.closedAt < b.closedAt ? 1 : -1))[0];
  openForm({
    title: 'Abrir caixa', submit: 'Abrir caixa', size: 'sm',
    fields: [{ k: 'amount', l: 'Dinheiro na gaveta (troco inicial)', t: 'money', req: 1, help: last ? 'No último fechamento foram contados ' + fm(last.countedAmount) + '.' : '' }],
    values: { amount: 0 },
    onSubmit: v => {
      const cs = { id: uid(), openedAt: nowS(), openedBy: CUR.name, openedById: CUR.id, openingAmount: r2(v.amount), movements: [] };
      S.cash.push(cs);
      commit('abriu', 'Caixa', 'Abertura de caixa com ' + fm(cs.openingAmount), cs.id);
      toast('Caixa aberto'); render();
    },
  });
};
ACT.cashMove = el => {
  const cs = openCash(); if (!cs) return;
  const t = el.dataset.t;
  openForm({
    title: t === 'sangria' ? 'Sangria — retirar dinheiro da gaveta' : 'Suprimento — colocar dinheiro na gaveta', size: 'sm',
    intro: t === 'sangria' ? 'Use para levar dinheiro ao cofre ou banco. Não é despesa: o dinheiro continua sendo da loja.' : 'Use para reforçar o troco.',
    fields: [{ k: 'amount', l: 'Valor', t: 'money', req: 1 }, { k: 'note', l: 'Motivo', ph: t === 'sangria' ? 'Ex.: depósito no banco' : 'Ex.: troco' }],
    onSubmit: v => {
      if (!(v.amount > 0)) return 'Informe um valor maior que zero.';
      cs.movements = cs.movements || [];
      cs.movements.push({ id: uid(), type: t, amount: r2(v.amount), note: v.note, at: nowS(), user: CUR.name });
      commit('registrou', 'Caixa', (t === 'sangria' ? 'Sangria de ' : 'Suprimento de ') + fm(v.amount) + (v.note ? ' — ' + v.note : ''), cs.id);
      toast(t === 'sangria' ? 'Sangria registrada' : 'Suprimento registrado'); render();
    },
  });
};
ACT.cashClose = () => {
  const cs = openCash(); if (!cs) return;
  const x = cashExpected(cs);
  openForm({
    title: 'Fechar caixa', submit: 'Fechar caixa',
    intro: 'Conte todo o dinheiro da gaveta e informe o valor. O esperado é <b>' + fm(x.expected) + '</b>.',
    fields: [{ k: 'counted', l: 'Dinheiro contado na gaveta', t: 'money', req: 1 }, { k: 'notes', l: 'Observação', t: 'textarea', ph: 'Explique a diferença, se houver' }],
    live: v => { const d = r2((v.counted || 0) - x.expected); return '<div class="preview"><div><span>Esperado</span><b>' + fm(x.expected) + '</b></div><div><span>Contado</span><b>' + fm(v.counted || 0) + '</b></div><div><span>Diferença</span><b class="' + moneyCls(d) + '">' + (d > 0 ? '+' : '') + fm(d) + '</b></div></div>' + (Math.abs(d) >= 0.01 ? '<p class="muted" style="margin-top:8px">' + (d < 0 ? 'Falta de caixa: o valor será lançado como quebra de caixa e contado nas perdas.' : 'Sobra de caixa: o valor será lançado como entrada.') + '</p>' : ''); },
    onSubmit: v => {
      const d = r2((v.counted || 0) - x.expected);
      cs.closedAt = nowS(); cs.closedBy = CUR.name; cs.closedById = CUR.id; cs.countedAmount = r2(v.counted || 0); cs.expectedAmount = x.expected; cs.difference = d; cs.notes = v.notes;
      if (Math.abs(d) >= 0.01) S.ledger.push({ id: uid(), type: d < 0 ? 'out' : 'in', date: today(), amount: Math.abs(d), categoryId: d < 0 ? 'quebra' : 'sobra', description: (d < 0 ? 'Falta' : 'Sobra') + ' no fechamento do caixa de ' + fd(cs.openedAt), status: 'pago', paidDate: today(), dueDate: today(), cashId: cs.id, createdAt: nowS() });
      commit('fechou', 'Caixa', 'Fechamento: esperado ' + fm(x.expected) + ', contado ' + fm(cs.countedAmount) + (Math.abs(d) >= 0.01 ? ', diferença ' + fm(d) : ', sem diferença'), cs.id);
      toast(Math.abs(d) < 0.01 ? 'Caixa fechado sem diferença' : 'Caixa fechado com diferença de ' + fm(d)); render();
    },
  });
};
ACT.cashView = el => {
  const c = S.cash.find(x => x.id === el.dataset.id); if (!c) return;
  const x = cashExpected(c);
  modal({ title: 'Caixa de ' + fd(c.openedAt), body: '<div class="kv"><div><span>Aberto</span><b>' + fdt(c.openedAt) + ' por ' + esc(c.openedBy) + '</b></div><div><span>Fechado</span><b>' + fdt(c.closedAt) + ' por ' + esc(c.closedBy) + '</b></div><div><span>Abertura</span><b>' + fm(c.openingAmount) + '</b></div><div><span>Vendas em dinheiro</span><b>' + fm(x.sales) + ' (' + x.count + ')</b></div><div><span>Suprimentos</span><b>' + fm(x.sup) + '</b></div><div><span>Sangrias</span><b>' + fm(x.sang) + '</b></div><div><span>Esperado</span><b>' + fm(c.expectedAmount) + '</b></div><div><span>Contado</span><b>' + fm(c.countedAmount) + '</b></div><div><span>Diferença</span><b class="' + moneyCls(c.difference) + '">' + fm(c.difference) + '</b></div></div>' + (c.notes ? '<div class="note">' + esc(c.notes) + '</div>' : '') });
};

/* ---------- 2. Vendas e desempenho comercial ---------- */
function pgVendas() {
  const r = curRange(), c = calc(r), cp = calc(prevRange(r, UI.period.id));
  const bk = buckets(r);
  const tab = curTab('ven', 'geral');
  let h = pageHead('2 · Vendas e desempenho comercial', 'Vendas', 'Faturamento, ticket médio, número de vendas e margem de lucro de cada produto.', '<a class="btn pri" href="#vender">' + ic('plus', 'sm') + 'Nova venda</a>' + (isAdmin() ? '<button class="btn" data-act="exportSales">' + ic('download', 'sm') + 'Exportar</button>' : ''));
  h += kpis([
    { l: 'Faturamento total', v: fm(c.revenue), d: delta(c.revenue, cp.revenue), i: 'fat', cls: 'hl' },
    { l: 'Ticket médio', v: fm(c.ticket), d: delta(c.ticket, cp.ticket), s: f1(div(c.items, c.count)) + ' itens por venda', i: 'ticket' },
    { l: 'Número de vendas realizadas', v: fi(c.count), d: delta(c.count, cp.count), s: fi(c.items) + ' itens vendidos', i: 'nvendas' },
    { l: 'Margem de contribuição', v: fp(c.mcPct), s: fm(c.mc) + ' · descontos ' + fm(c.discounts), i: 'mc' },
  ]);
  h += tabs('ven', [['geral', 'Desempenho'], ['produtos', 'Margem por produto'], ['lista', 'Vendas registradas']], tab);
  if (tab === 'geral') {
    const pmRows = [...groupBy(c.sales, s => s.paymentMethodId)].map(([k, v]) => ({ l: pmName(k), v: sum(v, s => s.total), sub: fi(v.length) })).sort((a, b) => b.v - a.v);
    const wd = [1, 2, 3, 4, 5, 6, 0].map(d => { const ss = c.sales.filter(s => parseD(s.date).getDay() === d); return { l: SEMANA[d], v: sum(ss, s => s.total), sub: fi(ss.length) }; });
    const hours = []; for (let x = 7; x <= 22; x++) hours.push(x);
    const byH = hours.map(x => c.sales.filter(s => +s.date.slice(11, 13) === x).length);
    h += card('Faturamento por ' + bk.kind, chart({ type: 'bar', labels: bk.keys, series: [{ name: 'Faturamento', values: seriesOf(bk, c.sales, s => s.date, s => s.total), c: '--s1' }], h: 230, xf: bk.label, xt: bk.title, aria: 'Faturamento por ' + bk.kind }));
    h += '<div class="grid2">' + card('Por forma de pagamento', hbars(pmRows)) + card('Por dia da semana', hbars(wd)) + '</div>';
    h += card('Horários de pico (número de vendas)', chart({ type: 'bar', labels: hours, series: [{ name: 'Vendas', values: byH, c: '--s1' }], h: 180, xf: x => x + 'h', xt: x => 'Das ' + x + 'h às ' + x + 'h59', yf: v => fi(v), vf: v => plural(v, 'venda', 'vendas') }));
  } else if (tab === 'produtos') {
    const rows = productPerf(r);
    h += card('Margem de lucro por produto', table('pperf', {
      rows, sort: 'rev', ph: 'Buscar produto', empty: 'Nenhuma venda no período',
      text: x => x.name,
      cols: [
        { k: 'name', l: 'Produto', f: x => '<b>' + esc(x.name) + '</b>', s: x => x.name },
        { k: 'abc', l: 'Curva', f: x => '<span class="tag">' + x.abc + '</span>', s: x => x.abc },
        { k: 'qty', l: 'Qtd.', num: 1, f: x => fn(x.qty), s: x => x.qty },
        { k: 'rev', l: 'Faturamento', num: 1, f: x => fm(x.rev), s: x => x.rev },
        { k: 'cmv', l: 'Custo', num: 1, f: x => fm(x.cmv + x.varc), s: x => x.cmv + x.varc },
        { k: 'profit', l: 'Lucro bruto', num: 1, f: x => '<span class="' + moneyCls(x.profit) + '">' + fm(x.profit) + '</span>', s: x => x.profit },
        { k: 'margin', l: 'Margem', num: 1, f: x => chip(fp(x.margin), x.margin < 0.25 ? (x.margin < 0.1 ? 'crit' : 'warn') : 'good'), s: x => x.margin },
      ],
    }), { i: 'margemprod', sub: 'Custo = mercadoria + parte proporcional de impostos, taxas e comissões. Curva A: produtos que somam 80% do faturamento.' });
  } else {
    const st = UI.filters.venSt || 'todas';
    const all = S.sales.filter(s => inR(s.date, r)).sort((a, b) => (a.date < b.date ? 1 : -1));
    const rows = st === 'todas' ? all : st === 'canceladas' ? all.filter(s => s.status === 'cancelada') : st === 'pedidos' ? all.filter(s => s.fulfillment) : all.filter(s => s.error);
    h += card('Vendas registradas', '<div class="chips-f" style="margin-bottom:10px">' + [['todas', 'Todas'], ['pedidos', 'Pedidos'], ['erros', 'Com erro'], ['canceladas', 'Canceladas']].map(([k, l]) => '<button class="' + (st === k ? 'on' : '') + '" data-act="filt" data-f="venSt" data-v="' + k + '">' + l + '</button>').join('') + '</div>' + table('sales', {
      rows, act: 'saleView', ph: 'Buscar nº, cliente, vendedor…',
      text: s => '#' + s.number + ' ' + custName(s.customerId) + ' ' + empName(s.employeeId) + ' ' + pmName(s.paymentMethodId),
      empty: 'Nenhuma venda no período', emptyBtn: '<a class="btn sm pri" href="#vender">Nova venda</a>',
      cols: [
        { k: 'n', l: 'Venda', f: s => '<b class="mono">#' + s.number + '</b><small class="muted">' + fdt(s.date) + '</small>', s: s => s.number },
        { k: 'c', l: 'Cliente', f: s => esc(custName(s.customerId)), s: s => custName(s.customerId) },
        { k: 'e', l: 'Vendedor', f: s => esc(empName(s.employeeId)), s: s => empName(s.employeeId) },
        { k: 'p', l: 'Pagamento', f: s => esc(pmName(s.paymentMethodId)), s: s => pmName(s.paymentMethodId) },
        { k: 'st', l: 'Situação', f: s => s.status === 'cancelada' ? chip('Cancelada', 'crit') : s.error ? chip('Com erro', 'warn') : s.fulfillment && !s.fulfillment.deliveredAt ? chip('Pedido em aberto', 'info') : chip('Concluída', 'good'), s: s => s.status },
        { k: 't', l: 'Total', num: 1, f: s => '<b>' + fm(s.total) + '</b>', s: s => s.total },
      ],
    }));
  }
  return h;
}
ACT.saleView = el => saleDetail(el.dataset.id);
function saleDetail(id) {
  const s = ix().sale.get(id); if (!s) return;
  const f = s.fulfillment;
  const rv = S.reviews.filter(x => x.saleId === s.id), cp = S.complaints.filter(x => x.saleId === s.id);
  const body = '<div class="kv"><div><span>Data</span><b>' + fdt(s.date) + '</b></div><div><span>Cliente</span><b>' + esc(custName(s.customerId)) + '</b></div><div><span>Vendedor</span><b>' + esc(empName(s.employeeId)) + '</b></div><div><span>Canal</span><b>' + esc(chName(s.channelId)) + '</b></div><div><span>Pagamento</span><b>' + esc(pmName(s.paymentMethodId)) + '</b></div><div><span>Registrada por</span><b>' + esc(ix().user.get(s.userId)?.name || '—') + '</b></div></div>' +
    (s.status === 'cancelada' ? '<div class="banner warn" style="margin-bottom:12px"><p><b>Venda cancelada</b> em ' + fdt(s.cancelledAt) + ' por ' + esc(s.cancelledBy) + '. Motivo: ' + esc(s.cancelReason) + '</p></div>' : '') +
    '<div class="tbl-wrap"><table class="rt"><thead><tr><th>Item</th><th class="num">Qtd.</th><th class="num">Preço</th><th class="num">Total</th></tr></thead><tbody>' + s.items.map(i => '<tr><td class="main" data-l="Item"><b>' + esc(i.name) + '</b></td><td class="num" data-l="Qtd.">' + fn(i.qty) + '</td><td class="num" data-l="Preço">' + fm(i.price) + '</td><td class="num" data-l="Total">' + fm(i.qty * i.price - (i.discount || 0)) + '</td></tr>').join('') + '</tbody></table></div>' +
    '<div class="tot-lines"><div><span class="muted">Subtotal</span><span>' + fm(s.subtotal) + '</span></div>' + (s.discount ? '<div><span class="muted">Desconto</span><span>− ' + fm(s.discount) + '</span></div>' : '') + (f && f.shippingCharged ? '<div><span class="muted">Entrega</span><span>+ ' + fm(f.shippingCharged) + '</span></div>' : '') + '<div class="big"><span>Total</span><span>' + fm(s.total) + '</span></div>' + (isAdmin() ? '<div><small class="muted">Custo da mercadoria ' + fm(sum(s.items, i => i.qty * i.cost)) + ' · taxa ' + fm(s.fee) + ' · imposto ' + fm(s.tax) + ' · comissão ' + fm(s.commission) + '</small></div>' : '') + '</div>' +
    (f ? '<div class="note" style="margin-top:8px"><b>' + (f.type === 'retirada' ? 'Retirada' : 'Entrega') + '</b> · prazo ' + fdt(f.promisedAt) + ' · ' + (f.deliveredAt ? 'entregue em ' + fdt(f.deliveredAt) : f.processedAt ? 'pronto/enviado em ' + fdt(f.processedAt) : 'aguardando preparo') + (f.address ? '<br>' + esc(f.address) : '') + '</div>' : '') +
    (s.error ? '<div class="banner warn" style="margin-top:8px"><p><b>Erro registrado:</b> ' + esc(s.error.type) + (s.error.note ? ' — ' + esc(s.error.note) : '') + '</p></div>' : '') +
    (rv.length ? '<p style="margin-top:8px">Avaliação: ' + stars(rv[0].rating) + ' ' + esc(rv[0].comment || '') + '</p>' : '') + (cp.length ? '<p style="margin-top:4px">Reclamação: ' + esc(cp[0].description) + ' ' + chip(cp[0].status === 'resolvida' ? 'Resolvida' : 'Em aberto', cp[0].status === 'resolvida' ? 'good' : 'warn') + '</p>' : '') +
    (s.notes ? '<p class="muted" style="margin-top:8px">Obs.: ' + esc(s.notes) + '</p>' : '');
  const canc = s.status !== 'cancelada';
  const m = modal({
    title: 'Venda #' + s.number, size: 'lg', body,
    foot: '<button type="button" class="btn sm" data-act="saleCopy" data-id="' + s.id + '">' + ic('copy', 'sm') + 'Comprovante</button>' + (canc ? '<button type="button" class="btn sm" data-act="reviewNew" data-sale="' + s.id + '">' + ic('star', 'sm') + 'Avaliação</button><button type="button" class="btn sm" data-act="complaintNew" data-sale="' + s.id + '">Reclamação</button><button type="button" class="btn sm" data-act="saleError" data-id="' + s.id + '">' + (s.error ? 'Editar erro' : 'Registrar erro') + '</button><button type="button" class="btn sm" data-act="saleEdit" data-id="' + s.id + '">' + ic('edit', 'sm') + 'Editar</button>' : '') + '<span class="sp"></span>' + (canc && isAdmin() ? '<button type="button" class="btn sm ghost danger" data-act="saleCancel" data-id="' + s.id + '">Cancelar venda</button>' : ''),
  });
  m.el.addEventListener('click', e => { if (e.target.closest('[data-act]') && !e.target.closest('[data-act="saleCopy"]')) m.close(); });
}
ACT.saleCopy = el => { const s = ix().sale.get(el.dataset.id); if (s) copyText(receiptText(s), 'Comprovante copiado'); };
ACT.saleEdit = el => {
  const s = ix().sale.get(el.dataset.id); if (!s) return;
  openForm({
    title: 'Editar venda #' + s.number, intro: 'Para mudar itens ou valores, cancele a venda e registre de novo. Assim o histórico fica correto.',
    fields: [
      { k: 'customerId', l: 'Cliente', t: 'select', opts: () => [['', 'Consumidor não identificado']].concat(S.customers.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(c => [c.id, c.name])) },
      { k: 'channelId', l: 'Canal', t: 'select', half: 1, opts: () => S.config.channels.map(c => [c.id, c.name]) },
      { k: 'employeeId', l: 'Vendedor', t: 'select', half: 1, opts: () => [['', 'Sem vendedor']].concat(S.employees.map(e => [e.id, e.name])) },
      { k: 'notes', l: 'Observações' },
    ],
    values: { customerId: s.customerId || '', channelId: s.channelId, employeeId: s.employeeId || '', notes: s.notes },
    onSubmit: v => {
      const ch = [];
      if ((v.customerId || null) !== s.customerId) ch.push('cliente: ' + custName(s.customerId) + ' → ' + custName(v.customerId || null));
      if (v.channelId !== s.channelId) ch.push('canal: ' + chName(s.channelId) + ' → ' + chName(v.channelId));
      if ((v.employeeId || null) !== s.employeeId) {
        ch.push('vendedor: ' + empName(s.employeeId) + ' → ' + empName(v.employeeId || null));
        const emp = ix().emp.get(v.employeeId); const goods = s.total - (s.fulfillment?.shippingCharged || 0);
        s.commission = r2(goods * (emp ? (emp.commissionPct ?? S.config.defaultCommission ?? 0) : 0) / 100);
      }
      s.customerId = v.customerId || null; s.channelId = v.channelId; s.employeeId = v.employeeId || null; s.notes = v.notes;
      commit('editou', 'Venda', 'Venda #' + s.number + (ch.length ? ' — ' + ch.join('; ') : ' — observações'), s.id);
      toast('Venda atualizada'); render();
    },
  });
};
ACT.saleCancel = el => {
  const s = ix().sale.get(el.dataset.id); if (!s) return;
  openForm({
    title: 'Cancelar venda #' + s.number, submit: 'Cancelar venda', size: 'sm',
    intro: 'Os produtos voltam para o estoque e o valor sai do financeiro. O cancelamento fica registrado no histórico.',
    fields: [{ k: 'reason', l: 'Motivo do cancelamento', req: 1, ph: 'Ex.: cliente desistiu, troca, lançamento errado' }],
    onSubmit: v => { cancelSale(s, v.reason); toast('Venda cancelada'); render(); },
  });
};
const ERR_TYPES = ['Produto errado', 'Tamanho ou cor errada', 'Item faltando', 'Avaria no envio', 'Cobrança errada', 'Endereço errado', 'Outro'];
ACT.saleError = el => {
  const s = ix().sale.get(el.dataset.id); if (!s) return;
  openForm({
    title: 'Erro no pedido #' + s.number, size: 'sm',
    fields: [{ k: 'type', l: 'Tipo de erro', t: 'select', opts: ERR_TYPES.map(x => [x, x]) }, { k: 'note', l: 'O que aconteceu', t: 'textarea' }],
    values: s.error || { type: ERR_TYPES[0] },
    danger: s.error ? { l: 'Remover erro', f: () => { s.error = null; commit('editou', 'Venda', 'Removeu o erro registrado na venda #' + s.number, s.id); render(); } } : null,
    onSubmit: v => { const had = !!s.error; s.error = { type: v.type, note: v.note, at: nowS(), user: CUR.name }; commit(had ? 'editou' : 'registrou', 'Erro no pedido', 'Venda #' + s.number + ': ' + v.type, s.id); toast('Erro registrado'); render(); },
  });
};
ACT.exportSales = () => {
  const r = curRange();
  const rows = S.sales.filter(s => inR(s.date, r));
  const data = csv(rows, [['Número', s => s.number], ['Data', s => fdt(s.date)], ['Situação', s => s.status], ['Cliente', s => custName(s.customerId)], ['Vendedor', s => empName(s.employeeId)], ['Canal', s => chName(s.channelId)], ['Pagamento', s => pmName(s.paymentMethodId)], ['Itens', s => s.items.map(i => i.qty + 'x ' + i.name).join(' | ')], ['Subtotal', s => s.subtotal], ['Desconto', s => s.discount], ['Total', s => s.total], ['Taxa', s => s.fee], ['Custo mercadoria', s => sum(s.items, i => i.qty * i.cost)]]);
  exportFile('vendas_' + r.from + '_' + r.to + '.csv', data, 'text/csv;charset=utf-8');
};
function exportFile(name, data, type) {
  download(name, data, type);
  const m = modal({ title: 'Arquivo gerado', size: 'sm', body: '<p>O arquivo <b>' + esc(name) + '</b> foi enviado para a pasta de downloads. Se o download não começar, copie o conteúdo e cole em um arquivo de texto ou planilha.</p>', foot: '<button type="button" class="btn" id="ex-copy">' + ic('copy', 'sm') + 'Copiar conteúdo</button><span class="sp"></span><button type="button" class="btn pri" data-close>Pronto</button>' });
  $('#ex-copy', m.el).onclick = () => copyText(data.replace(/^﻿/, ''), 'Conteúdo copiado');
}
