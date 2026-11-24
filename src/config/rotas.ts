// Tabela de roteamento do gateway: "se o caminho começa com X, entrega no serviço Y".
// O endereço de cada serviço fica no .env (variável indicada em destinoEnv).
export interface Rota {
  prefixo: string;
  destinoEnv: string;
}

export const ROTAS: Rota[] = [
  { prefixo: '/auth', destinoEnv: 'MS4_URL' }, // MS4 Usuários (login)
  { prefixo: '/usuarios', destinoEnv: 'MS4_URL' }, // MS4 Usuários (gestão)
  { prefixo: '/doadores', destinoEnv: 'MS1_URL' }, // MS1 Doadores
  { prefixo: '/estoque', destinoEnv: 'MS2_URL' }, // MS2 Estoque
  { prefixo: '/transacoes', destinoEnv: 'MS2_URL' }, // MS2 Estoque (transações)
  { prefixo: '/requests', destinoEnv: 'MS3_URL' }, // MS3 Demanda
];