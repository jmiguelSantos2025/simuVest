import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, database } from '../../../configs/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';

interface MateriaSelecionada {
  id: number;
  nome: string;
  cor: string;
  acertos: string;
  erros: string;
}

export default function SimuladoScreen() {
  const router = useRouter();
  
  // Matérias predefinidas
  const materiasPredefinidas = [
    { id: 1, nome: 'Matemática', cor: '#FF6B6B' },
    { id: 2, nome: 'Português', cor: '#4ECDC4' },
    { id: 3, nome: 'História', cor: '#FFD166' },
    { id: 4, nome: 'Geografia', cor: '#06D6A0' },
    { id: 5, nome: 'Física', cor: '#118AB2' },
    { id: 6, nome: 'Química', cor: '#073B4C' },
    { id: 7, nome: 'Biologia', cor: '#7209B7' },
    { id: 8, nome: 'Inglês', cor: '#F72585' },
    { id: 9, nome: 'Filosofia', cor: '#3A0CA3' },
    { id: 10, nome: 'Sociologia', cor: '#4361EE' },
  ];

  // Tipos de simulado predefinidos
  const tiposSimulado = [
    { id: 1, nome: 'SIS', cor: '#FF6B6B', descricao: 'Sistema de Ingresso Seriado' },
    { id: 2, nome: 'MACRO', cor: '#4ECDC4', descricao: 'Vestibular UEA' },
    { id: 3, nome: 'PSI', cor: '#FFD166', descricao: 'Projeto Seletivo do Interior' },
    { id: 4, nome: 'PSC', cor: '#06D6A0', descricao: 'Processo Seletivo Contínuo' },
    { id: 5, nome: 'ENEM', cor: '#118AB2', descricao: 'Exame Nacional do Ensino Médio' },
  ];

  const [tipoSimuladoSelecionado, setTipoSimuladoSelecionado] = useState<any>(null);
  const [materiasSelecionadas, setMateriasSelecionadas] = useState<MateriaSelecionada[]>([]);
  const [tempoProva, setTempoProva] = useState('');

  const user = auth.currentUser;

  const toggleMateriaSelection = (materia: any) => {
    const alreadySelected = materiasSelecionadas.find(m => m.id === materia.id);
    
    if (alreadySelected) {
      // Remover matéria se já estiver selecionada
      setMateriasSelecionadas(materiasSelecionadas.filter(m => m.id !== materia.id));
    } else {
      // Adicionar matéria com campos vazios
      setMateriasSelecionadas([
        ...materiasSelecionadas,
        {
          ...materia,
          acertos: '',
          erros: ''
        }
      ]);
    }
  };

  const updateMateriaData = (id: number, field: 'acertos' | 'erros', value: string) => {
    setMateriasSelecionadas(
      materiasSelecionadas.map(materia =>
        materia.id === id ? { ...materia, [field]: value } : materia
      )
    );
  };

  const calcularTotalQuestoes = () => {
    return materiasSelecionadas.reduce((total, materia) => {
      const acertos = parseInt(materia.acertos) || 0;
      const erros = parseInt(materia.erros) || 0;
      return total + acertos + erros;
    }, 0);
  };

  const calcularTotalAcertos = () => {
    return materiasSelecionadas.reduce((total, materia) => {
      return total + (parseInt(materia.acertos) || 0);
    }, 0);
  };

  const calcularPorcentagemGeral = () => {
    const totalQuestoes = calcularTotalQuestoes();
    const totalAcertos = calcularTotalAcertos();
    if (totalQuestoes === 0) return '0';
    return ((totalAcertos / totalQuestoes) * 100).toFixed(1);
  };

  const validarDados = () => {
    for (const materia of materiasSelecionadas) {
      const acertos = parseInt(materia.acertos) || 0;
      const erros = parseInt(materia.erros) || 0;
      
      if (acertos < 0 || erros < 0) {
        Alert.alert('Erro', 'Acertos e erros não podem ser negativos!');
        return false;
      }
      
      if (acertos + erros === 0) {
        Alert.alert('Erro', `A matéria ${materia.nome} precisa ter pelo menos uma questão!`);
        return false;
      }
    }
    
    if (calcularTotalQuestoes() === 0) {
      Alert.alert('Erro', 'O simulado precisa ter pelo menos uma questão!');
      return false;
    }
    
    return true;
  };

  const handleSalvar = async () => {
    if (materiasSelecionadas.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos uma matéria!');
      return;
    }

    if (!tipoSimuladoSelecionado) {
      Alert.alert('Atenção', 'Selecione o tipo de simulado!');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    if (!validarDados()) {
      return;
    }

    try {
      // 1. Garantir que o usuário existe e tem nome
      const userDocRef = doc(database, 'usuarios', user.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (!userSnapshot.exists()) {
        await setDoc(userDocRef, {
          nome: user.displayName || user.email || 'Usuário',
          email: user.email,
          dataCriacao: new Date().toISOString(),
        });
      } else {
        const userData = userSnapshot.data();
        if (!userData.nome) {
          await updateDoc(userDocRef, {
            nome: user.displayName || user.email || 'Usuário',
          });
        }
      }

      // 2. Atualizar os dados gerais de cada matéria (para o ranking)
      for (const materia of materiasSelecionadas) {
        const acertos = parseInt(materia.acertos) || 0;
        const erros = parseInt(materia.erros) || 0;
        const total = acertos + erros;

        const materiaDocRef = doc(database, 'usuarios', user.uid, 'materias', materia.nome);
        const materiaSnapshot = await getDoc(materiaDocRef);

        if (materiaSnapshot.exists()) {
          const dadosAtuais = materiaSnapshot.data();
          await updateDoc(materiaDocRef, {
            totalQuestoes: (dadosAtuais.totalQuestoes || 0) + total,
            acertos: (dadosAtuais.acertos || 0) + acertos,
            erros: (dadosAtuais.erros || 0) + erros,
            ultimaAtualizacao: new Date().toISOString(),
          });
        } else {
          await setDoc(materiaDocRef, {
            totalQuestoes: total,
            acertos: acertos,
            erros: erros,
            ultimaAtualizacao: new Date().toISOString(),
          });
        }
      }

      // 3. Salvar o simulado completo na subcoleção "simulados"
      const simuladosRef = collection(database, 'usuarios', user.uid, 'simulados');
      
      const simuladoData = {
        tipo: tipoSimuladoSelecionado.nome,
        tempoProva: tempoProva || 'Não informado',
        totalQuestoes: calcularTotalQuestoes(),
        totalAcertos: calcularTotalAcertos(),
        porcentagemAcerto: calcularPorcentagemGeral(),
        data: new Date().toISOString(),
        dataFormatada: new Date().toLocaleDateString('pt-BR'),
        timestamp: new Date().getTime(),
        materias: materiasSelecionadas.map(materia => ({
          nome: materia.nome,
          acertos: parseInt(materia.acertos) || 0,
          erros: parseInt(materia.erros) || 0,
          total: (parseInt(materia.acertos) || 0) + (parseInt(materia.erros) || 0),
          porcentagem: ((parseInt(materia.acertos) || 0) / ((parseInt(materia.acertos) || 0) + (parseInt(materia.erros) || 0) || 1) * 100).toFixed(1)
        }))
      };

      await addDoc(simuladosRef, simuladoData);

      // 4. Mostrar mensagem de sucesso
      Alert.alert(
        'Simulado Salvo!', 
        `Simulado ${tipoSimuladoSelecionado.nome} salvo com sucesso!\n\nTotal: ${calcularTotalQuestoes()} questões\nAcertos: ${calcularTotalAcertos()}\nDesempenho: ${calcularPorcentagemGeral()}%`,
        [

          { 
            text: 'Novo Simulado', 
            onPress: () => {
              // Limpar campos após salvar
              setMateriasSelecionadas([]);
              setTempoProva('');
              setTipoSimuladoSelecionado(null);
            },
            style: 'cancel'
          }
        ]
      );

      console.log('✅ Simulado salvo com sucesso!');

    } catch (error) {
      console.error('❌ Erro ao salvar simulado:', error);
      Alert.alert('Erro', 'Não foi possível salvar os dados. Tente novamente.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#d32f2f" />
          </TouchableOpacity>
          <Text style={styles.title}>Registrar Simulado</Text>
          <Text style={styles.subtitle}>Adicione os dados do seu simulado completo</Text>
          {user && (
            <Text style={styles.userInfo}>
              Usuário: {user.displayName || user.email}
            </Text>
          )}
        </View>

        {/* Seção Tipo de Simulado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Simulado</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tiposContainer}
          >
            {tiposSimulado.map((tipo) => (
              <TouchableOpacity
                key={tipo.id}
                style={[
                  styles.tipoButton,
                  { backgroundColor: tipo.cor },
                  tipoSimuladoSelecionado?.id === tipo.id && styles.tipoSelecionado
                ]}
                onPress={() => setTipoSimuladoSelecionado(tipo)}
                activeOpacity={0.7}
              >
                <Text style={styles.tipoText}>{tipo.nome}</Text>
                <Text style={styles.tipoDescricao}>{tipo.descricao}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Seção Matérias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Matérias do Simulado ({materiasSelecionadas.length} selecionadas)
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.materiasContainer}
          >
            {materiasPredefinidas.map((materia) => {
              const isSelected = materiasSelecionadas.find(m => m.id === materia.id);
              return (
                <TouchableOpacity
                  key={materia.id}
                  style={[
                    styles.materiaButton,
                    { backgroundColor: materia.cor },
                    isSelected && styles.materiaSelecionada
                  ]}
                  onPress={() => toggleMateriaSelection(materia)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.materiaText}>{materia.nome}</Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#fff" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tempo Total */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tempo Total de Prova</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Ex: 3h30min ou 210min"
              placeholderTextColor="#999"
              value={tempoProva}
              onChangeText={setTempoProva}
            />
          </View>
        </View>

        {/* Dados das Matérias Selecionadas */}
        {materiasSelecionadas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados por Matéria</Text>
            
            {materiasSelecionadas.map((materia) => (
              <View key={materia.id} style={styles.materiaDataContainer}>
                <Text style={[styles.materiaName, { color: materia.cor }]}>
                  {materia.nome}
                </Text>
                
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Acertos</Text>
                    <TextInput
                      style={[styles.input, styles.successInput]}
                      placeholder="0"
                      placeholderTextColor="#999"
                      value={materia.acertos}
                      onChangeText={(value) => updateMateriaData(materia.id, 'acertos', value)}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Erros</Text>
                    <TextInput
                      style={[styles.input, styles.errorInput]}
                      placeholder="0"
                      placeholderTextColor="#999"
                      value={materia.erros}
                      onChangeText={(value) => updateMateriaData(materia.id, 'erros', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {materia.acertos && materia.erros && (
                  <View style={styles.materiaResultado}>
                    <Text style={styles.materiaResultadoText}>
                      Total: {(parseInt(materia.acertos) || 0) + (parseInt(materia.erros) || 0)} questões
                    </Text>
                    <Text style={styles.materiaResultadoText}>
                      Desempenho: {((parseInt(materia.acertos) || 0) / ((parseInt(materia.acertos) || 0) + (parseInt(materia.erros) || 0) || 1) * 100).toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {/* Resumo Geral */}
            <View style={styles.resumoContainer}>
              <Text style={styles.resumoTitle}>Resumo do Simulado</Text>
              <Text style={styles.resumoText}>
                Total de Questões: <Text style={styles.resumoDestaque}>{calcularTotalQuestoes()}</Text>
              </Text>
              <Text style={styles.resumoText}>
                Total de Acertos: <Text style={styles.resumoDestaque}>{calcularTotalAcertos()}</Text>
              </Text>
              <Text style={styles.resumoText}>
                Desempenho Geral: <Text style={styles.resumoDestaque}>{calcularPorcentagemGeral()}%</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Botão Salvar */}
        <TouchableOpacity 
          style={[
            styles.primaryButton,
            (materiasSelecionadas.length === 0 || !tipoSimuladoSelecionado) && styles.disabledButton
          ]} 
          onPress={handleSalvar}
          disabled={materiasSelecionadas.length === 0 || !tipoSimuladoSelecionado}
          activeOpacity={0.8}
        >
          <Ionicons name="trophy" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Salvar Simulado Completo</Text>
        </TouchableOpacity>

        {/* Informações */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Cada simulado pode conter várias matérias com seus respectivos acertos e erros,
            mas com um único tempo total de prova.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#d32f2f',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  userInfo: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.5,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  tiposContainer: {
    marginBottom: 10,
  },
  tipoButton: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipoSelecionado: {
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tipoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  tipoDescricao: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  materiasContainer: {
    marginBottom: 10,
  },
  materiaButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  materiaSelecionada: {
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  materiaText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  checkIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 2,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  successInput: {
    borderColor: '#4CAF50',
  },
  errorInput: {
    borderColor: '#F44336',
  },
  materiaDataContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
  },
  materiaName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  materiaResultado: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  materiaResultadoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  resumoContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  resumoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  resumoText: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 5,
  },
  resumoDestaque: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#d32f2f',
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#f5c2c7',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    color: '#1976d2',
    fontSize: 12,
    lineHeight: 16,
  },
});