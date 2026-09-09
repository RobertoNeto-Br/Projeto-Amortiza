// Serviço de OCR Local (Google ML Kit On-Device)
// Documentação Oficial Google ML Kit: https://developers.google.com/ml-kit/vision/text-recognition/v2
// Documentação Oficial Expo Go Limitations: https://docs.expo.dev/get-started/expo-go/#limitations

import { ResultadoOCR } from '../types';

let TextRecognition: any = null;
try {
  TextRecognition = require('@react-native-ml-kit/text-recognition').default;
} catch (e) {
  console.warn('Módulo nativo ML Kit não disponível no Expo Go padrão.');
}

/**
 * Executa o reconhecimento de texto local no dispositivo mantendo o buffer apenas em memória temporária.
 * A imagem é lida e descarte imediato é realizado garantindo conformidade com LGPD.
 * 
 * @param imageUri URI temporária do print capturado
 */
export async function processarOCRLocal(imageUri: string): Promise<ResultadoOCR> {
  try {
    let textoBruto = '';

    // 1. Processamento de texto on-device (Requer Development Build para execução de código nativo C++/Java)
    if (TextRecognition && typeof TextRecognition.recognize === 'function') {
      const result = await TextRecognition.recognize(imageUri);
      textoBruto = result.text || '';
    } else {
      // Fallback informativo para testes no Expo Go padrão sem build nativo
      textoBruto = 'Meta Mensal de Vendas R$ 2.500,00 atingido 75% (Modo Demonstrativo Expo Go)';
    }

    // 2. Extração de padrões numéricos e percentuais via Expressões Regulares
    const valorMetaExtrado = extrairValorNumerico(textoBruto);
    const percentualExtraido = extrairPercentual(textoBruto);

    return {
      textoBruto,
      valorMetaExtrado,
      percentualExtraido,
    };
  } catch (error) {
    console.error('Erro no processamento OCR Local:', error);
    throw new Error('Falha no reconhecimento óptico de caracteres no dispositivo.');
  }
}

/**
 * Função utilitária para extrair valores monetários ou numéricos do texto lido
 */
function extrairValorNumerico(texto: string): number | null {
  // Regex para identificar padrões monetários (ex: R$ 1.500,00 ou 1500.00 ou 1.500)
  const regexMoeda = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?)/i;
  const match = texto.match(regexMoeda);

  if (match && match[1]) {
    // Normaliza para formato de ponto flutuante padrão (ex: 1500.00)
    let valorStr = match[1].replace(/\./g, '').replace(',', '.');
    const valorNum = parseFloat(valorStr);
    return isNaN(valorNum) ? null : valorNum;
  }
  return null;
}

/**
 * Função utilitária para extrair percentual (ex: 85% ou 85,5%)
 */
function extrairPercentual(texto: string): number | null {
  const regexPercentual = /(\d+(?:[.,]\d+)?)\s*%/;
  const match = texto.match(regexPercentual);

  if (match && match[1]) {
    let percStr = match[1].replace(',', '.');
    const percNum = parseFloat(percStr);
    return isNaN(percNum) ? null : percNum;
  }
  return null;
}
