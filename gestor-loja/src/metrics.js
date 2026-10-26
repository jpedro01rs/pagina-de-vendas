/* ============================================================
   Motor de indicadores — todos os cálculos saem daqui
   ============================================================ */
const salesIn = r => S.sales.filter(s => s.status !== 'cancelada' && inR(s.date, r));
function memo(key, fnc) { if (MEMO.has(key)) return MEMO.get(key); const v = fnc(); MEMO.set(key, v); return v; }

// Para onde cada categoria vai no resultado (DRE)
function bucketOf(cat, ctx) {
  switch (cat.group) {
    case 'fixa': case 'pessoal': return 'fixa';
    case 'variavel': case 'marketing': return 'variavel';
    case 'imposto': return ctx.taxEstimated ? null : 'variavel';
    case 'comissao': return ctx.commEstimated ? null : 'variavel';
    case 'outra': return 'outra';
    default: return null;
  }
}

/* Resultado completo de um período: vendas, DRE e caixa */
function calc(r) {
  return memo('calc|' + r.from + '|' + r.to, () => {
    const sales = salesIn(r);
    let revenue = 0, cmv = 0, items = 0, fees = 0, taxes = 0, comm = 0, ship = 0, shipCharged = 0, discounts = 0;
    for (const s of sales) {
      revenue += s.total; fees += s.fee || 0; taxes += s.tax || 0; comm += s.commission || 0; discounts += s.discount || 0;
      if (s.fulfillment) { ship += s.fulfillment.shippingCost || 0; shipCharged += s.fulfillment.shippingCharged || 0; }
      for (const it of s.items) { cmv += it.qty * it.cost; items += it.qty; discounts += it.discount || 0; }
    }
    const varCosts = cmv + fees + taxes + comm + ship;
    const mc = revenue - varCosts;
    const ctx = { taxEstimated: taxes > 0, commEstimated: comm > 0 };
    const exp = { fixa: 0, variavel: 0, outra: 0 };
    const byCat = new Map();
    let marketing = 0, pessoal = 0, mercadoria = 0, investimento = 0, retirada = 0;
    for (const e of S.ledger) {
      if (!inR(e.date, r)) continue;
      const c = catOf(e.categoryId);
      if (c.group === 'marketing') marketing += e.amount;
      if (c.group === 'pessoal') pessoal += e.amount;
      if (c.group === 'mercadoria') mercadoria += e.amount;
      if (c.group === 'investimento') investimento += e.amount;
      if (c.group === 'retirada') retirada += e.amount;
      const b = bucketOf(c, ctx);
      if (!b) continue;
      exp[b] += e.amount;
      if (b !== 'outra') byCat.set(e.categoryId, (byCat.get(e.categoryId) || 0) + e.amount);
    }
    const lossesReg = sum(S.losses.filter(l => inR(l.date, r)), l => l.amount);
    let shortages = 0, overages = 0, cashDiffCount = 0, cashClosed = 0;
    for (const c of S.cash) {
      if (!c.closedAt || !inR(c.closedAt, r)) continue;
      cashClosed++;
      const d = c.difference || 0;
      if (d < -0.005) { shortages += -d; cashDiffCount++; } else if (d > 0.005) { overages += d; cashDiffCount++; }
    }
    let invNet = 0, invItems = 0, invAbs = 0;
    for (const ct of S.counts) {
      if (!inR(ct.date, r)) continue;
      for (const it of ct.items) { const dq = it.countedQty - it.systemQty; if (dq) { invItems++; const v = dq * (it.unitCost || 0); invAbs += Math.abs(v); if (ct.applied) invNet += v; } }
    }
    const perdas = lossesReg + shortages - overages - invNet;
    const opex = exp.fixa + exp.variavel;
    const net = mc + exp.outra - opex - perdas;
    const mcPct = div(mc, revenue);
    const pe = mcPct > 0 ? opex / mcPct : Infinity;
    // caixa (pela data em que o dinheiro entrou/saiu)
    let cin = 0, cout = 0;
    for (const e of S.ledger) {
      const pd = paidDate(e);
      if (!pd || pd < r.from || pd > r.to) continue;
      if (e.type === 'in') cin += e.amount; else cout += e.amount;
    }
    return {
      r, sales, count: sales.length, revenue, cmv, items, fees, taxes, comm, ship, shipCharged, discounts, varCosts, mc, mcPct,
      fixa: exp.fixa, variavel: exp.variavel, outra: exp.outra, opex, byCat, marketing, pessoal, mercadoria, investimento, retirada,
      lossesReg, shortages, overages, cashDiffCount, cashClosed, invNet, invItems, invAbs, perdas, net, netPct: div(net, revenue),
      pe, peGap: pe - revenue, ticket: div(revenue, sales.length), cin, cout, flow: cin - cout,
    };
  });
}

