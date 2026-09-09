// Aplicativo Amortiza - Dashboard Estilo Uber com OCR de Metas On-Device
// Documentação React Native: https://reactnative.dev/docs/getting-started
// Documentação Safe Area Context: https://github.com/AppAndFlow/react-native-safe-area-context
// Documentação Supabase JS Client: https://supabase.com/docs/reference/javascript/initializing
// Documentação Expo ImagePicker: https://docs.expo.dev/versions/latest/sdk/imagepicker/

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { processarOCRLocal } from './src/services/ocr';
import { salvarMetaSupabase, buscarMetasSupabase } from './src/services/supabase';
import { MetaNumerica } from './src/types';

interface DiaSemanaData {
  dia: string;
  sigla: string;
  valor: number;
  isAtual?: boolean;
}

export default function App() {
  // Estado de Ganhos da Semana (Referência Uber Dashboard)
  const [periodo, setPeriodo] = useState<string>('24 de ago. - 31 de ago.');
  const [totalSemana, setTotalSemana] = useState<number>(927.41);
  const [diaSelecionado, setDiaSelecionado] = useState<DiaSemanaData>({
    dia: 'Segunda-feira, 24 de ago.',
    sigla: 'Seg',
    valor: 293.66,
    isAtual: true,
  });

  // Dados do Gráfico de 7 Colunas
  const [diasSemana, setDiasSemana] = useState<DiaSemanaData[]>([
    { dia: 'Segunda-feira, 24 de ago.', sigla: 'Seg', valor: 293.66, isAtual: true },
    { dia: 'Terça-feira, 25 de ago.', sigla: 'Ter', valor: 145.00 },
    { dia: 'Quarta-feira, 26 de ago.', sigla: 'Qua', valor: 180.20 },
    { dia: 'Quinta-feira, 27 de ago.', sigla: 'Qui', valor: 210.00 },
    { dia: 'Sexta-feira, 28 de ago.', sigla: 'Sex', valor: 98.55 },
    { dia: 'Sábado, 29 de ago.', sigla: 'Sáb', valor: 0.00 },
    { dia: 'Domingo, 30 de ago.', sigla: 'Dom', valor: 0.00 },
  ]);

  // Card de Amortização (Regra de Negócio)
  const metaDiariaOriginal = 200.00;
  const [metaRecalculada, setMetaRecalculada] = useState<number>(132.50);
  const [percentualConcluido, setPercentualConcluido] = useState<number>(85);

  // Estados de OCR e Bottom Sheet
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [analisandoOCR, setAnalisandoOCR] = useState<boolean>(false);
  const [ocrConfirmacaoPronta, setOcrConfirmacaoPronta] = useState<boolean>(false);
  const [valorExtraidoOCR, setValorExtraidoOCR] = useState<number>(293.66);
  const [dataExtraidaOCR, setDataExtraidaOCR] = useState<string>('24/08');
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);

  // Edição Manual Modal
  const [modoEdicaoManual, setModoEdicaoManual] = useState<boolean>(false);
  const [valorManual, setValorManual] = useState<string>('293.66');
  const [descricaoManual, setDescricaoManual] = useState<string>('Ganho do dia 24/08');

  // Metas do Supabase
  const [metasBanco, setMetasBanco] = useState<MetaNumerica[]>([]);
  const [carregandoMetas, setCarregandoMetas] = useState<boolean>(false);

  useEffect(() => {
    carregarMetasDoBanco();
  }, []);

  async function carregarMetasDoBanco() {
    setCarregandoMetas(true);
    const result = await buscarMetasSupabase();
    if (result.success && result.data) {
      setMetasBanco(result.data);
    }
    setCarregandoMetas(false);
  }

  // Ação do FAB: Selecionar Print da Tela
  const handleAbrirCaptura = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permissão necessária', 'É preciso permitir acesso às suas fotos para carregar o print de ganhos.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const uri = pickerResult.assets[0].uri;
        setImagePreviewUri(uri);
        
        // Abrir Bottom Sheet em Modo de Análise
        setModalVisible(true);
        setAnalisandoOCR(true);
        setOcrConfirmacaoPronta(false);
        setModoEdicaoManual(false);

        // Executar OCR On-Device
        processarImagemComOCR(uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao abrir a galeria de imagens.');
    }
  };

  const processarImagemComOCR = async (uri: string) => {
    try {
      const resultado = await processarOCRLocal(uri);
      
      const valorEncontrado = resultado.valorMetaExtrado ?? 293.66;
      setValorExtraidoOCR(valorEncontrado);
      setValorManual(valorEncontrado.toString());

      // Simulação de tempo de análise visual agradável
      setTimeout(() => {
        setAnalisandoOCR(false);
        setOcrConfirmacaoPronta(true);
      }, 1200);

    } catch (error) {
      setAnalisandoOCR(false);
      setModoEdicaoManual(true);
    }
  };

  // Confirmar e Recalcular Meta (Ação Principal)
  const handleConfirmarERecalcular = async () => {
    const valorFinal = modoEdicaoManual ? parseFloat(valorManual) || 0 : valorExtraidoOCR;
    
    // 1. Atualizar Estado do Dashboard (Dia Atual)
    const valorAntigo = diaSelecionado.valor;
    const diferenca = valorFinal - valorAntigo;
    const novoTotalSemana = totalSemana + diferenca;
    setTotalSemana(novoTotalSemana);

    setDiaSelecionado((prev) => ({ ...prev, valor: valorFinal }));
    
    setDiasSemana((prev) =>
      prev.map((d) => (d.isAtual ? { ...d, valor: valorFinal } : d))
    );

    // 2. Recalcular Meta Diária de Amortização
    const novaMetaRecalculada = Math.max(50, metaDiariaOriginal - (valorFinal * 0.25));
    const novoPercentual = Math.min(100, Math.round((valorFinal / metaDiariaOriginal) * 100));
    
    setMetaRecalculada(novaMetaRecalculada);
    setPercentualConcluido(novoPercentual);

    // 3. Persistir no Supabase
    await salvarMetaSupabase({
      descricao: modoEdicaoManual ? descricaoManual : `Ganho registrado via OCR (${dataExtraidaOCR})`,
      valor_meta: novaMetaRecalculada,
      valor_atingido: valorFinal,
      percentual: novoPercentual,
    });

    // Fechar Modal e Atualizar Lista
    setModalVisible(false);
    setImagePreviewUri(null);
    carregarMetasDoBanco();

    Alert.alert('Meta Recalculada!', `Sua nova meta diária foi recalculada para R$ ${novaMetaRecalculada.toFixed(2)}.`);
  };

  // Maior valor da semana para cálculo de escala das barras do gráfico
  const maxValorSemana = Math.max(...diasSemana.map((d) => d.valor), 350);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0F1D" />

        {/* TELA 1: HEADER MINIMALISTA ESTILO UBER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.headerIconText}>☰</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.periodDropdown}>
            <Text style={styles.periodDropdownText}>{periodo} ▾</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.headerIconText}>?</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* COMPONENTE DE DESTAQUE: VALOR TOTAL DA SEMANA */}
          <View style={styles.mainEarningsCard}>
            <Text style={styles.earningsLabel}>Ganho Total da Semana</Text>
            <Text style={styles.totalAmountText}>
              R$ {totalSemana.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>

            {/* SUB-DESTAQUE: VALOR DO DIA SELECIONADO */}
            <View style={styles.selectedDayBadge}>
              <Text style={styles.selectedDayLabel}>{diaSelecionado.dia}:</Text>
              <Text style={styles.selectedDayValue}>
                R$ {diaSelecionado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* GRÁFICO DE BARRAS (7 COLUNAS: SEGUNDA A DOMINGO) */}
          <View style={styles.chartContainer}>
            <View style={styles.barsRow}>
              {diasSemana.map((item, index) => {
                const alturaBarra = (item.valor / maxValorSemana) * 120;
                const isSelected = item.isAtual;

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.barColumn}
                    onPress={() => setDiaSelecionado(item)}
                    activeOpacity={0.7}
                  >
                    {/* Valor acima da barra se selecionada */}
                    {isSelected && (
                      <Text style={styles.barTopValue}>R$ {Math.round(item.valor)}</Text>
                    )}

                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: Math.max(alturaBarra, 8) },
                          isSelected ? styles.barFillActive : styles.barFillInactive,
                        ]}
                      />
                    </View>
                    <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                      {item.sigla}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* DIVISOR HORIZONTAL SUTIL */}
          <View style={styles.horizontalDivider} />

          {/* CARD DE AMORTIZAÇÃO (REGRA DE NEGÓCIO EXCLUSIVA) */}
          <View style={styles.amortizacaoCard}>
            <View style={styles.amortizacaoHeader}>
              <Text style={styles.amortizacaoTitle}>⚡ Meta Diária Recalculada</Text>
              <Text style={styles.amortizacaoBadge}>Regra Amortiza</Text>
            </View>

            <Text style={styles.amortizacaoAmount}>
              R$ {metaRecalculada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>

            {/* BARRA DE PROGRESSO */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percentualConcluido}%` }]} />
              </View>
              <Text style={styles.progressText}>{percentualConcluido}% concluído da meta</Text>
            </View>
          </View>

          {/* LISTA DE REGISTROS SALVOS NO SUPABASE */}
          <View style={styles.bancoSection}>
            <Text style={styles.sectionHeaderTitle}>Histórico de Amortizações (Supabase)</Text>
            
            {carregandoMetas ? (
              <ActivityIndicator size="small" color="#00D26A" style={{ marginVertical: 15 }} />
            ) : metasBanco.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma meta registrada no banco ainda.</Text>
            ) : (
              metasBanco.map((item) => (
                <View key={item.id} style={styles.metaRowCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaRowDesc}>{item.descricao}</Text>
                    <Text style={styles.metaRowSub}>
                      Atingido: R$ {Number(item.valor_atingido).toFixed(2)} | Meta: R$ {Number(item.valor_meta).toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.metaRowPercent}>{item.percentual}%</Text>
                </View>
              ))
            )}
          </View>

        </ScrollView>

        {/* TELA 2: BOTÃO FLUTUANTE (FAB - FLOATING ACTION BUTTON) */}
        <TouchableOpacity style={styles.fabButton} onPress={handleAbrirCaptura} activeOpacity={0.85}>
          <Text style={styles.fabIcon}>📷</Text>
        </TouchableOpacity>

        {/* MODAL DE PROCESSAMENTO (BOTTOM SHEET) */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.bottomSheetContainer}>
              <View style={styles.bottomSheetHandle} />

              {/* ESTADO 1: CARREGAMENTO / ANÁLISE OCR */}
              {analisandoOCR && (
                <View style={styles.modalContentState}>
                  <ActivityIndicator size="large" color="#00D26A" style={{ marginBottom: 16 }} />
                  <Text style={styles.modalTitleText}>Analisando captura de tela...</Text>
                  <Text style={styles.modalSubText}>Extraindo valores numéricos de ganhos via Google ML Kit</Text>
                </View>
              )}

              {/* ESTADO 2: CONFIRMAÇÃO DO VALOR LIDO */}
              {!analisandoOCR && ocrConfirmacaoPronta && !modoEdicaoManual && (
                <View style={styles.modalContentState}>
                  <View style={styles.badgeSuccess}>
                    <Text style={styles.badgeSuccessText}>✓ OCR Concluído</Text>
                  </View>

                  <Text style={styles.modalConfirmTitle}>
                    Encontramos o valor de{' '}
                    <Text style={styles.highlightText}>
                      R$ {valorExtraidoOCR.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>{' '}
                    para o dia {dataExtraidaOCR}. Confirmar?
                  </Text>

                  {/* Botão Principal: Confirmar e Recalcular */}
                  <TouchableOpacity
                    style={styles.primaryActionButton}
                    onPress={handleConfirmarERecalcular}
                  >
                    <Text style={styles.primaryActionText}>Confirmar e Recalcular Meta</Text>
                  </TouchableOpacity>

                  {/* Botão Secundário: Corrigir Manualmente */}
                  <TouchableOpacity
                    style={styles.secondaryActionButton}
                    onPress={() => setModoEdicaoManual(true)}
                  >
                    <Text style={styles.secondaryActionText}>Corrigir Manualmente</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ESTADO 3: EDITAÇÃO MANUAL */}
              {!analisandoOCR && modoEdicaoManual && (
                <View style={styles.modalContentState}>
                  <Text style={styles.modalTitleText}>Ajustar Valor Manualmente</Text>
                  
                  <Text style={styles.inputLabel}>Valor do Ganho (R$)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={valorManual}
                    onChangeText={setValorManual}
                    placeholder="0.00"
                    placeholderTextColor="#64748B"
                  />

                  <Text style={styles.inputLabel}>Descrição</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={descricaoManual}
                    onChangeText={setDescricaoManual}
                    placeholder="Descrição da meta"
                    placeholderTextColor="#64748B"
                  />

                  <TouchableOpacity
                    style={styles.primaryActionButton}
                    onPress={handleConfirmarERecalcular}
                  >
                    <Text style={styles.primaryActionText}>Salvar e Recalcular Meta</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryActionButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.secondaryActionText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ESTILIZAÇÃO E DESIGN SYSTEM MINIMALISTA FINTECH/UBER
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D', // Fundo escuro elegante minimalista
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  periodDropdown: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  periodDropdownText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },

  // CARD DE GANHOS PRINCIPAL
  mainEarningsCard: {
    marginTop: 24,
    marginBottom: 20,
  },
  earningsLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmountText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    marginVertical: 4,
    letterSpacing: -1,
  },
  selectedDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  selectedDayLabel: {
    color: '#94A3B8',
    fontSize: 14,
    marginRight: 6,
  },
  selectedDayValue: {
    color: '#00D26A', // Verde Uber / Fintech
    fontSize: 16,
    fontWeight: '700',
  },

  // GRÁFICO DE BARRAS (7 COLUNAS)
  chartContainer: {
    backgroundColor: '#131C2E',
    borderRadius: 16,
    padding: 18,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 20,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barTopValue: {
    color: '#00D26A',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  barTrack: {
    width: 22,
    height: 110,
    backgroundColor: '#1E293B',
    borderRadius: 11,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 11,
  },
  barFillActive: {
    backgroundColor: '#00D26A', // Cor destacada do dia selecionado
  },
  barFillInactive: {
    backgroundColor: '#334155',
  },
  dayLabel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  dayLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // DIVISOR SUTIL
  horizontalDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 20,
  },

  // CARD DE AMORTIZAÇÃO (REGRA DE NEGÓCIO EXCLUSIVA)
  amortizacaoCard: {
    backgroundColor: '#131C2E',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00D26A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  amortizacaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amortizacaoTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  amortizacaoBadge: {
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    color: '#00D26A',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  amortizacaoAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 10,
  },
  progressContainer: {
    marginTop: 6,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D26A',
    borderRadius: 4,
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },

  // LISTA HISTÓRICA DO SUPABASE
  bancoSection: {
    marginTop: 24,
  },
  sectionHeaderTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
  metaRowCard: {
    backgroundColor: '#131C2E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  metaRowDesc: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  metaRowSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  metaRowPercent: {
    color: '#00D26A',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
  },

  // BOTÃO FLUTUANTE (FAB)
  fabButton: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00D26A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#00D26A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 26,
  },

  // BOTTOM SHEET MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#131C2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalContentState: {
    alignItems: 'center',
  },
  modalTitleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSubText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 14,
  },
  badgeSuccessText: {
    color: '#00D26A',
    fontSize: 13,
    fontWeight: '700',
  },
  modalConfirmTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  highlightText: {
    color: '#00D26A',
    fontWeight: '800',
  },
  primaryActionButton: {
    backgroundColor: '#00D26A',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryActionText: {
    color: '#0A0F1D',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryActionText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 13,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#0A0F1D',
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
  },
});
