// Tabela de roteamento do gateway: "se o caminho começa com X, entrega no serviço Y".
// O endereço de cada serviço fica no .env (variável indicada em destinoEnv).
export interface Rota {
  prefixo: string;
  destinoEnv: string;
}

export const ROTAS: Rota[] = [
  { prefixo: '/doadores', destinoEnv: 'MS1_URL' }, // MS1 Doadores
];