function balanceAt(date) {
  let b = +S.config.initialBalance || 0;
  for (const e of S.ledger) { const pd = paidDate(e); if (pd && pd <= date) b += e.type === 'in' ? e.amount : -e.amount; }
  return b;
}
function pendings() {
  return memo('pend', () => {
    const t = today(); const rec = [], pay = [];
    for (const e of S.ledger) { if (paidDate(e)) continue; (e.type === 'in' ? rec : pay).push(e); }
    const by = (a, b) => (a.dueDate || a.date) < (b.dueDate || b.date) ? -1 : 1;
    rec.sort(by); pay.sort(by);
    const due = e => e.dueDate || e.date;
    return {
      rec, pay, recTotal: sum(rec, e => e.amount), payTotal: sum(pay, e => e.amount),
      overdueRec: rec.filter(e => !e.auto && due(e) < t), overduePay: pay.filter(e => due(e) < t),
      soonPay: pay.filter(e => due(e) >= t && due(e) <= addDays(t, 3)),
    };
  });
}

/* Agrupamento automático por dia, semana ou mês conforme o tamanho do período */
function buckets(r) {
  const n = daysInRange(r);
  if (n <= 45) { const keys = eachDay(r); return { kind: 'dia', keys, keyOf: d => String(d).slice(0, 10), label: fds, title: k => SEMANA[parseD(k).getDay()] + ', ' + fd(k) }; }
  if (n <= 200) {
    const keys = []; let w = weekStart(r.from), g = 0;
    while (w <= r.to && g++ < 60) { keys.push(w); w = addDays(w, 7); }
    return { kind: 'semana', keys, keyOf: d => weekStart(d), label: fds, title: k => 'Semana de ' + fd(k < r.from ? r.from : k) };
  }
  const keys = []; let m = monthKey(r.from), g = 0;
  while (m <= monthKey(r.to) && g++ < 240) { keys.push(m); m = monthKey(addMonths(m + '-01', 1)); }
  return { kind: 'mês', keys, keyOf: d => String(d).slice(0, 7), label: monthShort, title: monthLabel };
}
function seriesOf(bk, list, dateOf, valOf) {
  const m = new Map(bk.keys.map(k => [k, 0]));
  for (const x of list) { const k = bk.keyOf(dateOf(x)); if (m.has(k)) m.set(k, m.get(k) + (valOf ? valOf(x) : 1)); }
  return bk.keys.map(k => m.get(k));
}

