// Serviço de Conexão com o Supabase
// Documentação Oficial Supabase Client: https://supabase.com/docs/reference/javascript/initializing

import { createClient } from '@supabase/supabase-js';
import { MetaNumerica } from '../types';

// Credenciais Reais do Projeto Supabase
const SUPABASE_URL = 'https://ktywqlrpcyywfzwfdilg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yAALF0cgRkWFCUiVNcCD-Q_lFu_V...';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Salva uma meta numéricas extraída na tabela 'metas' do Supabase.
 */
export async function salvarMetaSupabase(meta: MetaNumerica): Promise<{ success: boolean; data?: MetaNumerica[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('metas')
      .insert([
        {
          descricao: meta.descricao,
          valor_meta: meta.valor_meta,
          valor_atingido: meta.valor_atingido,
          percentual: meta.percentual,
        },
      ])
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as MetaNumerica[] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro inesperado ao salvar meta no Supabase.' };
  }
}

/**
 * Busca a lista de metas cadastradas no Supabase.
 */
export async function buscarMetasSupabase(): Promise<{ success: boolean; data?: MetaNumerica[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as MetaNumerica[] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao carregar metas do Supabase.' };
  }
}
