import os from 'node:os';

/**
 * Descobre os enderecos da maquina na rede local.
 * E por eles que o celular alcanca o app: o computador faz a coleta e o
 * telefone so abre a tela.
 */
export function enderecosDaRede() {
  const enderecos = [];
  for (const [nome, lista] of Object.entries(os.networkInterfaces())) {
    for (const iface of lista || []) {
      if (iface.family !== 'IPv4' || iface.internal) continue;
      enderecos.push({ nome, ip: iface.address, provavelWifi: /^(wl|wi|en0|Wi-?Fi|Wireless)/i.test(nome) });
    }
  }
  // Interface de Wi-Fi primeiro: e a que o celular costuma alcancar.
  return enderecos.sort((a, b) => Number(b.provavelWifi) - Number(a.provavelWifi));
}

/** Melhor palpite de endereco para acessar do celular. */
export function enderecoLocal(porta) {
  const [primeiro] = enderecosDaRede();
  return primeiro ? `http://${primeiro.ip}:${porta}` : null;
}