/* Vendas por produto (margem de lucro por produto e curva ABC) */
function productPerf(r) {
  return memo('pp|' + r.from + '|' + r.to, () => {
    const m = new Map();
    for (const s of salesIn(r)) {
      const goods = s.subtotal || 0;
      const extra = (s.fee || 0) + (s.tax || 0) + (s.commission || 0);
      const share = div(s.total - (s.fulfillment?.shippingCharged || 0), goods); // fração da receita do item após desconto geral
      for (const it of s.items) {
        const gross = it.qty * it.price - (it.discount || 0);
        const rev = gross * share;
        const varShare = div(rev, s.total) * extra;
        let p = m.get(it.productId);
        if (!p) { p = { id: it.productId, name: it.name, qty: 0, rev: 0, cmv: 0, varc: 0, count: 0 }; m.set(it.productId, p); }
        p.qty += it.qty; p.rev += rev; p.cmv += it.qty * it.cost; p.varc += varShare; p.count++;
      }
    }
    const rows = [...m.values()].map(p => ({ ...p, name: ix().prod.get(p.id)?.name || p.name, profit: p.rev - p.cmv - p.varc, margin: div(p.rev - p.cmv - p.varc, p.rev) }));
    rows.sort((a, b) => b.rev - a.rev);
    const tot = sum(rows, x => x.rev); let acc = 0;
    for (const x of rows) { acc += x.rev; const sh = div(acc - x.rev, tot); x.abc = sh < 0.8 ? 'A' : sh < 0.95 ? 'B' : 'C'; x.share = div(x.rev, tot); }
    return rows;
  });
}

/* Estoque */
function stockStatus(p) { if ((p.stock || 0) <= 0) return 'zero'; if ((p.stock || 0) <= (p.minStock || 0)) return 'baixo'; return 'ok'; }
function stockValueAt(date) {
  // valor do estoque no fim de "date", desfazendo os movimentos posteriores
  const after = new Map();
  for (const mv of S.moves) if (mv.date.slice(0, 10) > date) after.set(mv.productId, (after.get(mv.productId) || 0) + mv.qty);
  let v = 0;
  for (const p of S.products) { if (p.active === false && !(p.stock > 0)) continue; const q = (p.stock || 0) - (after.get(p.id) || 0); if (q > 0) v += q * (+p.cost || 0); }
  return v;
}
function stockMetrics(r) {
  return memo('st|' + r.from + '|' + r.to, () => {
    const act = S.products.filter(p => p.active !== false);
    const units = sum(act, p => Math.max(0, p.stock || 0));
    const cost = sum(act, p => Math.max(0, p.stock || 0) * (+p.cost || 0));
    const saleValue = sum(act, p => Math.max(0, p.stock || 0) * (+p.price || 0));
    const low = act.filter(p => stockStatus(p) === 'baixo'), zero = act.filter(p => stockStatus(p) === 'zero');
    const start = stockValueAt(addDays(r.from, -1)), end = stockValueAt(r.to);
    const avgStock = (start + end) / 2;
    const c = calc(r);
    const giro = div(c.cmv, avgStock);
    const days = daysInRange(r);
    const cover = c.cmv > 0 ? cost / (c.cmv / days) : Infinity;
    return { act, units, cost, saleValue, low, zero, avgStock, giro, cover, days };
  });
}

