/* ============================================================
   Telas: operação, fornecedores, precificação, planejamento, segurança, satisfação
   ============================================================ */

/* ---------- 7. Operação e logística ---------- */
function pgOperacao() {
  const r = curRange(), o = opsMetrics(r), op = opsMetrics(prevRange(r, UI.period.id));
  const now = nowS();
  let h = pageHead('7 · Operação e logística', 'Pedidos e entregas', 'Acompanhe os pedidos de entrega e retirada, o tempo de preparo, os atrasos e os erros.', '<a class="btn pri" href="#vender">' + ic('plus', 'sm') + 'Novo pedido</a>');
  h += kpis([
    { l: 'Tempo médio de processamento', v: fdur(o.proc), d: o.procN && op.procN ? delta(o.proc, op.proc, false) : '', s: plural(o.procN, 'pedido preparado', 'pedidos preparados'), i: 'tproc' },
    { l: 'Entregas no prazo', v: o.deliv.length ? fp(o.onTimePct, 0) : '—', d: o.deliv.length && op.deliv.length ? delta(o.onTimePct, op.onTimePct) : '', s: fi(o.onTime.length) + ' de ' + fi(o.deliv.length) + ' entregues', i: 'noprazo', cls: 'hl' },
    { l: 'Taxa de erros nos pedidos', v: fp(o.errPct), d: delta(o.errPct, op.errPct, false), s: plural(o.errs.length, 'erro registrado', 'erros registrados'), i: 'erros' },
    { l: 'Custo operacional por pedido', v: fm(o.opCost), d: delta(o.opCost, op.opCost, false), s: 'em ' + plural(o.count, 'venda', 'vendas'), i: 'custoped' },
    { l: 'Pedidos em aberto', v: fi(o.open.length), s: plural(o.late.length, 'atrasado', 'atrasados'), cls: o.late.length ? 'alert' : '' },
  ]);
  const prep = o.open.filter(s => !s.fulfillment.processedAt).sort((a, b) => ((a.fulfillment.promisedAt || '') < (b.fulfillment.promisedAt || '') ? -1 : 1));
  const sent = o.open.filter(s => s.fulfillment.processedAt).sort((a, b) => ((a.fulfillment.promisedAt || '') < (b.fulfillment.promisedAt || '') ? -1 : 1));
  const ocard = s => {
    const f = s.fulfillment; const late = f.promisedAt && f.promisedAt < now; const todayP = f.promisedAt && f.promisedAt.slice(0, 10) === today();
    return '<div class="oc"><div class="oc-h"><b class="mono">#' + s.number + '</b>' + (late ? chip('Atrasado', 'crit') : todayP ? chip('Para hoje', 'warn') : chip(f.type === 'retirada' ? 'Retirada' : 'Entrega', 'info')) + '</div><p><b>' + esc(custName(s.customerId)) + '</b> · ' + esc(s.items.map(i => i.qty + 'x ' + i.name).join(', ')) + '</p><p class="muted">Prazo: ' + fdt(f.promisedAt) + (f.address ? ' · ' + esc(f.address) : '') + '</p><div class="oc-a">' + (!f.processedAt ? '<button class="btn sm pri" data-act="ordProc" data-id="' + s.id + '">' + (f.type === 'retirada' ? 'Pronto para retirar' : 'Marcar como enviado') + '</button>' : '<button class="btn sm pri" data-act="ordDeliv" data-id="' + s.id + '">Marcar como entregue</button>') + '<button class="btn sm" data-act="ordEdit" data-id="' + s.id + '">Detalhes</button></div></div>';
  };
  h += '<div class="board"><div class="col"><h3>Aguardando preparo <span class="tag">' + prep.length + '</span></h3>' + (prep.map(ocard).join('') || '<p class="muted" style="padding:4px">Nenhum pedido aguardando.</p>') + '</div><div class="col"><h3>Prontos ou enviados <span class="tag">' + sent.length + '</span></h3>' + (sent.map(ocard).join('') || '<p class="muted" style="padding:4px">Nenhum pedido a caminho.</p>') + '</div></div>';
  const et = [...o.errTypes].map(([k, v]) => ({ l: k, v: v.length })).sort((a, b) => b.v - a.v);
  h += '<div class="grid2">' + card('Erros por tipo', hbars(et, v => plural(v, 'erro', 'erros'), { empty: 'Nenhum erro registrado no período' }), { i: 'erros', sub: 'Para registrar, abra a venda e toque em "Registrar erro".' }) +
    card('Pedidos por tipo', hbars([['entrega', 'Entrega'], ['retirada', 'Retirada na loja']].map(([k, l]) => ({ l, v: o.orders.filter(s => s.fulfillment.type === k).length })).filter(x => x.v), v => plural(v, 'pedido', 'pedidos'), { empty: 'Nenhum pedido no período' }) + '<p class="muted" style="margin-top:12px;font-size:13px">' + plural(o.count - o.orders.length, 'venda de balcão', 'vendas de balcão') + ' no período.</p>') + '</div>';
  h += card('Pedidos do período', table('ords', {
    rows: o.orders.slice().sort((a, b) => (a.date < b.date ? 1 : -1)), act: 'ordEdit', ph: 'Buscar nº ou cliente', text: s => '#' + s.number + ' ' + custName(s.customerId),
    empty: 'Nenhum pedido de entrega ou retirada no período', emptySub: 'Na tela de venda, marque "Pedido para entrega ou retirada".',
    cols: [
      { k: 'n', l: 'Pedido', f: s => '<b class="mono">#' + s.number + '</b><small class="muted">' + fdt(s.date) + ' · ' + esc(custName(s.customerId)) + '</small>', s: s => s.number },
      { k: 'p', l: 'Preparo', f: s => (s.fulfillment.processedAt ? fdur(diffHours(s.date, s.fulfillment.processedAt)) : '—'), s: s => (s.fulfillment.processedAt ? diffHours(s.date, s.fulfillment.processedAt) : 1e9) },
      { k: 'pr', l: 'Prazo', f: s => fdt(s.fulfillment.promisedAt), s: s => s.fulfillment.promisedAt || '' },
      { k: 'st', l: 'Situação', f: s => { const f = s.fulfillment; if (!f.deliveredAt) return f.promisedAt && f.promisedAt < now ? chip('Atrasado', 'crit') : chip('Em aberto', 'info'); return f.promisedAt && f.deliveredAt > f.promisedAt ? chip('Entregue com atraso', 'warn') : chip('Entregue no prazo', 'good'); } },
      { k: 't', l: 'Total', num: 1, f: s => fm(s.total), s: s => s.total },
    ],
  }));
  return h;
}
ACT.ordProc = el => { const s = ix().sale.get(el.dataset.id); if (!s) return; s.fulfillment.processedAt = nowS(); s.fulfillment.status = 'enviado'; commit('atualizou', 'Pedido', '#' + s.number + ' pronto/enviado', s.id); toast('Pedido #' + s.number + ' atualizado'); render(); };
ACT.ordDeliv = el => { const s = ix().sale.get(el.dataset.id); if (!s) return; s.fulfillment.deliveredAt = nowS(); if (!s.fulfillment.processedAt) s.fulfillment.processedAt = s.fulfillment.deliveredAt; s.fulfillment.status = 'entregue'; commit('atualizou', 'Pedido', '#' + s.number + ' entregue', s.id); toast('Pedido #' + s.number + ' entregue'); render(); };
ACT.ordEdit = el => {
  const s = ix().sale.get(el.dataset.id); if (!s || !s.fulfillment) return;
  const f = s.fulfillment;
  openForm({
    title: 'Pedido #' + s.number, intro: esc(custName(s.customerId)) + ' · ' + esc(s.items.map(i => i.qty + 'x ' + i.name).join(', ')) + ' · ' + fm(s.total),
    fields: [
      { k: 'type', l: 'Tipo', t: 'select', half: 1, opts: [['entrega', 'Entrega'], ['retirada', 'Retirada na loja']] },
      { k: 'promisedAt', l: 'Prazo prometido', t: 'datetime', half: 1 },
      { k: 'processedAt', l: 'Ficou pronto / foi enviado em', t: 'datetime', half: 1 },
      { k: 'deliveredAt', l: 'Entregue em', t: 'datetime', half: 1 },
      { k: 'shippingCost', l: 'Custo da entrega para a loja', t: 'money', half: 1 },
      { k: 'address', l: 'Endereço / observação' },
    ],
    values: { ...f },
    onSubmit: v => {
      if (v.processedAt && v.processedAt < s.date.slice(0, 16)) return 'A data de preparo não pode ser antes do pedido.';
      if (v.deliveredAt && v.processedAt && v.deliveredAt < v.processedAt) return 'A entrega não pode ser antes do preparo.';
      Object.assign(f, { type: v.type, promisedAt: v.promisedAt || null, processedAt: v.processedAt || null, deliveredAt: v.deliveredAt || null, shippingCost: r2(v.shippingCost), address: v.address });
      f.status = f.deliveredAt ? 'entregue' : f.processedAt ? 'enviado' : 'novo';
      commit('editou', 'Pedido', '#' + s.number, s.id); toast('Pedido atualizado'); render();
    },
  });
};

