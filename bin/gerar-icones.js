#!/usr/bin/env node
/**
 * Gera os icones PNG do app (usados quando voce adiciona a pagina a tela
 * inicial do celular). Escreve o PNG na mao para nao precisar de nenhuma
 * biblioteca de imagem.
 *
 *   node bin/gerar-icones.js
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const DESTINO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icones');

/* ---------- codificador PNG minimo (RGBA, 8 bits) ---------- */

const crcTabela = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTabela[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pedaco(tipo, dados) {
  const comprimento = Buffer.alloc(4);
  comprimento.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const verificacao = Buffer.alloc(4);
  verificacao.writeUInt32BE(crc32(corpo));
  return Buffer.concat([comprimento, corpo, verificacao]);
}

function montarPng(largura, altura, pixels) {
  const cabecalho = Buffer.alloc(13);
  cabecalho.writeUInt32BE(largura, 0);
  cabecalho.writeUInt32BE(altura, 4);
  cabecalho[8] = 8;   // bits por canal
  cabecalho[9] = 6;   // RGBA
  cabecalho[10] = 0;  // compressao padrao
  cabecalho[11] = 0;  // filtro padrao
  cabecalho[12] = 0;  // sem entrelacamento

  // Cada linha comeca com o byte de filtro (0 = nenhum).
  const linhas = Buffer.alloc(altura * (1 + largura * 4));
  for (let y = 0; y < altura; y++) {
    const inicio = y * (1 + largura * 4);
    linhas[inicio] = 0;
    pixels.copy(linhas, inicio + 1, y * largura * 4, (y + 1) * largura * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', cabecalho),
    pedaco('IDAT', zlib.deflateSync(linhas, { level: 9 })),
    pedaco('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- desenho do icone ---------- */

const FUNDO = [13, 18, 26];
const VERDE = [46, 204, 134];
const AZUL = [61, 139, 253];

/** Mistura cor sobre o fundo conforme a cobertura (0..1) - suaviza a borda. */
function pintar(pixels, largura, x, y, cor, cobertura) {
  if (cobertura <= 0) return;
  const i = (y * largura + x) * 4;
  const a = Math.min(cobertura, 1);
  for (let c = 0; c < 3; c++) pixels[i + c] = Math.round(pixels[i + c] * (1 - a) + cor[c] * a);
  pixels[i + 3] = 255;
}

/** Segmento de reta com pontas arredondadas. */
function linha(pixels, tamanho, a, b, espessura, cor) {
  const comprimento = Math.hypot(b.x - a.x, b.y - a.y);
  const passos = Math.ceil(comprimento * 2);
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    const cx = a.x + (b.x - a.x) * t;
    const cy = a.y + (b.y - a.y) * t;
    for (let dy = -espessura - 1; dy <= espessura + 1; dy++) {
      for (let dx = -espessura - 1; dx <= espessura + 1; dx++) {
        const px = Math.round(cx + dx);
        const py = Math.round(cy + dy);
        if (px < 0 || py < 0 || px >= tamanho || py >= tamanho) continue;
        const cobertura = espessura + 0.5 - Math.hypot(px - cx, py - cy);
        pintar(pixels, tamanho, px, py, cor, cobertura);
      }
    }
  }
}

/** Triangulo cheio, testado por coordenadas baricentricas. */
function triangulo(pixels, tamanho, a, b, c, cor) {
  const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x)) - 1);
  const maxX = Math.min(tamanho - 1, Math.ceil(Math.max(a.x, b.x, c.x)) + 1);
  const minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y)) - 1);
  const maxY = Math.min(tamanho - 1, Math.ceil(Math.max(a.y, b.y, c.y)) + 1);
  const area = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
  if (!area) return;

  // Amostra 2x2 por pixel para a borda nao ficar serrilhada.
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      let dentro = 0;
      for (const oy of [0.25, 0.75]) {
        for (const ox of [0.25, 0.75]) {
          const px = x + ox;
          const py = y + oy;
          const u = ((b.y - c.y) * (px - c.x) + (c.x - b.x) * (py - c.y)) / area;
          const v = ((c.y - a.y) * (px - c.x) + (a.x - c.x) * (py - c.y)) / area;
          if (u >= 0 && v >= 0 && u + v <= 1) dentro++;
        }
      }
      if (dentro) pintar(pixels, tamanho, x, y, cor, dentro / 4);
    }
  }
}

function desenhar(tamanho) {
  const pixels = Buffer.alloc(tamanho * tamanho * 4);
  const raio = tamanho * 0.22;

  // Fundo com cantos arredondados.
  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      const dx = Math.max(raio - x, 0, x - (tamanho - raio - 1));
      const dy = Math.max(raio - y, 0, y - (tamanho - raio - 1));
      const distancia = Math.hypot(dx, dy);
      const dentro = distancia <= raio ? 1 : Math.max(0, 1 - (distancia - raio));
      const i = (y * tamanho + x) * 4;
      pixels[i] = FUNDO[0]; pixels[i + 1] = FUNDO[1]; pixels[i + 2] = FUNDO[2];
      pixels[i + 3] = Math.round(255 * dentro);
    }
  }

  // Tres barras subindo: a leitura visual de "preco e tendencia".
  const margem = tamanho * 0.26;
  const base = tamanho - margem;
  const larguraBarra = tamanho * 0.115;
  const vao = tamanho * 0.055;
  const alturas = [0.20, 0.33, 0.46];
  const cores = [AZUL, AZUL, VERDE];

  alturas.forEach((fracao, indice) => {
    const x0 = margem + indice * (larguraBarra + vao);
    const y0 = base - tamanho * fracao;
    for (let y = Math.floor(y0); y < base; y++) {
      for (let x = Math.floor(x0); x < x0 + larguraBarra; x++) {
        if (x < 0 || y < 0 || x >= tamanho || y >= tamanho) continue;
        pintar(pixels, tamanho, x, y, cores[indice], 1);
      }
    }
  });

  // Seta diagonal subindo por cima das barras.
  const p1 = { x: margem - tamanho * 0.02, y: base - tamanho * 0.26 };
  const p2 = { x: margem + 2 * (larguraBarra + vao) + larguraBarra * 0.9, y: base - tamanho * 0.60 };
  const angulo = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const pontaTamanho = tamanho * 0.13;

  // O corpo para antes da ponta, senao a linha vaza pela frente do triangulo.
  const fim = {
    x: p2.x - Math.cos(angulo) * pontaTamanho * 0.62,
    y: p2.y - Math.sin(angulo) * pontaTamanho * 0.62,
  };
  linha(pixels, tamanho, p1, fim, tamanho * 0.036, VERDE);

  // Ponta: triangulo com os dois vertices de tras girados a partir da direcao.
  const abertura = 0.42;
  triangulo(
    pixels, tamanho, p2,
    { x: p2.x - Math.cos(angulo - abertura) * pontaTamanho, y: p2.y - Math.sin(angulo - abertura) * pontaTamanho },
    { x: p2.x - Math.cos(angulo + abertura) * pontaTamanho, y: p2.y - Math.sin(angulo + abertura) * pontaTamanho },
    VERDE,
  );

  return montarPng(tamanho, tamanho, pixels);
}

fs.mkdirSync(DESTINO, { recursive: true });
for (const tamanho of [180, 192, 512]) {
  const arquivo = path.join(DESTINO, `icone-${tamanho}.png`);
  fs.writeFileSync(arquivo, desenhar(tamanho));
  console.log(`  ${path.relative(process.cwd(), arquivo)}  ${tamanho}x${tamanho}`);
}
console.log('\nIcones gerados.');