/* Clientes */
function custMetrics(r) {
  return memo('cu|' + r.from + '|' + r.to, () => {
    const st = ix().custStats; const cfg = S.config;
    const activeSince = addDays(r.to, -((+cfg.activeDays || 90) - 1));
    let active = 0, newC = 0, buyers = 0, repeaters = 0, ltvRev = 0;
    for (const [, cs] of st) {
      const upTo = cs.dates.filter(d => d.slice(0, 10) <= r.to);
      if (!upTo.length) continue;
      buyers++;
      if (upTo.length >= 2) repeaters++;
      if (upTo[upTo.length - 1].slice(0, 10) >= activeSince) active++;
      if (inR(cs.first, r)) newC++;
    }
    for (const s of ix().salesSorted) if (s.customerId && s.date.slice(0, 10) <= r.to) ltvRev += s.total;
    const sr = salesIn(r);
    const ident = sr.filter(s => s.customerId);
    const distinct = new Set(ident.map(s => s.customerId));
    let returning = 0;
    for (const id of distinct) { const cs = st.get(id); if (cs && cs.first.slice(0, 10) < r.from) returning++; }
    const revIdent = sum(ident, s => s.total);
    const c = calc(r);
    const ltv = div(ltvRev, buyers);
    return {
      active, newC, buyers, repeaters, repurchase: div(repeaters, buyers), distinct: distinct.size, returning,
      ticketCli: div(revIdent, distinct.size), freq: div(ident.length, distinct.size), ltv, ltvProfit: ltv * Math.max(0, c.mcPct),
      identPct: div(ident.length, sr.length), revIdent,
    };
  });
}
function customerRows() {
  const st = ix().custStats; const t = today(); const cfg = S.config;
  const rows = S.customers.map(c => {
    const cs = st.get(c.id);
    const days = cs ? diffDays(cs.last.slice(0, 10), t) : Infinity;
    let seg = 'sem';
    if (cs) seg = days < (+cfg.activeDays || 90) ? (cs.count >= 2 ? 'ativo' : (diffDays(cs.first.slice(0, 10), t) <= 30 ? 'novo' : 'ativo')) : (cs.count >= 2 ? 'risco' : 'inativo');
    return { ...c, count: cs ? cs.count : 0, total: cs ? cs.total : 0, last: cs ? cs.last : null, first: cs ? cs.first : null, days, seg, ticket: cs ? cs.total / cs.count : 0 };
  });
  const sortedT = rows.filter(x => x.total > 0).map(x => x.total).sort((a, b) => b - a);
  const vipCut = sortedT.length >= 10 ? sortedT[Math.floor(sortedT.length * 0.1)] : Infinity;
  for (const x of rows) x.vip = x.total >= vipCut && x.total > 0;
  return rows;
}

/* Marketing */
function mktMetrics(r) {
  return memo('mk|' + r.from + '|' + r.to, () => {
    const I = ix();
    const ents = S.ledger.filter(e => inR(e.date, r) && catOf(e.categoryId).group === 'marketing');
    const invest = sum(ents, e => e.amount);
    const ch = new Map();
    const get = id => { const k = id || 'outro'; if (!ch.has(k)) ch.set(k, { id: k, name: chName(k), spend: 0, rev: 0, count: 0, newC: 0, paid: !!I.ch.get(k)?.paid }); return ch.get(k); };
    for (const e of ents) get(e.channelId).spend += e.amount;
    const sr = salesIn(r);
    for (const s of sr) { const x = get(s.channelId); x.rev += s.total; x.count++; }
    for (const [cid, cs] of I.custStats) {
      if (!inR(cs.first, r)) continue;
      const cu = I.cust.get(cid);
      get(cu?.channelId || cs.firstChannel).newC++;
    }
    const rows = [...ch.values()];
    for (const x of rows) { x.roas = div(x.rev, x.spend); x.cac = div(x.spend, x.newC); }
    rows.sort((a, b) => b.rev - a.rev);
    const paidRows = rows.filter(x => x.spend > 0);
    const paidRev = sum(paidRows, x => x.rev);
    const newC = custMetrics(r).newC;
    const mcPct = calc(r).mcPct;
    const campaigns = groupBy(ents, e => (e.campaign || '').trim() || 'Sem campanha');
    return {
      ents, invest, rows, paidRev, newC, cac: div(invest, newC), roas: div(paidRev, invest),
      roi: invest ? (paidRev * Math.max(0, mcPct) - invest) / invest : 0, campaigns,
    };
  });
}

