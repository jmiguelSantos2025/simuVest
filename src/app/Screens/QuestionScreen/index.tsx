import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, database } from '../../../configs/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const QuestionScreen = ({ navigation }: any) => {
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

  const [materiaSelecionada, setMateriaSelecionada] = useState<any>(null);
  const [totalQuestoes, setTotalQuestoes] = useState('');
  const [acertos, setAcertos] = useState('');
  const [erros, setErros] = useState('');

  const user = auth.currentUser;

  const handleSalvar = async () => {
    if (!materiaSelecionada) {
      Alert.alert('Atenção', 'Selecione uma matéria primeiro!');
      return;
    }
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    const total = parseInt(totalQuestoes) || 0;
    const numAcertos = parseInt(acertos) || 0;
    const numErros = parseInt(erros) || 0;

    if (total <= 0) {
      Alert.alert('Erro', 'O total de questões deve ser maior que zero!');
      return;
    }
    if (numAcertos + numErros > total) {
      Alert.alert('Erro', 'A soma de acertos e erros não pode ser maior que o total de questões!');
      return;
    }

    try {
      // PRIMEIRO: Salvar/Atualizar os dados básicos do usuário (incluindo nome)
      const userDocRef = doc(database, 'usuarios', user.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (!userSnapshot.exists()) {
        // Se o usuário não existe, criar com nome e dados básicos
        await setDoc(userDocRef, {
          nome: user.displayName || user.email || 'Usuário',
          email: user.email,
          dataCriacao: new Date().toISOString(),
          ultimaAtualizacao: new Date().toISOString(),
        });
      } else {
        // Se já existe, garantir que tem o campo nome
        const userData = userSnapshot.data();
        if (!userData.nome) {
          await updateDoc(userDocRef, {
            nome: user.displayName || user.email || 'Usuário',
            ultimaAtualizacao: new Date().toISOString(),
          });
        }
      }

      // SEGUNDO: Salvar os dados específicos da matéria na subcoleção
      const materiaDocRef = doc(database, 'usuarios', user.uid, 'materias', materiaSelecionada.nome);
      const materiaSnapshot = await getDoc(materiaDocRef);

      if (materiaSnapshot.exists()) {
        // Se a matéria já existe, atualizar os valores
        const dadosAtuais = materiaSnapshot.data();
        await updateDoc(materiaDocRef, {
          totalQuestoes: (dadosAtuais.totalQuestoes || 0) + total,
          acertos: (dadosAtuais.acertos || 0) + numAcertos,
          erros: (dadosAtuais.erros || 0) + numErros,
          ultimaAtualizacao: new Date().toISOString(),
        });
      } else {
        // Se a matéria não existe, criar novo documento
        await setDoc(materiaDocRef, {
          totalQuestoes: total,
          acertos: numAcertos,
          erros: numErros,
          ultimaAtualizacao: new Date().toISOString(),
        });
      }

      Alert.alert(
        'Sucesso!',
        `Dados de ${materiaSelecionada.nome} salvos com sucesso!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setTotalQuestoes('');
              setAcertos('');
              setErros('');
              setMateriaSelecionada(null);
            },
          },
        ]
      );

      console.log('✅ Dados salvos:', {
        usuario: user.uid,
        materia: materiaSelecionada.nome,
        totalQuestoes: total,
        acertos: numAcertos,
        erros: numErros
      });

    } catch (error) {
      console.log('❌ Erro ao salvar dados:', error);
      Alert.alert('Erro', 'Não foi possível salvar os dados. Tente novamente.');
    }
  };

  const calcularPorcentagem = () => {
    const total = parseInt(totalQuestoes) || 0;
    const numAcertos = parseInt(acertos) || 0;
    if (total === 0) return 0;
    return ((numAcertos / total) * 100).toFixed(1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#d32f2f" />
          </TouchableOpacity>
          <Text style={styles.title}>Adicionar Questões</Text>
          <Text style={styles.subtitle}>Registre seu desempenho por matéria</Text>
          {user && (
            <Text style={styles.userInfo}>
              Usuário: {user.displayName || user.email}
            </Text>
          )}
        </View>

        {/* Seleção de matéria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecione a Matéria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.materiasContainer}>
            {materiasPredefinidas.map((materia) => (
              <TouchableOpacity
                key={materia.id}
                style={[styles.materiaButton, { backgroundColor: materia.cor }, materiaSelecionada?.id === materia.id && styles.materiaSelecionada]}
                onPress={() => setMateriaSelecionada(materia)}
                activeOpacity={0.7}
              >
                <Text style={styles.materiaText}>{materia.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Inputs */}
        {materiaSelecionada && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados de {materiaSelecionada.nome}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total de Questões</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 20"
                placeholderTextColor="#999"
                value={totalQuestoes}
                onChangeText={setTotalQuestoes}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Acertos</Text>
                <TextInput
                  style={[styles.input, styles.successInput]}
                  placeholder="Ex: 15"
                  placeholderTextColor="#999"
                  value={acertos}
                  onChangeText={setAcertos}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Erros</Text>
                <TextInput
                  style={[styles.input, styles.errorInput]}
                  placeholder="Ex: 5"
                  placeholderTextColor="#999"
                  value={erros}
                  onChangeText={setErros}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {totalQuestoes && acertos && (
              <View style={styles.resultadoContainer}>
                <Text style={styles.resultadoText}>
                  Taxa de acerto: <Text style={styles.porcentagemText}>{calcularPorcentagem()}%</Text>
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Botão salvar */}
        <TouchableOpacity 
          style={[styles.primaryButton, !materiaSelecionada && styles.disabledButton]} 
          onPress={handleSalvar} 
          disabled={!materiaSelecionada} 
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            Salvar Desempenho em {materiaSelecionada?.nome || 'Matéria'}
          </Text>
        </TouchableOpacity>

        {/* Informações de debug */}
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>ℹ️  Estrutura do Banco</Text>
          <Text style={styles.debugText}>
            • Coleção: usuarios/{user?.uid}/materias/{'\n'}
            • Documentos: Cada matéria será um documento separado{'\n'}
            • Campos: totalQuestoes, acertos, erros, ultimaAtualizacao
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 30 },
  backButton: { 
    alignSelf: 'flex-start', 
    marginBottom: 15, 
    padding: 8, 
    backgroundColor: '#ffebee', 
    borderRadius: 20, 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 5, color: '#d32f2f' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 5 },
  userInfo: { fontSize: 14, color: '#888', fontStyle: 'italic' },
  section: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 20, 
    marginBottom: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3.5, 
    elevation: 5 
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  materiasContainer: { marginBottom: 10 },
  materiaButton: { 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    borderRadius: 20, 
    marginRight: 10, 
    minWidth: 100, 
    alignItems: 'center' 
  },
  materiaSelecionada: { 
    borderWidth: 3, 
    borderColor: '#fff', 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 4 
  },
  materiaText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { flex: 1, marginBottom: 15, marginRight: 10 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#333' },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  successInput: { borderColor: '#4CAF50' },
  errorInput: { borderColor: '#F44336' },
  resultadoContainer: { backgroundColor: '#e8f5e8', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  resultadoText: { fontSize: 16, color: '#2E7D32' },
  porcentagemText: { fontWeight: 'bold', fontSize: 18 },
  primaryButton: { 
    width: '100%', 
    backgroundColor: '#d32f2f', 
    padding: 16, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  disabledButton: { backgroundColor: '#f5c2c7' },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  debugSection: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#546e7a',
    lineHeight: 16,
  },
});

export default QuestionScreen;