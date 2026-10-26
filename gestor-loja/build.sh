#!/usr/bin/env bash
# Gera o arquivo único index.html a partir de src/.
# Uso: ./build.sh            -> index.html (documento completo, para usar no computador ou publicar)
#      ./build.sh --embed X  -> X (só o conteúdo do <body>, para incorporar em outra página)
set -euo pipefail
cd "$(dirname "$0")"
JS="src/core.js src/metrics.js src/ui.js src/pages1.js src/pages2.js src/pages3.js src/pages4.js src/demo.js src/main.js"
FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap">'
ICON='<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2214%22 fill=%22%230b6b58%22/%3E%3Cpath d=%22M44 22a14 14 0 1 0 0 20%22 fill=%22none%22 stroke=%22white%22 stroke-width=%226%22 stroke-linecap=%22round%22/%3E%3C/svg%3E">'
body() {
  echo '<style>[hidden]{display:none!important}'
  cat src/app.css
  echo '</style>'
  echo '<div id="root"><div style="min-height:60vh;display:grid;place-items:center;font-family:system-ui,sans-serif;color:#6f7a75">Carregando…</div></div><div id="tip" hidden></div>'
  echo '<script>'
  cat $JS
  echo '</script>'
}
if [ "${1:-}" = "--embed" ]; then
  OUT="$2"
  { echo '<title>Caixa Claro</title><meta name="claude:viewport-fit-sides" content="cover">'; echo "$FONTS"; body; } > "$OUT"
  echo "ok: $OUT"
  exit 0
fi
{
  echo '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#0b6b58"><meta name="description" content="Gestão completa da loja: vendas, caixa, estoque, financeiro e 52 indicadores."><title>Caixa Claro</title>'
  echo "$ICON"; echo "$FONTS"
  echo '</head><body>'
  body
  echo '</body></html>'
} > index.html
echo "ok: index.html ($(wc -c < index.html) bytes)"