/* Funcionários */
function teamMetrics(r) {
  return memo('tm|' + r.from + '|' + r.to, () => {
    const t = today();
    const sr = salesIn(r);
    const pay = S.ledger.filter(e => inR(e.date, r) && catOf(e.categoryId).group === 'pessoal');
    const payroll = sum(pay, e => e.amount);
    const days = daysInRange(r);
    const estimated = sum(S.employees.filter(e => e.active !== false), e => ((+e.salary || 0) * (1 + (+e.chargesPct || 0) / 100) + (+e.benefits || 0)) * days / 30.4);
    const byEmp = groupBy(sr, s => s.employeeId || '');
    const rows = S.employees.map(e => {
      const s = byEmp.get(e.id) || [];
      const from = e.hireDate && e.hireDate > r.from ? e.hireDate : r.from;
      let to = r.to < t ? r.to : t;
      if (e.active === false && e.leftDate && e.leftDate < to) to = e.leftDate;
      const workDays = from <= to ? Math.round(diffDays(from, to)) + 1 : 0;
      const sched = (+e.weeklyHours || 0) / 7 * workDays;
      const absH = sum(S.absences.filter(a => a.employeeId === e.id && inR(a.date, r)), a => a.hours);
      const worked = Math.max(0, sched - absH);
      const rev = sum(s, x => x.total);
      const cost = sum(pay.filter(p => p.employeeId === e.id), p => p.amount);
      return { e, id: e.id, name: e.name, role: e.role, count: s.length, rev, ticket: div(rev, s.length), comm: sum(s, x => x.commission || 0), sched, absH, worked, perH: div(rev, worked), abs: div(absH, sched), cost };
    });
    const none = byEmp.get('') || [];
    const sellers = rows.filter(x => x.count > 0);
    const totSched = sum(rows, x => x.sched), totAbs = sum(rows, x => x.absH), totWorked = sum(rows, x => x.worked);
    const revByEmp = sum(sellers, x => x.rev);
    return {
      payroll, estimated, usedEstimate: payroll === 0 && estimated > 0, cost: payroll || estimated, rows, none,
      perSeller: div(revByEmp, sellers.length), perH: div(revByEmp, sum(sellers, x => x.worked)) || div(revByEmp, totWorked),
      abs: div(totAbs, totSched), totAbs, totSched, comm: sum(sr, s => s.commission || 0), sellers: sellers.length,
    };
  });
}

/* Operação e logística */
function opsMetrics(r) {
  return memo('op|' + r.from + '|' + r.to, () => {
    const sr = salesIn(r);
    const orders = sr.filter(s => s.fulfillment);
    const proc = orders.filter(s => s.fulfillment.processedAt).map(s => diffHours(s.date, s.fulfillment.processedAt)).filter(h => h >= 0);
    const deliv = orders.filter(s => s.fulfillment.deliveredAt && s.fulfillment.promisedAt);
    const onTime = deliv.filter(s => s.fulfillment.deliveredAt <= s.fulfillment.promisedAt);
    const errs = sr.filter(s => s.error);
    const c = calc(r);
    const now = nowS();
    const open = S.sales.filter(s => s.status !== 'cancelada' && s.fulfillment && !s.fulfillment.deliveredAt);
    const late = open.filter(s => s.fulfillment.promisedAt && s.fulfillment.promisedAt < now);
    return {
      orders, proc: avg(proc), procN: proc.length, deliv, onTime, onTimePct: div(onTime.length, deliv.length), errs, errPct: div(errs.length, sr.length),
      opCost: div(c.opex + c.ship, sr.length), count: sr.length, open, late, errTypes: groupBy(errs, s => s.error.type || 'Outro'),
    };
  });
}

/* Fornecedores e compras */
function supMetrics(r) {
  return memo('su|' + r.from + '|' + r.to, () => {
    const ps = S.purchases.filter(p => p.status !== 'cancelada' && inR(p.orderDate, r));
    const recv = ps.filter(p => p.receivedDate);
    const lead = recv.map(p => diffDays(p.orderDate, p.receivedDate));
    const onTime = recv.filter(p => !p.expectedDate || p.receivedDate <= p.expectedDate);
    const term = ps.filter(p => p.dueDate).map(p => diffDays(p.orderDate, p.dueDate));
    const rows = S.suppliers.map(s => {
      const mine = ps.filter(p => p.supplierId === s.id); const rc = mine.filter(p => p.receivedDate);
      return { s, id: s.id, name: s.name, count: mine.length, total: sum(mine, p => p.total), lead: avg(rc.map(p => diffDays(p.orderDate, p.receivedDate))), onTime: div(rc.filter(p => !p.expectedDate || p.receivedDate <= p.expectedDate).length, rc.length), rcN: rc.length, term: avg(mine.filter(p => p.dueDate).map(p => diffDays(p.orderDate, p.dueDate))) };
    }).sort((a, b) => b.total - a.total);
    const open = S.purchases.filter(p => p.status === 'pedido');
    return { ps, total: sum(ps, p => p.total), lead: avg(lead), onTimePct: div(onTime.length, recv.length), recvN: recv.length, term: avg(term), rows, open };
  });
}

