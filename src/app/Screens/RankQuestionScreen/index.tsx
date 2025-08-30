import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { database } from '../../../configs/firebaseConfig';
import { collection, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';

interface UserRanking {
  id: string;
  nome: string;
  totalAcertos: number;
  totalQuestoes: number;
  taxaAcerto: number;
  melhorMateria: { nome: string; acertos: number; total: number };
  piorMateria: { nome: string; acertos: number; total: number };
  materias: Record<string, { acertos: number; erros: number; total: number }>;
}

const RankQuestionScreen = () => {
  const [ranking, setRanking] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Iniciando carregamento do ranking...');

    const loadRanking = async () => {
      try {
        // Primeiro, buscar todos os usuários
        const usersSnapshot = await getDocs(collection(database, 'usuarios'));
        console.log('Total de usuários encontrados:', usersSnapshot.docs.length);

        const usersData: UserRanking[] = [];

        // Processar cada usuário
        for (const userDoc of usersSnapshot.docs) {
          try {
            const userData = userDoc.data();
            console.log('Processando usuário:', userDoc.id, userData);

            // Buscar a subcoleção de matérias do usuário
            const materiasRef = collection(database, 'usuarios', userDoc.id, 'materias');
            const materiasSnap = await getDocs(materiasRef);
            
            console.log(`Matérias do usuário ${userDoc.id}:`, materiasSnap.docs.length);

            const materias: Record<string, { acertos: number; erros: number; total: number }> = {};
            let totalAcertos = 0;
            let totalQuestoes = 0;

            materiasSnap.forEach((materiaDoc) => {
              const materiaData = materiaDoc.data();
              console.log('Dados da matéria:', materiaDoc.id, materiaData);

              const acertos = materiaData.acertos || 0;
              const erros = materiaData.erros || 0;
              const total = acertos + erros;

              materias[materiaDoc.id] = { acertos, erros, total };
              totalAcertos += acertos;
              totalQuestoes += total;
            });

            console.log(`Usuário ${userDoc.id}: ${totalAcertos} acertos, ${totalQuestoes} questões`);

            // Encontrar melhor e pior matéria
            let melhorMateria = { nome: 'Nenhuma', acertos: 0, total: 0 };
            let piorMateria = { nome: 'Nenhuma', acertos: 0, total: 0 };
            let primeira = true;

            Object.entries(materias).forEach(([nome, dados]) => {
              if (dados.total > 0) {
                const taxa = dados.acertos / dados.total;
                
                if (primeira) {
                  melhorMateria = { nome, acertos: dados.acertos, total: dados.total };
                  piorMateria = { nome, acertos: dados.acertos, total: dados.total };
                  primeira = false;
                } else {
                  const taxaMelhor = melhorMateria.total > 0 ? melhorMateria.acertos / melhorMateria.total : 0;
                  const taxaPior = piorMateria.total > 0 ? piorMateria.acertos / piorMateria.total : 1;

                  if (taxa > taxaMelhor) {
                    melhorMateria = { nome, acertos: dados.acertos, total: dados.total };
                  }
                  if (taxa < taxaPior) {
                    piorMateria = { nome, acertos: dados.acertos, total: dados.total };
                  }
                }
              }
            });

            usersData.push({
              id: userDoc.id,
              nome: userData.nome || 'Sem Nome',
              totalAcertos,
              totalQuestoes,
              taxaAcerto: totalQuestoes > 0 ? parseFloat(((totalAcertos / totalQuestoes) * 100).toFixed(1)) : 0,
              melhorMateria,
              piorMateria,
              materias,
            });

          } catch (userError) {
            console.error(`Erro no usuário ${userDoc.id}:`, userError);
          }
        }

        // Ordenar por total de acertos
        const sortedRanking = usersData.sort((a, b) => b.totalAcertos - a.totalAcertos);
        setRanking(sortedRanking);
        console.log('Ranking carregado com sucesso!');

      } catch (err) {
        console.error('Erro geral:', err);
        setError('Erro ao carregar ranking');
      } finally {
        setLoading(false);
      }
    };

    loadRanking();

    // Listener para atualizações em tempo real
    const unsubscribe = onSnapshot(
      collection(database, 'usuarios'),
      () => {
        console.log('Atualização detectada, recarregando...');
        loadRanking();
      },
      (err) => {
        console.error('Erro no listener:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Logs para debug
  console.log('Estado - Loading:', loading, 'Error:', error, 'Ranking length:', ranking.length);
  if (ranking.length > 0) {
    console.log('Primeiro usuário do ranking:', ranking[0]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d32f2f" />
          <Text style={styles.loadingText}>Carregando ranking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (ranking.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum dado de ranking disponível</Text>
          <Text style={styles.emptySubText}>
            Verifique se os usuários têm matérias cadastradas
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Ranking de Desempenho</Text>
        <Text style={styles.subHeader}>{ranking.length} usuários no ranking</Text>
        
        {ranking.map((user, index) => (
          <View key={user.id} style={styles.userCard}>
            <Text style={styles.rankPosition}>#{index + 1}</Text>
            <Text style={styles.userName}>{user.nome}</Text>
            <Text style={styles.stats}>
              Acertos: {user.totalAcertos} / {user.totalQuestoes} • {user.taxaAcerto}%
            </Text>
            
            <View style={styles.materiasInfo}>
              <Text style={styles.materiaLabel}>
                🏆 Melhor: {user.melhorMateria.nome} ({user.melhorMateria.acertos}/{user.melhorMateria.total})
              </Text>
              <Text style={styles.materiaLabel}>
                ⚠️ Pior: {user.piorMateria.nome} ({user.piorMateria.acertos}/{user.piorMateria.total})
              </Text>
            </View>

            <ScrollView horizontal style={styles.materiasScroll}>
              {Object.entries(user.materias).map(([nome, dados]) => (
                <View key={nome} style={styles.materiaBox}>
                  <Text style={styles.materiaName}>{nome}</Text>
                  <Text style={styles.materiaStats}>{dados.acertos}/{dados.total}</Text>
                  <Text style={styles.materiaPercentage}>
                    {dados.total > 0 ? ((dados.acertos / dados.total) * 100).toFixed(0) : 0}%
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1, padding: 15 },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 15 },
  subHeader: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, color: '#666', marginBottom: 10 },
  emptySubText: { fontSize: 14, color: '#999', textAlign: 'center' },
  loadingText: { marginTop: 10, color: '#666', fontSize: 16 },
  errorText: { color: '#d32f2f', fontSize: 16, textAlign: 'center' },
  userCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  rankPosition: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stats: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 10,
  },
  materiasInfo: {
    marginBottom: 10,
  },
  materiaLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  materiasScroll: {
    marginTop: 10,
  },
  materiaBox: {
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  materiaName: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'center',
  },
  materiaStats: {
    fontSize: 12,
    marginBottom: 2,
  },
  materiaPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
});

export default RankQuestionScreen;