/* ---------- 8. Fornecedores e compras ---------- */
function pgFornecedores() {
  const r = curRange(), su = supMetrics(r), sp = supMetrics(prevRange(r, UI.period.id));
  const tab = curTab('for', 'compras');
  let h = pageHead('8 · Fornecedores e compras', 'Fornecedores e compras', 'Quanto você gasta para comprar mercadoria, quanto os fornecedores demoram e quanto prazo eles dão.', '<button class="btn pri" data-act="buyNew">' + ic('plus', 'sm') + 'Nova compra</button><button class="btn" data-act="supNew">Novo fornecedor</button>');
  h += kpis([
    { l: 'Custo de aquisição dos produtos', v: fm(su.total), d: delta(su.total, sp.total, false), s: plural(su.ps.length, 'compra', 'compras') + ' no período', i: 'custoaq' },
    { l: 'Prazo médio de entrega', v: su.recvN ? f1(su.lead).replace(',0', '') + ' dias' : '—', d: su.recvN && sp.recvN ? delta(su.lead, sp.lead, false) : '', i: 'prazoent' },
    { l: 'Prazo médio de pagamento', v: su.ps.length ? fi(su.term) + ' dias' : '—', s: 'Giro do estoque: ' + (isFinite(stockMetrics(r).cover) ? fi(stockMetrics(r).cover) + ' dias' : '—'), i: 'prazopag' },
    { l: 'Entregas no prazo', v: su.recvN ? fp(su.onTimePct, 0) : '—', s: fi(su.recvN) + ' compras recebidas', i: 'fornprazo', cls: 'hl' },
    { l: 'Aguardando entrega', v: fi(su.open.length), s: fm(sum(su.open, p => p.total)) + ' em compras' },
  ]);
  h += tabs('for', [['compras', 'Compras'], ['forn', 'Fornecedores'], ['custos', 'Custo por produto']], tab);
  if (tab === 'compras') {
    const rows = S.purchases.filter(p => inR(p.orderDate, r) || p.status === 'pedido').sort((a, b) => (a.orderDate < b.orderDate ? 1 : -1));
    h += card('', table('purch', {
      rows, act: 'buyView', ph: 'Buscar fornecedor ou nº', text: p => '#' + p.number + ' ' + supName(p.supplierId),
      empty: 'Nenhuma compra no período', emptyBtn: '<button class="btn sm pri" data-act="buyNew">Registrar compra</button>',
      cols: [
        { k: 'n', l: 'Compra', f: p => '<b>' + esc(supName(p.supplierId)) + '</b><small class="muted">#' + p.number + ' · pedido em ' + fd(p.orderDate) + '</small>', s: p => p.orderDate },
        { k: 'i', l: 'Itens', f: p => fi(sum(p.items, i => i.qty)) + ' un' },
        { k: 'e', l: 'Entrega', f: p => p.status === 'cancelada' ? chip('Cancelada') : p.receivedDate ? (p.expectedDate && p.receivedDate > p.expectedDate ? chip('Chegou com atraso', 'warn') : chip('Recebida ' + fds(p.receivedDate), 'good')) : (p.expectedDate && p.expectedDate < today() ? chip('Atrasada', 'crit') : chip('Prevista ' + (p.expectedDate ? fds(p.expectedDate) : '—'), 'info')) },
        { k: 'pg', l: 'Pagamento', f: p => { const e = S.ledger.find(x => x.purchaseId === p.id); return e ? ledStatus(e) : '—'; } },
        { k: 't', l: 'Total', num: 1, f: p => '<b>' + fm(p.total) + '</b>', s: p => p.total },
      ],
    }));
  } else if (tab === 'forn') {
    h += card('', table('sups', {
      rows: su.rows, act: 'supEdit', search: su.rows.length > 6, empty: 'Nenhum fornecedor cadastrado', emptyBtn: '<button class="btn sm pri" data-act="supNew">Cadastrar fornecedor</button>',
      cols: [
        { k: 'n', l: 'Fornecedor', f: x => '<b>' + esc(x.name) + '</b><small class="muted">' + esc([x.s.contact, x.s.phone].filter(Boolean).join(' · ')) + '</small>', s: x => x.name },
        { k: 'c', l: 'Compras', num: 1, f: x => fi(x.count), s: x => x.count },
        { k: 't', l: 'Total comprado', num: 1, f: x => fm(x.total), s: x => x.total },
        { k: 'l', l: 'Entrega média', num: 1, f: x => (x.rcN ? f1(x.lead).replace(',0', '') + ' dias' : '—'), s: x => x.lead },
        { k: 'o', l: 'No prazo', num: 1, f: x => (x.rcN ? chip(fp(x.onTime, 0), x.onTime >= 0.9 ? 'good' : x.onTime >= 0.7 ? 'warn' : 'crit') : '—'), s: x => x.onTime },
        { k: 'p', l: 'Prazo de pagamento', num: 1, f: x => (x.count ? fi(x.term) + ' dias' : fi(x.s.paymentTermDays || 0) + ' dias'), s: x => x.term },
      ],
    }), { sub: 'Valores das compras feitas no período escolhido.' });
  } else {
    const byP = new Map();
    for (const p of S.purchases) { if (p.status === 'cancelada') continue; for (const it of p.items) { if (!byP.has(it.productId)) byP.set(it.productId, []); byP.get(it.productId).push({ d: p.orderDate, c: it.unitCost, q: it.qty, sup: p.supplierId, inR: inR(p.orderDate, r) }); } }
    const rows = S.products.filter(p => p.active !== false).map(p => { const l = (byP.get(p.id) || []).sort((a, b) => (a.d < b.d ? -1 : 1)); const last = l[l.length - 1]; const prev = l[l.length - 2]; const pr = l.filter(x => x.inR); return { id: p.id, name: p.name, cost: p.cost, last: last ? last.c : null, lastD: last ? last.d : null, sup: last ? last.sup : p.supplierId, var: last && prev ? div(last.c - prev.c, prev.c) : null, avgR: pr.length ? div(sum(pr, x => x.c * x.q), sum(pr, x => x.q)) : null }; });
    h += card('Custo de aquisição por produto', table('pcost', {
      rows, ph: 'Buscar produto', text: x => x.name, sort: 'name', dir: 1,
      cols: [
        { k: 'name', l: 'Produto', f: x => '<b>' + esc(x.name) + '</b><small class="muted">' + esc(x.sup ? supName(x.sup) : '—') + '</small>', s: x => x.name.toLowerCase() },
        { k: 'last', l: 'Última compra', num: 1, f: x => (x.last !== null ? fm(x.last) + '<small class="muted" style="display:block">' + fd(x.lastD) + '</small>' : '—'), s: x => x.last || 0 },
        { k: 'var', l: 'Variação', num: 1, f: x => (x.var === null ? '—' : '<span class="' + (x.var > 0.004 ? 'neg' : x.var < -0.004 ? 'pos' : '') + '">' + (x.var > 0 ? '+' : '') + fp(x.var) + '</span>'), s: x => x.var || 0 },
        { k: 'avgR', l: 'Média no período', num: 1, f: x => (x.avgR !== null ? fm(x.avgR) : '—'), s: x => x.avgR || 0 },
        { k: 'cost', l: 'Custo médio atual', num: 1, f: x => '<b>' + fm(x.cost) + '</b>', s: x => x.cost },
      ],
    }), { sub: 'O custo médio atual é recalculado a cada compra recebida (média ponderada, com o frete rateado).' });
  }
  return h;
}
function supForm(s, onSaved) {
  const isNew = !s;
  openForm({
    title: isNew ? 'Novo fornecedor' : 'Editar fornecedor',
    fields: [
      { k: 'name', l: 'Nome / razão social', req: 1 }, { k: 'doc', l: 'CNPJ', half: 1 }, { k: 'contact', l: 'Contato', half: 1 },
      { k: 'phone', l: 'Telefone', half: 1, inputmode: 'tel' }, { k: 'email', l: 'E-mail', half: 1, inputmode: 'email' },
      { k: 'leadTimeDays', l: 'Prazo de entrega combinado (dias)', t: 'int', half: 1 }, { k: 'paymentTermDays', l: 'Prazo de pagamento (dias)', t: 'int', half: 1 },
      { k: 'notes', l: 'Observações', t: 'textarea' },
    ],
    values: s ? { ...s } : { leadTimeDays: 7, paymentTermDays: 30 },
    danger: !isNew ? { l: 'Excluir', f: async () => { if (S.purchases.some(p => p.supplierId === s.id)) { toast('Este fornecedor tem compras registradas e não pode ser excluído.', 'err'); return false; } const ok = await ask({ title: 'Excluir fornecedor', text: 'Excluir <b>' + esc(s.name) + '</b>?', ok: 'Excluir', danger: true }); if (!ok) return false; S.suppliers = S.suppliers.filter(x => x.id !== s.id); commit('excluiu', 'Fornecedor', s.name, s.id); render(); } } : null,
    onSubmit: v => {
      const data = { name: v.name, doc: v.doc, contact: v.contact, phone: v.phone, email: v.email, leadTimeDays: +v.leadTimeDays || 0, paymentTermDays: +v.paymentTermDays || 0, notes: v.notes };
      if (isNew) { const n = { id: uid(), ...data }; S.suppliers.push(n); commit('criou', 'Fornecedor', n.name, n.id); toast('Fornecedor cadastrado'); if (onSaved) onSaved(n); else render(); }
      else { Object.assign(s, data); commit('editou', 'Fornecedor', s.name, s.id); toast('Fornecedor atualizado'); render(); }
    },
  });
}
ACT.supNew = () => supForm(null);
ACT.supEdit = el => { const s = ix().sup.get(el.dataset.id); if (s) supForm(s); };
function receivePurchase(p, date, silent) {
  p.receivedDate = date; p.status = 'recebido';
  const goods = sum(p.items, i => i.qty * i.unitCost);
  for (const it of p.items) {
    const prod = ix().prod.get(it.productId) || S.products.find(x => x.id === it.productId); if (!prod) continue;
    const freightShare = goods ? (p.freight || 0) * (it.qty * it.unitCost / goods) / it.qty : 0;
    const uc = r2(it.unitCost + freightShare);
    const old = Math.max(0, prod.stock || 0);
    prod.cost = r2(old + it.qty > 0 ? (old * (+prod.cost || 0) + it.qty * uc) / (old + it.qty) : uc);
    addMove(prod.id, +it.qty, 'compra', p.id, uc, 'Compra #' + p.number + ' — ' + supName(p.supplierId), date + (date.length === 10 ? 'T' + nowS().slice(11) : ''));
  }
  if (!silent) commit('recebeu', 'Compra', 'Compra #' + p.number + ' de ' + supName(p.supplierId) + ' — ' + fm(p.total), p.id);
}
function purchaseForm(pre = {}) {
  if (!S.products.length) { toast('Cadastre os produtos primeiro.', 'err'); return; }
  const lines = pre.productId ? [{ productId: pre.productId, qty: pre.qty || 1, unitCost: ix().prod.get(pre.productId)?.cost || 0 }] : [{ productId: '', qty: 1, unitCost: 0 }];
  const sup0 = pre.supplierId || (pre.productId ? ix().prod.get(pre.productId)?.supplierId : '') || (S.suppliers[0]?.id || '');
  const prodOptsH = sel => '<option value="">Escolha o produto</option>' + S.products.filter(p => p.active !== false).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(p => '<option value="' + p.id + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.name) + '</option>').join('');
  const lineH = (l, i) => '<div class="line-row" data-li="' + i + '"><select data-lk="productId" aria-label="Produto">' + prodOptsH(l.productId) + '</select><input data-lk="qty" inputmode="decimal" value="' + esc(String(l.qty).replace('.', ',')) + '" aria-label="Quantidade"><input data-lk="unitCost" inputmode="decimal" value="' + esc(toInput(l.unitCost)) + '" aria-label="Custo unitário"><button type="button" class="icon-btn" data-ldel="' + i + '" aria-label="Remover linha">' + ic('x', 'sm') + '</button></div>';
  const sup = ix().sup.get(sup0);
  const m = modal({
    title: 'Nova compra de mercadoria', size: 'lg',
    body: '<div class="frm"><div class="fld"><label for="pu-s">Fornecedor</label><div class="row" style="flex-wrap:nowrap"><select id="pu-s" class="inp">' + (S.suppliers.length ? '' : '<option value="">Cadastre um fornecedor</option>') + S.suppliers.map(s => '<option value="' + s.id + '"' + (s.id === sup0 ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select><button type="button" class="btn" id="pu-ns">' + ic('plus', 'sm') + 'Novo</button></div></div>' +
      '<div class="fld half"><label for="pu-od">Data do pedido</label><input type="date" id="pu-od" value="' + today() + '"></div><div class="fld half"><label for="pu-ed">Previsão de entrega</label><input type="date" id="pu-ed" value="' + addDays(today(), sup ? sup.leadTimeDays || 7 : 7) + '"></div>' +
      '<div class="fld"><span class="lb">Produtos</span><div class="line-h"><span>Produto</span><span>Qtd.</span><span>Custo unit.</span><span></span></div><div class="lines" id="pu-lines">' + lines.map(lineH).join('') + '</div><button type="button" class="btn sm" id="pu-add" style="align-self:flex-start;margin-top:6px">' + ic('plus', 'sm') + 'Adicionar produto</button></div>' +
      '<div class="fld half"><label for="pu-fr">Frete</label><div class="inp-pre"><span>R$</span><input id="pu-fr" inputmode="decimal" placeholder="0,00"></div></div><div class="fld half"><label for="pu-dd">Vencimento do pagamento</label><input type="date" id="pu-dd" value="' + addDays(today(), sup ? sup.paymentTermDays || 30 : 30) + '"></div>' +
      '<div class="fld chk"><label class="ck"><input type="checkbox" id="pu-paid"><span>Já foi paga</span></label></div>' +
      '<div class="fld chk"><label class="ck"><input type="checkbox" id="pu-rec"><span>A mercadoria já chegou (dar entrada no estoque agora)</span></label></div>' +
      '<div class="fld"><label for="pu-n">Observações</label><input id="pu-n"></div><div class="frm-live g-wide" id="pu-tot"></div></div>',
    foot: '<span class="sp"></span><button type="button" class="btn" data-close>Cancelar</button><button type="button" class="btn pri" id="pu-ok">Salvar compra</button>',
  });
  const L = $('#pu-lines', m.el);
  const readLines = () => $$('.line-row', L).map(row => ({ productId: $('[data-lk="productId"]', row).value, qty: parseNum($('[data-lk="qty"]', row).value), unitCost: parseNum($('[data-lk="unitCost"]', row).value) }));
  const upd = () => { const ls = readLines(); const goods = sum(ls, l => l.qty * l.unitCost); const fr = parseNum($('#pu-fr', m.el).value); $('#pu-tot', m.el).innerHTML = '<div class="preview"><div><span>Mercadoria</span><b>' + fm(goods) + '</b></div><div><span>Frete</span><b>' + fm(fr) + '</b></div><div><span>Total da compra</span><b>' + fm(goods + fr) + '</b></div></div>'; };
  m.el.addEventListener('input', upd);
  m.el.addEventListener('change', e => {
    if (e.target.matches('[data-lk="productId"]')) { const p = ix().prod.get(e.target.value); const c = $('[data-lk="unitCost"]', e.target.closest('.line-row')); if (p && c && !parseNum(c.value)) c.value = toInput(p.cost); }
    if (e.target.id === 'pu-s') { const s = ix().sup.get(e.target.value); if (s) { $('#pu-ed', m.el).value = addDays($('#pu-od', m.el).value || today(), s.leadTimeDays || 7); $('#pu-dd', m.el).value = addDays($('#pu-od', m.el).value || today(), s.paymentTermDays || 30); } }
    upd();
  });
  m.el.addEventListener('click', e => { const d = e.target.closest('[data-ldel]'); if (d) { if ($$('.line-row', L).length > 1) d.closest('.line-row').remove(); upd(); } });
  $('#pu-add', m.el).onclick = () => { L.insertAdjacentHTML('beforeend', lineH({ productId: '', qty: 1, unitCost: 0 }, $$('.line-row', L).length)); };
  $('#pu-ns', m.el).onclick = () => supForm(null, s => { const sel = $('#pu-s', m.el); if (!S.suppliers.length || sel.options[0]?.value === '') sel.innerHTML = ''; sel.insertAdjacentHTML('beforeend', '<option value="' + s.id + '" selected>' + esc(s.name) + '</option>'); sel.value = s.id; sel.dispatchEvent(new Event('change', { bubbles: true })); });
  upd();
  $('#pu-ok', m.el).onclick = () => {
    const supplierId = $('#pu-s', m.el).value;
    const items = readLines().filter(l => l.productId && l.qty > 0);
    if (!supplierId) { toast('Escolha ou cadastre o fornecedor.', 'err'); return; }
    if (!items.length) { toast('Adicione pelo menos um produto com quantidade.', 'err'); return; }
    if (items.some(l => !(l.unitCost > 0))) { toast('Informe o custo unitário de cada produto.', 'err'); return; }
    const od = $('#pu-od', m.el).value || today();
    const freight = r2(parseNum($('#pu-fr', m.el).value));
    const p = { id: uid(), number: ++S.meta.purchaseSeq, supplierId, orderDate: od, expectedDate: $('#pu-ed', m.el).value || null, receivedDate: null, dueDate: $('#pu-dd', m.el).value || od, items, freight, total: r2(sum(items, l => l.qty * l.unitCost) + freight), status: 'pedido', notes: $('#pu-n', m.el).value, createdAt: nowS(), user: CUR.name };
    S.purchases.push(p);
    const paid = $('#pu-paid', m.el).checked;
    S.ledger.push({ id: uid(), type: 'out', date: od, amount: p.total, categoryId: 'mercadoria', description: 'Compra #' + p.number + ' — ' + supName(supplierId), purchaseId: p.id, status: paid ? 'pago' : 'pendente', paidDate: paid ? today() : null, dueDate: p.dueDate, createdAt: nowS() });
    commit('criou', 'Compra', 'Compra #' + p.number + ' de ' + supName(supplierId) + ' — ' + fm(p.total) + ' (' + plural(sum(items, i => i.qty), 'unidade', 'unidades') + ')', p.id);
    if ($('#pu-rec', m.el).checked) receivePurchase(p, today());
    m.close(); toast('Compra registrada'); render();
  };
}
ACT.buyNew = el => purchaseForm(el && el.dataset.p ? { productId: el.dataset.p, qty: (() => { const p = ix().prod.get(el.dataset.p); return p ? Math.max(1, Math.ceil((p.minStock || 1) * 2 - (p.stock || 0))) : 1; })() } : {});
ACT.buyView = el => {
  const p = ix().purchase.get(el.dataset.id); if (!p) return;
  const e = S.ledger.find(x => x.purchaseId === p.id);
  const m = modal({
    title: 'Compra #' + p.number + ' — ' + supName(p.supplierId), size: 'lg',
    body: '<div class="kv"><div><span>Pedido em</span><b>' + fd(p.orderDate) + '</b></div><div><span>Previsão</span><b>' + fd(p.expectedDate) + '</b></div><div><span>Recebida em</span><b>' + (p.receivedDate ? fd(p.receivedDate) : 'Aguardando') + '</b></div><div><span>Pagamento</span><b>' + (e ? (paidDate(e) ? 'Pago em ' + fd(paidDate(e)) : 'Vence ' + fd(e.dueDate)) : '—') + '</b></div><div><span>Frete</span><b>' + fm(p.freight) + '</b></div><div><span>Total</span><b>' + fm(p.total) + '</b></div></div>' +
      '<div class="tbl-wrap"><table class="rt"><thead><tr><th>Produto</th><th class="num">Qtd.</th><th class="num">Custo unit.</th><th class="num">Total</th></tr></thead><tbody>' + p.items.map(i => '<tr><td class="main" data-l="Produto"><b>' + esc(prodName(i.productId)) + '</b></td><td class="num" data-l="Qtd.">' + fn(i.qty) + '</td><td class="num" data-l="Custo unit.">' + fm(i.unitCost) + '</td><td class="num" data-l="Total">' + fm(i.qty * i.unitCost) + '</td></tr>').join('') + '</tbody></table></div>' + (p.notes ? '<p class="muted" style="margin-top:8px">' + esc(p.notes) + '</p>' : '') + (p.status === 'cancelada' ? '<div class="banner warn" style="margin-top:10px"><p>Compra cancelada.</p></div>' : ''),
    foot: (p.status === 'pedido' ? '<button type="button" class="btn sm pri" data-act="buyRecv" data-id="' + p.id + '">Receber mercadoria</button>' : '') + (e && !paidDate(e) ? '<button type="button" class="btn sm" data-act="ledPay" data-id="' + e.id + '">Registrar pagamento</button>' : '') + '<span class="sp"></span>' + (p.status === 'pedido' ? '<button type="button" class="btn sm ghost danger" data-act="buyCancel" data-id="' + p.id + '">Cancelar compra</button>' : ''),
  });
  m.el.addEventListener('click', ev => { if (ev.target.closest('[data-act]')) m.close(); });
};
ACT.buyRecv = el => {
  const p = ix().purchase.get(el.dataset.id); if (!p) return;
  openForm({ title: 'Receber compra #' + p.number, size: 'sm', intro: 'Os produtos entram no estoque e o custo médio é atualizado, já com o frete rateado.', fields: [{ k: 'date', l: 'Data do recebimento', t: 'date', req: 1 }], values: { date: today() }, submit: 'Dar entrada no estoque', onSubmit: v => { receivePurchase(p, v.date); toast('Mercadoria recebida'); render(); } });
};
ACT.buyCancel = async el => {
  const p = ix().purchase.get(el.dataset.id); if (!p) return;
  const e = S.ledger.find(x => x.purchaseId === p.id);
  if (e && paidDate(e)) { toast('Esta compra já foi paga. Registre o reembolso do fornecedor como uma entrada.', 'err'); return; }
  const ok = await ask({ title: 'Cancelar compra #' + p.number, text: 'A compra e a conta a pagar serão canceladas.', ok: 'Cancelar compra', danger: true });
  if (!ok) return;
  p.status = 'cancelada'; S.ledger = S.ledger.filter(x => x.purchaseId !== p.id);
  commit('cancelou', 'Compra', 'Compra #' + p.number + ' de ' + supName(p.supplierId), p.id); toast('Compra cancelada'); render();
};

/* ---------- 9. Precificação e rentabilidade ---------- */
function pgPrecificacao() {
  const ctx = pricingCtx();
  const rows = S.products.filter(p => p.active !== false && p.price > 0).map(p => priceRow(p, ctx));
  const crit = rows.filter(x => x.status === 'crit'), warn = rows.filter(x => x.status === 'warn'), good = rows.filter(x => x.status === 'good');
  let h = pageHead('9 · Precificação e rentabilidade', 'Precificação', 'Custo, preço, margem de contribuição e preço mínimo sustentável de cada produto, com base nos números reais da sua loja.');
  h += '<div class="ctx"><span>Impostos <b>' + fp(ctx.taxPct) + '</b></span><span>Taxa média de pagamento <b>' + fp(ctx.feePct) + '</b></span><span>Comissão média <b>' + fp(ctx.commPct) + '</b></span><span>Despesas fixas <b>' + fp(ctx.fixedPct) + '</b> do faturamento</span><span>Margem desejada <b>' + fp(ctx.target, 0) + '</b></span>' + (isAdmin() ? '<a class="btn sm ghost" href="#config">Alterar</a>' : '') + '</div>';
  h += '<p class="muted" style="font-size:13px;margin-top:-6px">Taxas, comissões e despesas fixas são as médias dos últimos 90 dias. Impostos e margem desejada vêm das configurações.</p>';
  h += kpis([
    { l: 'Abaixo do preço mínimo', v: fi(crit.length), s: 'dão prejuízo a cada venda', i: 'precomin', cls: crit.length ? 'alert' : '' },
    { l: 'Abaixo do preço sugerido', v: fi(warn.length), s: 'lucram menos que a margem desejada', i: 'precosug' },
    { l: 'Com preço saudável', v: fi(good.length), s: 'de ' + plural(rows.length, 'produto', 'produtos') },
    { l: 'Margem de contribuição média', v: fp(avg(rows.map(x => x.mcPct))), s: 'Markup médio ' + f1(avg(rows.map(x => x.markup))) + 'x', i: 'mcprod', cls: 'hl' },
  ]);
  h += card('Preço de cada produto', table('price', {
    rows, act: 'priceSim', rowId: x => x.p.id, sort: 'status', dir: 1, ph: 'Buscar produto', text: x => x.p.name + ' ' + (x.p.category || ''),
    empty: 'Nenhum produto com preço cadastrado',
    cols: [
      { k: 'name', l: 'Produto', f: x => '<b>' + esc(x.p.name) + '</b><small class="muted">' + esc(x.p.category || '') + '</small>', s: x => x.p.name.toLowerCase() },
      { k: 'unit', l: 'Custo total', num: 1, f: x => fm(x.unit), s: x => x.unit },
      { k: 'price', l: 'Preço de venda', num: 1, f: x => '<b>' + fm(x.price) + '</b>', s: x => x.price },
      { k: 'mc', l: 'Margem de contribuição', num: 1, f: x => fm(x.mc) + ' <span class="muted">(' + fp(x.mcPct, 0) + ')</span>', s: x => x.mcPct },
      { k: 'min', l: 'Preço mínimo', num: 1, f: x => (isFinite(x.min) ? fm(x.min) : '—'), s: x => x.min },
      { k: 'sug', l: 'Preço sugerido', num: 1, f: x => (isFinite(x.sug) ? fm(x.sug) : '—'), s: x => x.sug },
      { k: 'status', l: 'Situação', f: x => (x.status === 'crit' ? chip('Prejuízo', 'crit') : x.status === 'warn' ? chip('Margem baixa', 'warn') : chip('Saudável', 'good')), s: x => (x.status === 'crit' ? 0 : x.status === 'warn' ? 1 : 2) },
    ],
  }), { sub: 'Toque em um produto para simular um novo preço.' });
  return h;
}
ACT.priceSim = el => {
  const p = ix().prod.get(el.dataset.id); if (!p) return;
  const ctx = pricingCtx(); const base = priceRow(p, ctx);
  const sold = productPerf({ from: addDays(today(), -29), to: today() }).find(x => x.id === p.id);
  openForm({
    title: 'Simular preço: ' + p.name, submit: isAdmin() ? 'Aplicar novo preço' : 'Fechar',
    intro: 'Custo total ' + fm(base.unit) + ' · preço atual ' + fm(base.price) + (sold ? ' · ' + fn(sold.qty) + ' vendidos nos últimos 30 dias' : ''),
    fields: [{ k: 'price', l: 'Novo preço de venda', t: 'money', req: 1 }],
    values: { price: p.price },
    live: v => { const x = priceRow({ ...p, price: v.price || 0 }, ctx); const q = sold ? sold.qty : 0; return '<div class="preview"><div><span>Margem de contribuição</span><b class="' + moneyCls(x.mc) + '">' + fm(x.mc) + ' (' + fp(x.mcPct, 0) + ')</b></div><div><span>Lucro por unidade</span><b class="' + moneyCls(x.profitUnit) + '">' + fm(x.profitUnit) + '</b></div><div><span>Preço mínimo</span><b>' + (isFinite(x.min) ? fm(x.min) : '—') + '</b></div><div><span>Preço sugerido</span><b>' + (isFinite(x.sug) ? fm(x.sug) : '—') + '</b></div>' + (q ? '<div><span>Lucro mensal no ritmo atual</span><b class="' + moneyCls(x.profitUnit * q) + '">' + fm(x.profitUnit * q) + '</b></div>' : '') + '</div><p style="margin-top:8px">' + (x.status === 'crit' ? chip('Prejuízo: abaixo do preço mínimo', 'crit') : x.status === 'warn' ? chip('Lucra, mas abaixo da margem desejada', 'warn') : chip('Preço saudável', 'good')) + '</p><p class="muted" style="font-size:12.5px;margin-top:6px">Lucro por unidade = preço − custo − impostos, taxas e comissão − parte das despesas fixas (' + fp(ctx.fixedPct) + ' do preço).</p>'; },
    onSubmit: v => {
      if (!isAdmin()) return;
      if (!(v.price > 0)) return 'Informe um preço válido.';
      if (r2(v.price) === p.price) return;
      const old = p.price; p.price = r2(v.price);
      commit('editou', 'Produto', p.name + ' — preço ' + fm(old) + ' → ' + fm(p.price) + ' (simulador de preço)', p.id);
      toast('Preço atualizado'); render();
    },
  });
};

/* ---------- 10. Planejamento e estratégia ---------- */
function pgPlanejamento() {
  const t = today(); const y = UI.planYear || +t.slice(0, 4); const cm = monthKey(t);
  const months = Array.from({ length: 12 }, (_, i) => y + '-' + pad(i + 1));
  const data = months.map(m => { const g = goalFor(m); const past = m <= cm; const c = past ? calc(monthRange(m)) : null; return { m, g, c, rev: c ? c.revenue : null, net: c ? c.net : null }; });
  const cur = data.find(x => x.m === cm) || data[0];
  const ytd = data.filter(x => x.m <= cm);
  const pj = projection(90);
  const inv = S.investments;
  const invTot = sum(inv, x => x.amount), retTot = sum(inv, x => x.returnAmount || 0);
  let h = pageHead('10 · Planejamento e estratégia', 'Planejamento', 'Metas de faturamento e lucro, projeção do caixa e retorno dos investimentos.', '<div class="month-sw"><button class="icon-btn" data-act="planYear" data-d="-1" aria-label="Ano anterior">' + ic('left') + '</button><b>' + y + '</b><button class="icon-btn" data-act="planYear" data-d="1" aria-label="Próximo ano">' + ic('right') + '</button></div><button class="btn pri" data-act="goalsYear">Definir metas do ano</button>');
  h += kpis([
    { l: 'Faturamento: previsto × realizado', v: cur.g.revenue ? fp(div(cur.rev || 0, cur.g.revenue), 0) : '—', s: fm(cur.rev || 0) + ' de ' + fm(cur.g.revenue) + ' em ' + MESES[+cur.m.slice(5) - 1], i: 'fatprev', cls: 'hl' },
    { l: 'Lucro: previsto × realizado', v: cur.g.profit ? fp(div(cur.net || 0, cur.g.profit), 0) : '—', s: fm(cur.net || 0) + ' de ' + fm(cur.g.profit) + ' no mês', i: 'lucroprev' },
    { l: 'Acumulado no ano', v: fm(sum(ytd, x => x.rev || 0)), s: 'Meta até agora ' + fm(sum(ytd, x => x.g.revenue)) + ' · lucro ' + fm(sum(ytd, x => x.net || 0)) },
    { l: 'Retorno sobre investimentos (ROI)', v: invTot ? fp(div(retTot - invTot, invTot), 0) : '—', s: fm(invTot) + ' investidos · ' + fm(retTot) + ' de retorno', i: 'roi' },
  ]);
  const lbl = months;
  h += '<div class="grid2">' + card('Faturamento previsto × realizado', chart({ type: 'bar', labels: lbl, series: [{ name: 'Previsto (meta)', values: data.map(x => x.g.revenue), c: '--s2' }, { name: 'Realizado', values: data.map(x => x.rev || 0), c: '--s1' }], h: 220, xf: k => MES_C[+k.slice(5) - 1], xt: monthLabel }), { i: 'fatprev' }) +
    card('Lucro previsto × realizado', chart({ type: 'bar', labels: lbl, series: [{ name: 'Previsto (meta)', values: data.map(x => x.g.profit), c: '--s2' }, { name: 'Realizado', values: data.map(x => x.net || 0), c: '--s1' }], h: 220, xf: k => MES_C[+k.slice(5) - 1], xt: monthLabel }), { i: 'lucroprev' }) + '</div>';
  h += card('Metas por mês', table('goals', {
    rows: data, act: 'goalEdit', rowId: x => x.m, search: false, limit: 12,
    cols: [
      { k: 'm', l: 'Mês', f: x => '<b style="text-transform:capitalize">' + MESES[+x.m.slice(5) - 1] + '</b>' + (x.g.custom ? '' : '<small class="muted">meta padrão</small>') },
      { k: 'gr', l: 'Meta de faturamento', num: 1, f: x => fm(x.g.revenue) },
      { k: 'r', l: 'Realizado', num: 1, f: x => (x.rev === null ? '—' : fm(x.rev)) },
      { k: 'p', l: '% da meta', num: 1, f: x => (x.rev === null || !x.g.revenue ? '—' : chip(fp(div(x.rev, x.g.revenue), 0), div(x.rev, x.g.revenue) >= 1 ? 'good' : x.m === cm ? 'info' : div(x.rev, x.g.revenue) >= 0.85 ? 'warn' : 'crit')) },
      { k: 'gp', l: 'Meta de lucro', num: 1, f: x => fm(x.g.profit) },
      { k: 'n', l: 'Lucro realizado', num: 1, f: x => (x.net === null ? '—' : '<span class="' + moneyCls(x.net) + '">' + fm(x.net) + '</span>') },
    ],
  }), { sub: 'Toque em um mês para alterar a meta. O mês atual mostra o realizado até hoje.' });
  const p30 = pj.b[30], p60 = pj.b[60], p90 = pj.b[90];
  h += card('Projeção de fluxo de caixa — próximos 90 dias', '<div class="kpis' + (pj.minB < 0 ? ' odd' : '') + '" style="margin-bottom:14px">' + (pj.minB < 0 ? kpi({ l: 'Atenção', v: '<span class="neg">' + fm(pj.minB) + '</span>', s: 'O saldo pode ficar negativo em ' + fd(pj.minD) + '. Antecipe recebimentos ou adie compras.', cls: 'alert' }) : '') + kpi({ l: 'Saldo hoje', v: fm(pj.start) }) + kpi({ l: 'Em 30 dias', v: '<span class="' + moneyCls(p30) + '">' + fm(p30) + '</span>' }) + kpi({ l: 'Em 60 dias', v: '<span class="' + moneyCls(p60) + '">' + fm(p60) + '</span>' }) + kpi({ l: 'Em 90 dias', v: '<span class="' + moneyCls(p90) + '">' + fm(p90) + '</span>', s: 'Ritmo médio ' + fm(pj.trend) + ' por dia' }) + '</div>' +
    chart({ type: 'line', labels: pj.labels, series: [{ name: 'Com tendência de vendas e gastos', values: pj.b, c: '--s1' }, { name: 'Somente contas já agendadas', values: pj.a, c: '--s2', dash: true }], h: 240, xf: fds, xt: k => fd(k), allowEmpty: true, aria: 'Projeção do saldo' }), { i: 'projecao' });
  h += card('Investimentos e retorno (ROI)', table('invs', {
    rows: inv.slice().sort((a, b) => (a.date < b.date ? 1 : -1)), act: 'invEdit', search: false,
    empty: 'Nenhum investimento registrado', emptySub: 'Registre reformas, equipamentos, cursos… e quanto cada um trouxe de retorno.', emptyBtn: '<button class="btn sm pri" data-act="invNew">Registrar investimento</button>',
    tools: '<button class="btn sm pri" data-act="invNew">' + ic('plus', 'sm') + 'Novo investimento</button>',
    cols: [
      { k: 'n', l: 'Investimento', f: x => '<b>' + esc(x.name) + '</b><small class="muted">' + fd(x.date) + '</small>' },
      { k: 'a', l: 'Investido', num: 1, f: x => fm(x.amount) },
      { k: 'r', l: 'Retorno obtido', num: 1, f: x => fm(x.returnAmount || 0) },
      { k: 'roi', l: 'ROI', num: 1, f: x => { const v = div((x.returnAmount || 0) - x.amount, x.amount); return chip(fp(v, 0), v >= 0 ? 'good' : 'crit'); } },
    ],
  }), { i: 'roi' });
  return h;
}
ACT.planYear = el => { UI.planYear = (UI.planYear || +today().slice(0, 4)) + (+el.dataset.d); render(); };
ACT.goalEdit = el => {
  const m = el.dataset.id; const g = goalFor(m);
  openForm({
    title: 'Meta de ' + monthLabel(m), size: 'sm',
    fields: [{ k: 'revenue', l: 'Meta de faturamento', t: 'money', req: 1 }, { k: 'profit', l: 'Meta de lucro líquido', t: 'money' }],
    values: { revenue: g.revenue, profit: g.profit },
    onSubmit: v => { S.goals[m] = { revenue: r2(v.revenue), profit: r2(v.profit) }; commit('definiu', 'Meta', monthLabel(m) + ': faturamento ' + fm(v.revenue) + ', lucro ' + fm(v.profit)); toast('Meta salva'); render(); },
  });
};
ACT.goalsYear = () => {
  const y = UI.planYear || +today().slice(0, 4);
  const last = calc({ from: addDays(today(), -89), to: today() });
  const base = r2(Math.round(last.revenue / 3 / 100) * 100) || S.config.monthlyGoal || 10000;
  openForm({
    title: 'Definir metas de ' + y, intro: 'Preenche os 12 meses de uma vez. Depois você pode ajustar cada mês.',
    fields: [
      { k: 'base', l: 'Meta de faturamento para janeiro', t: 'money', req: 1, help: 'Média mensal dos últimos 90 dias: ' + fm(last.revenue / 3) },
      { k: 'growth', l: 'Crescimento a cada mês', t: 'pct', half: 1 },
      { k: 'margin', l: 'Meta de lucro (% do faturamento)', t: 'pct', half: 1, help: 'Margem líquida atual: ' + fp(last.netPct) },
      { k: 'onlyFuture', l: 'Alterar só o mês atual e os próximos', t: 'check' },
    ],
    values: { base, growth: 2, margin: Math.max(5, Math.round(last.netPct * 100)) || 10, onlyFuture: true },
    live: v => { const dec = (v.base || 0) * Math.pow(1 + (v.growth || 0) / 100, 11); return '<div class="preview"><div><span>Janeiro</span><b>' + fm(v.base || 0) + '</b></div><div><span>Dezembro</span><b>' + fm(dec) + '</b></div><div><span>Total no ano</span><b>' + fm(sum(Array.from({ length: 12 }, (_, i) => (v.base || 0) * Math.pow(1 + (v.growth || 0) / 100, i)))) + '</b></div></div>'; },
    onSubmit: v => {
      const cm = monthKey(today());
      for (let i = 0; i < 12; i++) { const m = y + '-' + pad(i + 1); if (v.onlyFuture && m < cm) continue; const rv = r2(Math.round((v.base || 0) * Math.pow(1 + (v.growth || 0) / 100, i) / 10) * 10); S.goals[m] = { revenue: rv, profit: r2(Math.round(rv * (v.margin || 0) / 100 / 10) * 10) }; }
      commit('definiu', 'Meta', 'Metas de ' + y + ' a partir de ' + fm(v.base) + ' com crescimento de ' + fn(v.growth) + '% ao mês'); toast('Metas definidas'); render();
    },
  });
};
function invForm(x) {
  const isNew = !x;
  openForm({
    title: isNew ? 'Novo investimento' : 'Editar investimento',
    fields: [
      { k: 'name', l: 'Investimento', req: 1, ph: 'Ex.: Reforma da vitrine' }, { k: 'date', l: 'Data', t: 'date', req: 1, half: 1 },
      { k: 'amount', l: 'Valor investido', t: 'money', req: 1, half: 1 },
      { k: 'returnAmount', l: 'Retorno obtido até agora', t: 'money', help: 'Lucro extra ou economia que o investimento trouxe. Atualize de tempos em tempos.' },
      { k: 'ledger', l: 'Lançar a saída no financeiro', t: 'check', show: () => isNew, help: 'Não entra no lucro do mês; entra no fluxo de caixa.' },
      { k: 'notes', l: 'Observações', t: 'textarea' },
    ],
    values: x ? { ...x } : { date: today(), ledger: true },
    live: v => v.amount > 0 ? '<div class="preview"><div><span>ROI</span><b class="' + moneyCls((v.returnAmount || 0) - v.amount) + '">' + fp(div((v.returnAmount || 0) - v.amount, v.amount), 0) + '</b></div><div><span>Ganho líquido</span><b>' + fm((v.returnAmount || 0) - v.amount) + '</b></div></div>' : '',
    danger: !isNew ? { l: 'Excluir', f: async () => { const ok = await ask({ title: 'Excluir investimento', text: 'Excluir <b>' + esc(x.name) + '</b>?', ok: 'Excluir', danger: true }); if (!ok) return false; S.investments = S.investments.filter(i => i.id !== x.id); commit('excluiu', 'Investimento', x.name, x.id); render(); } } : null,
    onSubmit: v => {
      const data = { name: v.name, date: v.date, amount: r2(v.amount), returnAmount: r2(v.returnAmount), notes: v.notes };
      if (isNew) { const n = { id: uid(), ...data }; S.investments.push(n); if (v.ledger) S.ledger.push({ id: uid(), type: 'out', date: v.date, amount: n.amount, categoryId: 'investimento', description: 'Investimento: ' + n.name, status: 'pago', paidDate: v.date, dueDate: v.date, investmentId: n.id, createdAt: nowS() }); commit('criou', 'Investimento', n.name + ' — ' + fm(n.amount), n.id); }
      else { Object.assign(x, data); commit('editou', 'Investimento', x.name + ' — retorno ' + fm(x.returnAmount), x.id); }
      toast('Investimento salvo'); render();
    },
  });
}
ACT.invNew = () => invForm(null);
ACT.invEdit = el => { const x = S.investments.find(i => i.id === el.dataset.id); if (x) invForm(x); };

/* ---------- 11. Segurança, auditoria e prevenção de perdas ---------- */
function pgSeguranca() {
  const r = curRange(), s = secMetrics(r), c = s.c;
  const tab = curTab('seg', 'geral');
  let h = pageHead('11 · Segurança, auditoria e prevenção de perdas', 'Segurança e auditoria', 'Diferenças de caixa, divergências de estoque, perdas e o histórico completo do que cada usuário fez.', '<button class="btn" data-act="lossNew">Registrar perda</button><button class="btn" data-act="countNew">Contagem de estoque</button>');
  h += kpis([
    { l: 'Diferenças de caixa', v: '<span class="' + moneyCls(c.overages - c.shortages) + '">' + fm(c.overages - c.shortages) + '</span>', s: 'Faltas ' + fm(c.shortages) + ' · sobras ' + fm(c.overages) + ' · ' + c.cashDiffCount + ' de ' + c.cashClosed + ' fechamentos', i: 'difcaixa' },
    { l: 'Divergências de estoque', v: fm(c.invAbs), s: plural(c.invItems, 'item divergente', 'itens divergentes') + ' em ' + plural(s.counts.length, 'contagem', 'contagens'), i: 'divest' },
    { l: 'Perdas por fraudes, furtos e erros', v: fm(s.fraud), s: 'Total de perdas ' + fm(s.lossTotal), i: 'perdas', cls: 'hl' },
    { l: 'Operações registradas', v: fi(s.auditR.length), s: plural(s.users.length, 'usuário', 'usuários') + ' no período', i: 'audit' },
  ]);
  h += tabs('seg', [['geral', 'Riscos'], ['perdas', 'Perdas'], ['caixas', 'Caixas'], ['hist', 'Histórico de operações']], tab);
  if (tab === 'geral') {
    const risk = [
      [s.cancels.length, 'vendas canceladas', s.cancels.length > 3 ? 'warn' : 'info', 'vendas'],
      [s.highDisc.length, 'vendas com desconto de ' + (S.config.highDiscount || 15) + '% ou mais', s.highDisc.length > 5 ? 'warn' : 'info', 'vendas'],
      [s.adjusts.length, 'ajustes manuais de estoque', s.adjusts.length > 5 ? 'warn' : 'info', 'estoque'],
      [c.cashDiffCount, 'fechamentos de caixa com diferença', c.cashDiffCount > 2 ? 'crit' : 'info', 'caixa'],
    ];
    h += '<div class="grid2">' + card('Sinais de risco no período', '<div class="alerts">' + risk.map(x => '<button class="al ' + (x[0] ? x[2] : 'good') + '" data-act="go" data-r="' + x[3] + '"><span class="sev">' + ic(x[0] ? 'alert' : 'check') + '</span><span><b>' + fi(x[0]) + '</b> ' + esc(x[1]) + '</span>' + ic('right', 'sm') + '</button>').join('') + '</div>') +
      card('Perdas por tipo', hbars([...s.lossByType].map(([k, v]) => ({ l: lossName(k), v: sum(v, l => l.amount), sub: fi(v.length) + 'x' })).concat(c.shortages ? [{ l: 'Faltas de caixa', v: c.shortages }] : []).sort((a, b) => b.v - a.v), fm, { empty: 'Nenhuma perda no período' }), { i: 'perdas' }) + '</div>';
    h += card('Por usuário', table('secu', {
      rows: s.users, search: false, sort: 'ops',
      cols: [
        { k: 'name', l: 'Usuário', f: u => '<b>' + esc(u.name) + '</b>', s: u => u.name },
        { k: 'ops', l: 'Operações', num: 1, f: u => fi(u.ops), s: u => u.ops },
        { k: 'cancels', l: 'Cancelamentos', num: 1, f: u => fi(u.cancels), s: u => u.cancels },
        { k: 'disc', l: 'Descontos altos', num: 1, f: u => fi(u.disc), s: u => u.disc },
        { k: 'adj', l: 'Ajustes de estoque', num: 1, f: u => fi(u.adj), s: u => u.adj },
        { k: 'cash', l: 'Diferença de caixa', num: 1, f: u => (u.cashN ? '<span class="' + moneyCls(u.cashDiff) + '">' + fm(u.cashDiff) + '</span> <small class="muted">(' + u.cashN + 'x)</small>' : '—'), s: u => u.cashDiff },
      ],
    }), { sub: 'Compare os operadores. Muitos cancelamentos, descontos ou diferenças de caixa com a mesma pessoa merecem atenção.' });
  } else if (tab === 'perdas') {
    h += card('Perdas registradas', table('loss', {
      rows: s.losses.slice().sort((a, b) => (a.date < b.date ? 1 : -1)), search: false, empty: 'Nenhuma perda registrada no período', emptyBtn: '<button class="btn sm pri" data-act="lossNew">Registrar perda</button>',
      cols: [
        { k: 'd', l: 'Perda', f: l => '<b>' + esc(lossName(l.type)) + '</b><small class="muted">' + fd(l.date) + ' · ' + esc(l.user || '') + '</small>' },
        { k: 'p', l: 'Produto', f: l => (l.productId ? fn(l.qty) + 'x ' + esc(prodName(l.productId)) : '—') },
        { k: 'x', l: 'Descrição', f: l => esc(l.description) },
        { k: 'v', l: 'Valor', num: 1, f: l => '<b>' + fm(l.amount) + '</b>' },
      ],
    }));
  } else if (tab === 'caixas') {
    h += card('Fechamentos de caixa no período', table('secash', {
      rows: s.sessions.slice().sort((a, b) => (a.closedAt < b.closedAt ? 1 : -1)), act: 'cashView', search: false, empty: 'Nenhum caixa fechado no período',
      cols: [
        { k: 'd', l: 'Data', f: x => '<b>' + fd(x.openedAt) + '</b><small class="muted">' + esc(x.closedBy || '') + '</small>' },
        { k: 'e', l: 'Esperado', num: 1, f: x => fm(x.expectedAmount) },
        { k: 'c', l: 'Contado', num: 1, f: x => fm(x.countedAmount) },
        { k: 'df', l: 'Diferença', num: 1, f: x => (Math.abs(x.difference) < 0.005 ? chip('OK', 'good') : '<b class="' + moneyCls(x.difference) + '">' + fm(x.difference) + '</b>') },
      ],
    }), { i: 'difcaixa' });
  } else {
    const fu = UI.filters.audU || '', fa = UI.filters.audA || '';
    let rows = S.audit.filter(a => inR(a.at, r));
    const usersL = [...new Set(rows.map(a => a.user))].sort();
    const acts = [...new Set(rows.map(a => a.action))].sort();
    if (fu) rows = rows.filter(a => a.user === fu); if (fa) rows = rows.filter(a => a.action === fa);
    rows = rows.slice().reverse();
    h += card('Histórico de alterações e operações', table('audit', {
      rows, ph: 'Buscar no histórico', text: a => a.user + ' ' + a.action + ' ' + a.entity + ' ' + a.summary, limit: 100,
      tools: '<select class="inp" style="max-width:180px;min-height:36px;padding:4px 10px" data-chg="filt" data-f="audU" aria-label="Filtrar usuário"><option value="">Todos os usuários</option>' + usersL.map(u => '<option' + (u === fu ? ' selected' : '') + '>' + esc(u) + '</option>').join('') + '</select><select class="inp" style="max-width:170px;min-height:36px;padding:4px 10px" data-chg="filt" data-f="audA" aria-label="Filtrar ação"><option value="">Todas as ações</option>' + acts.map(u => '<option' + (u === fa ? ' selected' : '') + '>' + esc(u) + '</option>').join('') + '</select>',
      empty: 'Nenhuma operação no período',
      cols: [
        { k: 'at', l: 'Quando', f: a => '<b>' + fdt(a.at) + '</b><small class="muted">' + esc(a.user) + '</small>' },
        { k: 'ac', l: 'Ação', f: a => chip(a.action, a.action === 'excluiu' || a.action === 'cancelou' ? 'crit' : a.action === 'editou' || a.action === 'ajustou' ? 'warn' : 'plain') },
        { k: 'en', l: 'Item', f: a => esc(a.entity) },
        { k: 'su', l: 'Detalhes', f: a => esc(a.summary) },
      ],
    }), { i: 'audit', sub: 'Registro permanente. Nenhum usuário consegue apagar ou alterar este histórico.' });
  }
  return h;
}

/* ---------- 12. Satisfação e reputação ---------- */
const COMP_CATS = ['Produto com defeito', 'Atendimento', 'Atraso na entrega', 'Pedido errado', 'Preço ou cobrança', 'Troca ou devolução', 'Outro'];
function pgSatisfacao() {
  const r = curRange(), s = satMetrics(r), sp = satMetrics(prevRange(r, UI.period.id));
  const tab = curTab('sat', 'recl');
  let h = pageHead('12 · Satisfação e reputação', 'Satisfação dos clientes', 'Notas, reclamações, tempo para resolver e se o cliente volta depois da experiência.', '<button class="btn pri" data-act="reviewNew">' + ic('star', 'sm') + 'Registrar avaliação</button><button class="btn" data-act="complaintNew">Registrar reclamação</button>');
  h += kpis([
    { l: 'Nota média de avaliação', v: s.rv.length ? f1(s.avgRating) + ' <span class="stv" style="font-size:1rem">★</span>' : '—', d: s.rv.length && sp.rv.length ? delta(s.avgRating, sp.avgRating) : '', s: plural(s.rv.length, 'avaliação', 'avaliações'), i: 'nota', cls: 'hl' },
    { l: 'Taxa de reclamações', v: fp(s.rate, 2), d: delta(s.rate, sp.rate, false), s: plural(s.cp.length, 'reclamação', 'reclamações') + ' no período', i: 'taxarecl' },
    { l: 'Tempo médio de resolução', v: fdur(s.resH), d: s.resolved.length && sp.resolved.length ? delta(s.resH, sp.resH, false) : '', s: plural(s.resolved.length, 'resolvida', 'resolvidas'), i: 'tresol' },
    { l: 'Recompra após a experiência', v: s.base ? fp(s.backPct, 0) : '—', s: fi(s.back) + ' de ' + fi(s.base) + ' clientes voltaram a comprar', i: 'recompexp' },
    { l: 'Reclamações em aberto', v: fi(s.open.length), s: s.open.length ? 'A mais antiga ' + ago(s.open.map(x => x.openedAt).sort()[0]) : 'Nenhuma pendência', cls: s.open.length ? 'alert' : '' },
  ]);
  const by = s.by;
  h += '<div class="grid2">' + card('Distribuição das notas', hbars(s.dist.map(d => ({ l: d.n + ' ' + '★'.repeat(d.n), v: d.c, sub: fp(div(d.c, s.rv.length), 0) })), v => fi(v), { empty: 'Nenhuma avaliação no período' })) +
    card('Voltaram a comprar depois de…', hbars([['pos', 'Avaliação positiva (4 e 5)'], ['neg', 'Avaliação negativa (1 a 3)'], ['recl', 'Reclamação']].filter(([k]) => by[k][1]).map(([k, l]) => ({ l, v: div(by[k][0], by[k][1]), sub: by[k][0] + '/' + by[k][1] })), v => fp(v, 0), { empty: 'Sem avaliações ou reclamações no período' }), { i: 'recompexp', sub: 'Reclamação bem resolvida costuma trazer o cliente de volta.' }) + '</div>';
  h += tabs('sat', [['recl', 'Reclamações'], ['aval', 'Avaliações']], tab);
  if (tab === 'recl') {
    const rows = S.complaints.filter(x => inR(x.openedAt, r) || x.status !== 'resolvida').sort((a, b) => ((a.status === 'resolvida') - (b.status === 'resolvida')) || (a.openedAt < b.openedAt ? 1 : -1));
    const cats = [...s.cats].map(([k, v]) => ({ l: k, v: v.length })).sort((a, b) => b.v - a.v);
    h += card('Reclamações', table('compl', {
      rows, act: 'complaintEdit', ph: 'Buscar cliente ou assunto', text: x => custName(x.customerId) + ' ' + x.category + ' ' + x.description,
      empty: 'Nenhuma reclamação', emptyBtn: '<button class="btn sm" data-act="complaintNew">Registrar reclamação</button>',
      cols: [
        { k: 'c', l: 'Reclamação', f: x => '<b>' + esc(x.category) + '</b><small class="muted">' + esc(custName(x.customerId)) + ' · ' + fdt(x.openedAt) + '</small>' },
        { k: 'd', l: 'Descrição', f: x => esc(x.description) },
        { k: 's', l: 'Situação', f: x => (x.status === 'resolvida' ? chip('Resolvida em ' + fdur(diffHours(x.openedAt, x.resolvedAt)), 'good') : x.status === 'andamento' ? chip('Em andamento', 'warn') : chip('Aberta', 'crit')) },
      ],
    })) + (cats.length ? card('Assuntos das reclamações no período', hbars(cats, v => fi(v))) : '');
  } else {
    const rows = s.rv.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    h += card('Avaliações do período', table('revs', {
      rows, act: 'reviewEdit', ph: 'Buscar cliente ou comentário', text: x => custName(x.customerId) + ' ' + (x.comment || ''),
      empty: 'Nenhuma avaliação no período', emptyBtn: '<button class="btn sm" data-act="reviewNew">Registrar avaliação</button>',
      cols: [
        { k: 'n', l: 'Nota', f: x => stars(x.rating) + '<small class="muted">' + esc(custName(x.customerId)) + ' · ' + fd(x.date) + '</small>' },
        { k: 'c', l: 'Comentário', f: x => esc(x.comment || '—') },
        { k: 'o', l: 'Onde', f: x => esc(x.source || '—') },
      ],
    }));
  }
  return h;
}
function saleOptsFor(custId, saleId) {
  const list = S.sales.filter(s => s.status !== 'cancelada' && (!custId || s.customerId === custId)).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 60);
  if (saleId && !list.some(s => s.id === saleId)) { const s = ix().sale.get(saleId); if (s) list.unshift(s); }
  return [['', 'Não vincular a uma venda']].concat(list.map(s => [s.id, '#' + s.number + ' · ' + fd(s.date) + ' · ' + fm(s.total)]));
}
const custOpts = () => [['', 'Não identificado']].concat(S.customers.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(c => [c.id, c.name]));
function reviewForm(x, pre = {}) {
  const isNew = !x;
  const sale = pre.saleId ? ix().sale.get(pre.saleId) : null;
  const custId = x ? x.customerId : sale ? sale.customerId : pre.customerId || '';
  openForm({
    title: isNew ? 'Registrar avaliação' : 'Avaliação',
    fields: [
      { k: 'rating', l: 'Nota', t: 'stars', req: 1 },
      { k: 'customerId', l: 'Cliente', t: 'select', opts: custOpts, half: 1 },
      { k: 'date', l: 'Data', t: 'date', req: 1, half: 1 },
      { k: 'saleId', l: 'Venda avaliada', t: 'select', opts: () => saleOptsFor(custId, x ? x.saleId : pre.saleId) },
      { k: 'source', l: 'Onde avaliou', t: 'select', half: 1, opts: ['Pessoalmente', 'WhatsApp', 'Google', 'Instagram', 'Pesquisa', 'Marketplace', 'Outro'].map(v => [v, v]) },
      { k: 'comment', l: 'Comentário', t: 'textarea' },
    ],
    values: x ? { ...x } : { customerId: custId, saleId: pre.saleId || '', date: today(), source: 'Pessoalmente' },
    danger: !isNew && isAdmin() ? { l: 'Excluir', f: () => { S.reviews = S.reviews.filter(r => r.id !== x.id); commit('excluiu', 'Avaliação', x.rating + ' estrelas de ' + custName(x.customerId), x.id); render(); } } : null,
    onSubmit: v => {
      if (!(v.rating >= 1)) return 'Escolha a nota.';
      const data = { rating: v.rating, customerId: v.customerId || null, saleId: v.saleId || null, date: v.date, source: v.source, comment: v.comment };
      if (data.saleId && !data.customerId) data.customerId = ix().sale.get(data.saleId)?.customerId || null;
      if (isNew) { const n = { id: uid(), ...data }; S.reviews.push(n); commit('registrou', 'Avaliação', v.rating + ' estrelas — ' + custName(data.customerId), n.id); }
      else { Object.assign(x, data); commit('editou', 'Avaliação', v.rating + ' estrelas — ' + custName(data.customerId), x.id); }
      toast('Avaliação salva'); render();
    },
  });
}
function complaintForm(x, pre = {}) {
  const isNew = !x;
  const sale = pre.saleId ? ix().sale.get(pre.saleId) : null;
  const custId = x ? x.customerId : sale ? sale.customerId : pre.customerId || '';
  openForm({
    title: isNew ? 'Registrar reclamação' : 'Reclamação',
    fields: [
      { k: 'category', l: 'Assunto', t: 'select', half: 1, opts: COMP_CATS.map(v => [v, v]) },
      { k: 'openedAt', l: 'Aberta em', t: 'datetime', req: 1, half: 1 },
      { k: 'customerId', l: 'Cliente', t: 'select', opts: custOpts, half: 1 },
      { k: 'saleId', l: 'Venda', t: 'select', half: 1, opts: () => saleOptsFor(custId, x ? x.saleId : pre.saleId) },
      { k: 'description', l: 'O que o cliente relatou', t: 'textarea', req: 1 },
      { k: 'status', l: 'Situação', t: 'seg', opts: [['aberta', 'Aberta'], ['andamento', 'Em andamento'], ['resolvida', 'Resolvida']] },
      { k: 'resolvedAt', l: 'Resolvida em', t: 'datetime', show: v => v.status === 'resolvida' },
      { k: 'resolution', l: 'Como foi resolvida', t: 'textarea', show: v => v.status === 'resolvida' },
    ],
    values: x ? { ...x } : { category: COMP_CATS[0], openedAt: nowS(), customerId: custId, saleId: pre.saleId || '', status: 'aberta', resolvedAt: nowS() },
    danger: !isNew && isAdmin() ? { l: 'Excluir', f: () => { S.complaints = S.complaints.filter(r => r.id !== x.id); commit('excluiu', 'Reclamação', x.category + ' — ' + custName(x.customerId), x.id); render(); } } : null,
    onSubmit: v => {
      if (v.status === 'resolvida' && v.resolvedAt && v.resolvedAt < v.openedAt) return 'A resolução não pode ser antes da abertura.';
      const data = { category: v.category, openedAt: v.openedAt, customerId: v.customerId || null, saleId: v.saleId || null, description: v.description, status: v.status, resolvedAt: v.status === 'resolvida' ? (v.resolvedAt || nowS()) : null, resolution: v.status === 'resolvida' ? v.resolution : '' };
      if (data.saleId && !data.customerId) data.customerId = ix().sale.get(data.saleId)?.customerId || null;
      if (isNew) { const n = { id: uid(), ...data }; S.complaints.push(n); commit('registrou', 'Reclamação', v.category + ' — ' + custName(data.customerId), n.id); }
      else { const was = x.status; Object.assign(x, data); commit(was !== 'resolvida' && data.status === 'resolvida' ? 'resolveu' : 'editou', 'Reclamação', v.category + ' — ' + custName(data.customerId), x.id); }
      toast('Reclamação salva'); render();
    },
  });
}
ACT.reviewNew = el => reviewForm(null, { saleId: el.dataset.sale, customerId: el.dataset.cust });
ACT.reviewEdit = el => { const x = S.reviews.find(r => r.id === el.dataset.id); if (x) reviewForm(x); };
ACT.complaintNew = el => complaintForm(null, { saleId: el.dataset.sale, customerId: el.dataset.cust });
ACT.complaintEdit = el => { const x = S.complaints.find(r => r.id === el.dataset.id); if (x) complaintForm(x); };
