/** Utilidades de texto para anuncios brasileiros. */

/** Minusculo, sem acento, espacos normalizados. */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+\/\s.,-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converte preco em formato brasileiro para numero.
 * Regra: se houver virgula, ela e o separador decimal e o ponto e milhar.
 * Caso contrario o ponto e milhar. "R$ 1.500" -> 1500 ; "1.500,90" -> 1500.9
 */
export function precoParaNumero(valor) {
  if (valor == null) return null;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;

  const bruto = String(valor);
  // Descarta textos que nao sao preco ("Sob consulta", "A combinar").
  const digitos = bruto.replace(/[^\d.,]/g, '');
  if (!digitos) return null;

  let limpo;
  if (digitos.includes(',')) {
    limpo = digitos.replace(/\./g, '').replace(',', '.');
  } else {
    limpo = digitos.replace(/\./g, '');
  }
  const n = Number(limpo);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Alguns endpoints devolvem centavos (price_cents). Heuristica segura:
 * so trata como centavos quando o campo tem "cent" no nome.
 */
export function centavosParaReais(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n / 100 : null;
}

/** Extrai armazenamento do titulo: 128gb, 1tb, 256 gb. */
export function extrairArmazenamento(titulo) {
  const t = normalizar(titulo);
  const tb = t.match(/\b(\d)\s*tb\b/);
  if (tb) return Number(tb[1]) * 1024;
  const gb = t.match(/\b(16|32|64|128|256|512)\s*gb\b/);
  if (gb) return Number(gb[1]);
  return null;
}

export function rotuloArmazenamento(gb) {
  if (!gb) return null;
  return gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`;
}

/** Classifica o estado declarado no titulo. */
export function extrairCondicao(titulo) {
  const t = normalizar(titulo);
  if (/\b(lacrad|novo na caixa|novo lacrado|nunca usado|na caixa lacrada)/.test(t)) return 'novo';
  if (/\b(semi ?novo|seminovo|impecavel|estado de novo|vitrine)/.test(t)) return 'seminovo';
  return 'usado';
}

/**
 * "Cabeca" do titulo: parte antes de expressoes que introduzem brindes/acessorios.
 * "iPhone 12 com capa e carregador" -> "iphone 12"
 * Serve para nao descartar um celular so porque o anuncio cita a capa que vem junto.
 */
export function cabecaDoTitulo(titulo) {
  const t = normalizar(titulo);
  const corte = t.search(/\s(?:com|c\/|\+|acompanha|inclui|incluso|brinde|junto|mais)\s/);
  return corte === -1 ? t : t.slice(0, corte).trim();
}

/** Escapa string para uso dentro de RegExp. */
export function escaparRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Distancia simples entre nomes de cidade (0 = igual). Usado no ranking de proximidade. */
export function mesmaCidade(a, b) {
  if (!a || !b) return false;
  const na = normalizar(a);
  const nb = normalizar(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}