/* Precificação: percentuais médios dos últimos 90 dias */
function pricingCtx() {
  return memo('pc', () => {
    const r = { from: addDays(today(), -89), to: today() };
    const c = calc(r);
    const cfg = S.config;
    const cards = cfg.paymentMethods.filter(p => p.fee > 0);
    const feePct = c.revenue ? c.fees / c.revenue : (cards.length ? avg(cards.map(p => p.fee)) / 100 / 2 : 0);
    const commPct = c.revenue ? c.comm / c.revenue : (+cfg.defaultCommission || 0) / 100;
    const taxPct = (+cfg.taxRate || 0) / 100;
    const fixedPct = c.revenue ? c.opex / c.revenue : 0;
    return { feePct, commPct, taxPct, fixedPct, target: (+cfg.targetMargin || 0) / 100, base: c };
  });
}
function priceRow(p, ctx) {
  const unit = unitCost(p), price = +p.price || 0;
  const varPct = ctx.taxPct + ctx.feePct + ctx.commPct;
  const varUnit = unit + price * varPct;
  const mc = price - varUnit;
  const mcPct = div(mc, price);
  const d1 = 1 - varPct - ctx.fixedPct, d2 = d1 - ctx.target;
  const min = d1 > 0 ? unit / d1 : Infinity;
  const sug = d2 > 0 ? unit / d2 : Infinity;
  const status = price < min - 0.004 ? 'crit' : price < sug - 0.004 ? 'warn' : 'good';
  return { p, unit, price, varUnit, mc, mcPct, min, sug, status, markup: div(price, unit), profitUnit: price - varUnit - price * ctx.fixedPct };
}

/* Planejamento */
function goalFor(m) { const g = S.goals[m]; return { revenue: g && g.revenue != null ? +g.revenue : +S.config.monthlyGoal || 0, profit: g && g.profit != null ? +g.profit : 0, custom: !!g }; }
function monthRange(m) { const f = m + '-01', e = monthEnd(f), t = today(); return { from: f, to: e < t ? e : (f > t ? f : t) }; }
function projection(days = 90) {
  return memo('pj|' + days, () => {
    const t = today();
    const start = balanceAt(t);
    const P = pendings();
    const sched = new Map();
    for (const e of [...P.rec, ...P.pay]) {
      let d = e.dueDate || e.date; if (d <= t) d = addDays(t, 1);
      sched.set(d, (sched.get(d) || 0) + (e.type === 'in' ? e.amount : -e.amount));
    }
    // Tendência: média diária do que entrou e saiu nos últimos 60 dias (sem contas fixas, aportes e investimentos).
    // Cada movimento conta a partir do seu prazo habitual (ex.: crédito em 30 dias), para não somar de novo
    // o que já está agendado como conta a receber ou a pagar.
    const from = addDays(t, -59);
    const firstD = firstDataDate();
    const span = Math.max(1, Math.min(60, Math.round(diffDays(firstD > from ? firstD : from, t)) + 1));
    const byLag = new Array(days + 2).fill(0);
    for (const e of S.ledger) {
      const pd = paidDate(e); if (!pd || pd < from || pd > t) continue;
      if (e.recId) continue;
      const g = catOf(e.categoryId).group; if (g === 'aporte' || g === 'investimento') continue;
      const lag = clamp(Math.round(diffDays(e.date, pd)), 0, days + 1);
      byLag[lag] += (e.type === 'in' ? e.amount : -e.amount) / span;
    }
    const trend = sum(byLag);
    const labels = [t], a = [start], b = [start];
    let sa = start, sb = start, minB = start, minD = t, minA = start, minAD = t, run = 0;
    for (let i = 1; i <= days; i++) {
      const d = addDays(t, i);
      const s = sched.get(d) || 0;
      run += byLag[i - 1];
      sa += s; sb += s + run;
      labels.push(d); a.push(sa); b.push(sb);
      if (sb < minB) { minB = sb; minD = d; }
      if (sa < minA) { minA = sa; minAD = d; }
    }
    return { labels, a, b, start, trend, minB, minD, minA, minAD };
  });
}

