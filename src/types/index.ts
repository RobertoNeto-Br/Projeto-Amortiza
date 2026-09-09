// Definição de Tipos da Aplicação
// Documentação TypeScript: https://www.typescriptlang.org/docs/

export interface MetaNumerica {
  id?: string;
  created_at?: string;
  descricao: string;
  valor_meta: number;
  valor_atingido: number;
  percentual: number;
}

export interface ResultadoOCR {
  textoBruto: string;
  valorMetaExtrado: number | null;
  percentualExtraido: number | null;
}