/* Segurança */
function secMetrics(r) {
  return memo('se|' + r.from + '|' + r.to, () => {
    const c = calc(r);
    const sessions = S.cash.filter(x => x.closedAt && inR(x.closedAt, r));
    const counts = S.counts.filter(x => inR(x.date, r));
    const losses = S.losses.filter(l => inR(l.date, r));
    const lossByType = groupBy(losses, l => l.type);
    const sr = S.sales.filter(s => inR(s.date, r));
    const hi = (+S.config.highDiscount || 15) / 100;
    const highDisc = sr.filter(s => s.status !== 'cancelada' && div(s.discount + sum(s.items, i => i.discount || 0), s.subtotal + sum(s.items, i => i.discount || 0)) >= hi);
    const cancels = sr.filter(s => s.status === 'cancelada');
    const adjusts = S.moves.filter(m => m.type === 'ajuste' && inR(m.date, r));
    const auditR = S.audit.filter(a => inR(a.at, r));
    const users = new Map();
    const U = name => { const k = name || 'Sistema'; if (!users.has(k)) users.set(k, { name: k, ops: 0, cancels: 0, disc: 0, adj: 0, cashDiff: 0, cashN: 0 }); return users.get(k); };
    for (const a of auditR) U(a.user).ops++;
    for (const s of cancels) U(s.cancelledBy).cancels++;
    for (const s of highDisc) U(ix().user.get(s.userId)?.name).disc++;
    for (const m of adjusts) U(m.user).adj++;
    for (const x of sessions) { const u = U(x.closedBy); u.cashDiff += x.difference || 0; if (Math.abs(x.difference || 0) > 0.005) u.cashN++; }
    return {
      c, sessions, counts, losses, lossByType, highDisc, cancels, adjusts, auditR, users: [...users.values()].sort((a, b) => b.ops - a.ops),
      lossTotal: c.lossesReg + c.shortages, fraud: sum(losses.filter(l => ['furto', 'fraude', 'erro'].includes(l.type)), l => l.amount) + c.shortages,
    };
  });
}

/* Satisfação */
function satMetrics(r) {
  return memo('sa|' + r.from + '|' + r.to, () => {
    const rv = S.reviews.filter(x => inR(x.date, r));
    const cp = S.complaints.filter(x => inR(x.openedAt, r));
    const resolved = S.complaints.filter(x => x.status === 'resolvida' && x.resolvedAt && inR(x.resolvedAt, r));
    const resH = resolved.map(x => diffHours(x.openedAt, x.resolvedAt)).filter(h => h >= 0);
    const sales = salesIn(r).length;
    const after = new Map(); // cliente -> data da primeira experiência registrada no período
    const kind = new Map();
    for (const x of rv) if (x.customerId) { const d = x.date; if (!after.has(x.customerId) || d < after.get(x.customerId)) after.set(x.customerId, d); if (!kind.has(x.customerId)) kind.set(x.customerId, x.rating >= 4 ? 'pos' : 'neg'); }
    for (const x of cp) if (x.customerId) { const d = x.openedAt; if (!after.has(x.customerId) || d < after.get(x.customerId)) after.set(x.customerId, d); kind.set(x.customerId, 'recl'); }
    let back = 0; const by = { pos: [0, 0], neg: [0, 0], recl: [0, 0] };
    for (const [cid, d] of after) {
      const cs = ix().custStats.get(cid);
      const came = !!(cs && cs.dates.some(x => x > d));
      if (came) back++;
      const k = kind.get(cid) || 'pos'; by[k][1]++; if (came) by[k][0]++;
    }
    const dist = [5, 4, 3, 2, 1].map(n => ({ n, c: rv.filter(x => x.rating === n).length }));
    return {
      rv, cp, resolved, avgRating: avg(rv.map(x => x.rating)), dist, rate: div(cp.length, sales), resH: avg(resH), back, base: after.size, backPct: div(back, after.size), by,
      open: S.complaints.filter(x => x.status !== 'resolvida'), cats: groupBy(cp, x => x.category || 'Outro'),
    };
  });
}

/* Alertas do painel */
function alerts() {
  const out = []; const t = today(); const now = nowS();
  const P = pendings();
  if (P.overduePay.length) out.push({ sev: 'crit', t: '<b>' + plural(P.overduePay.length, 'conta vencida', 'contas vencidas') + '</b> a pagar: ' + fm(sum(P.overduePay, e => e.amount)), go: 'financeiro', tab: ['fin', 'contas'] });
  if (P.soonPay.length) out.push({ sev: 'warn', t: plural(P.soonPay.length, 'conta vence', 'contas vencem') + ' nos próximos 3 dias: ' + fm(sum(P.soonPay, e => e.amount)), go: 'financeiro', tab: ['fin', 'contas'] });
  if (P.overdueRec.length) out.push({ sev: 'warn', t: plural(P.overdueRec.length, 'recebimento atrasado', 'recebimentos atrasados') + ' (fiado/a prazo): ' + fm(sum(P.overdueRec, e => e.amount)), go: 'financeiro', tab: ['fin', 'contas'] });
  const act = S.products.filter(p => p.active !== false);
  const zero = act.filter(p => stockStatus(p) === 'zero'), low = act.filter(p => stockStatus(p) === 'baixo');
  if (zero.length) out.push({ sev: 'crit', t: '<b>' + plural(zero.length, 'produto zerado', 'produtos zerados') + '</b> no estoque', go: 'estoque' });
  if (low.length) out.push({ sev: 'warn', t: plural(low.length, 'produto com estoque baixo', 'produtos com estoque baixo'), go: 'estoque' });
  const ops = opsMetrics({ from: t, to: t });
  if (ops.late.length) out.push({ sev: 'crit', t: '<b>' + plural(ops.late.length, 'pedido atrasado', 'pedidos atrasados') + '</b> para entrega', go: 'operacao' });
  const openC = S.complaints.filter(x => x.status !== 'resolvida');
  if (openC.length) out.push({ sev: 'warn', t: plural(openC.length, 'reclamação em aberto', 'reclamações em aberto'), go: 'satisfacao' });
  const cs = openCash();
  if (cs && diffHours(cs.openedAt, now) > 14) out.push({ sev: 'warn', t: 'O caixa está aberto desde ' + fdt(cs.openedAt) + '. Faça o fechamento.', go: 'caixa' });
  const ctx = pricingCtx();
  const below = act.filter(p => p.price > 0 && priceRow(p, ctx).status === 'crit');
  if (below.length) out.push({ sev: 'warn', t: plural(below.length, 'produto vendido abaixo', 'produtos vendidos abaixo') + ' do preço mínimo sustentável', go: 'precificacao' });
  const m = calc({ from: monthStart(t), to: t });
  if (m.cashDiffCount) out.push({ sev: 'info', t: plural(m.cashDiffCount, 'fechamento de caixa', 'fechamentos de caixa') + ' com diferença neste mês (' + fm(m.overages - m.shortages) + ')', go: 'seguranca' });
  if (!S.meta.demo && (S.sales.length || S.products.length)) {
    const lb = S.meta.lastBackup; const d = lb ? diffDays(lb.slice(0, 10), t) : 999;
    if (d >= 7) out.push({ sev: 'info', t: lb ? 'Último backup ' + ago(lb) + '. Faça um novo backup.' : 'Você ainda não fez nenhum backup dos dados.', go: 'config', tab: ['cfg', 'dados'] });
  }
  return out;
}
