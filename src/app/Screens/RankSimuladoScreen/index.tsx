import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator, 
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { database } from '../../../configs/firebaseConfig';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';

interface UserRankingSimulado {
  id: string;
  nome: string;
  tipoSimulado: string;
  totalAcertos: number;
  totalQuestoes: number;
  taxaAcerto: number;
  tempoProva: string;
  dataSimulado: string;
  melhorMateria: { nome: string; acertos: number; total: number };
  piorMateria: { nome: string; acertos: number; total: number };
}

const RankSimuladoScreen = () => {
  const router = useRouter();
  const [ranking, setRanking] = useState<UserRankingSimulado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>('Todos');

  useEffect(() => {
    loadRanking();
  }, [filtroTipo]);

  const loadRanking = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os usuários
      const usersSnapshot = await getDocs(collection(database, 'usuarios'));
      const usersData: UserRankingSimulado[] = [];

      for (const userDoc of usersSnapshot.docs) {
        try {
          const userData = userDoc.data();
          
          // Buscar simulados do usuário
          const simuladosRef = collection(database, 'usuarios', userDoc.id, 'simulados');
          let simuladosQuery = query(simuladosRef, orderBy('timestamp', 'desc'));
          
          if (filtroTipo !== 'Todos') {
            simuladosQuery = query(simuladosRef, 
              where('tipo', '==', filtroTipo),
              orderBy('timestamp', 'desc')
            );
          }
          
          const simuladosSnap = await getDocs(simuladosQuery);

          if (!simuladosSnap.empty) {
            // Pegar o simulado mais recente do usuário
            const ultimoSimulado = simuladosSnap.docs[0].data();
            
            // Calcular melhor e pior matéria
            let melhorMateria = { nome: 'Nenhuma', acertos: 0, total: 0 };
            let piorMateria = { nome: 'Nenhuma', acertos: 0, total: 0 };
            
            if (ultimoSimulado.materias && ultimoSimulado.materias.length > 0) {
              let primeira = true;
              ultimoSimulado.materias.forEach((materia: any) => {
                if (primeira) {
                  melhorMateria = { nome: materia.nome, acertos: materia.acertos, total: materia.total };
                  piorMateria = { nome: materia.nome, acertos: materia.acertos, total: materia.total };
                  primeira = false;
                } else {
                  const taxaAtual = materia.acertos / materia.total;
                  const taxaMelhor = melhorMateria.acertos / melhorMateria.total;
                  const taxaPior = piorMateria.acertos / piorMateria.total;
                  
                  if (taxaAtual > taxaMelhor) {
                    melhorMateria = { nome: materia.nome, acertos: materia.acertos, total: materia.total };
                  }
                  if (taxaAtual < taxaPior) {
                    piorMateria = { nome: materia.nome, acertos: materia.acertos, total: materia.total };
                  }
                }
              });
            }

            usersData.push({
              id: userDoc.id,
              nome: userData.nome || 'Usuário',
              tipoSimulado: ultimoSimulado.tipo,
              totalAcertos: ultimoSimulado.totalAcertos,
              totalQuestoes: ultimoSimulado.totalQuestoes,
              taxaAcerto: parseFloat(ultimoSimulado.porcentagemAcerto),
              tempoProva: ultimoSimulado.tempoProva,
              dataSimulado: ultimoSimulado.dataFormatada,
              melhorMateria,
              piorMateria
            });
          }
        } catch (error) {
          console.error(`Erro ao processar usuário ${userDoc.id}:`, error);
        }
      }

      // Ordenar por taxa de acerto (decrescente)
      const sortedRanking = usersData.sort((a, b) => b.taxaAcerto - a.taxaAcerto);
      setRanking(sortedRanking);

    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0: return '#FFD700';
      case 1: return '#C0C0C0';
      case 2: return '#CD7F32';
      default: return '#6B7280';
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${position + 1}°`;
    }
  };

  const tiposSimulado = ['Todos', 'ENEM', 'SIS', 'PSC', 'PSI', 'MACRO'];

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
          <Text style={styles.title}>Ranking de Simulados</Text>
          <Text style={styles.subtitle}>Desempenho nos simulados realizados</Text>
        </View>

        {/* Filtros */}
        <View style={styles.filtroContainer}>
          <Text style={styles.filtroTitle}>Filtrar por tipo:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtroScroll}
          >
            {tiposSimulado.map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.filtroButton,
                  filtroTipo === tipo && styles.filtroButtonAtivo
                ]}
                onPress={() => setFiltroTipo(tipo)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filtroButtonText,
                  filtroTipo === tipo && styles.filtroButtonTextAtivo
                ]}>
                  {tipo}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Estatísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={24} color="#d32f2f" />
            <Text style={styles.statNumber}>{ranking.length}</Text>
            <Text style={styles.statLabel}>Participantes</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.statNumber}>
              {ranking.length > 0 ? ranking[0].taxaAcerto.toFixed(1) + '%' : '0%'}
            </Text>
            <Text style={styles.statLabel}>Melhor taxa</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={24} color="#118AB2" />
            <Text style={styles.statNumber}>
              {filtroTipo !== 'Todos' ? filtroTipo : 'Todos'}
            </Text>
            <Text style={styles.statLabel}>Tipo</Text>
          </View>
        </View>

        {/* Ranking */}
        <View style={styles.rankingContainer}>
          {ranking.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>
                {filtroTipo === 'Todos' 
                  ? 'Nenhum simulado encontrado'
                  : `Nenhum simulado desse tipo encontrado`
                }
              </Text>
              <Text style={styles.emptySubtext}>
                Os usuários ainda não realizaram simulados{'\n'}
                ou os dados estão sendo processados.
              </Text>
            </View>
          ) : (
            ranking.map((user, index) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.positionContainer}>
                    <View style={[styles.medal, { backgroundColor: getMedalColor(index) }]}>
                      <Text style={styles.medalText}>{getMedalIcon(index)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.nome}</Text>
                    <View style={styles.simuladoInfo}>
                      <View style={[styles.tipoBadge, { backgroundColor: getColorByTipo(user.tipoSimulado) }]}>
                        <Text style={styles.tipoBadgeText}>{user.tipoSimulado}</Text>
                      </View>
                      <Text style={styles.dataText}>{user.dataSimulado}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.positionBadge}>
                    <Text style={styles.positionText}>{index + 1}°</Text>
                    <Text style={styles.positionLabel}>Posição</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.performanceContainer}>
                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceLabel}>Acertos</Text>
                    <Text style={styles.performanceValueSuccess}>{user.totalAcertos}</Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceLabel}>Total</Text>
                    <Text style={styles.performanceValue}>{user.totalQuestoes}</Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceLabel}>Tempo</Text>
                    <Text style={styles.performanceValue}>{user.tempoProva}</Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceLabel}>Taxa</Text>
                    <Text style={styles.performanceValue}>{user.taxaAcerto.toFixed(1)}%</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailedStats}>
                  <View style={styles.statRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statTitle}>Melhor Matéria</Text>
                      <Text style={[styles.statValue, styles.successText]}>
                        {user.melhorMateria.nome}
                      </Text>
                      <Text style={styles.statSubtext}>
                        {user.melhorMateria.acertos}/{user.melhorMateria.total} •{' '}
                        {user.melhorMateria.total > 0 
                          ? ((user.melhorMateria.acertos / user.melhorMateria.total) * 100).toFixed(0) + '%'
                          : '0%'
                        }
                      </Text>
                    </View>
                    
                    <View style={styles.statBox}>
                      <Text style={styles.statTitle}>Pior Matéria</Text>
                      <Text style={[styles.statValue, styles.errorText]}>
                        {user.piorMateria.nome}
                      </Text>
                      <Text style={styles.statSubtext}>
                        {user.piorMateria.acertos}/{user.piorMateria.total} •{' '}
                        {user.piorMateria.total > 0 
                          ? ((user.piorMateria.acertos / user.piorMateria.total) * 100).toFixed(0) + '%'
                          : '0%'
                        }
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ranking atualizado em tempo real
          </Text>
          <TouchableOpacity onPress={loadRanking} style={styles.refreshButton}>
            <Ionicons name="refresh" size={16} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Função auxiliar para definir cores com base no tipo de simulado
const getColorByTipo = (tipo: string) => {
  switch (tipo) {
    case 'ENEM': return '#118AB2';
    case 'SIS': return '#06D6A0';
    case 'PSC': return '#FFD166';
    case 'PSI': return '#F72585';
    case 'MACRO': return '#7209B7';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    marginBottom: 20,
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
    marginBottom: 10,
  },
  filtroContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.5,
    elevation: 5,
  },
  filtroTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  filtroScroll: {
    marginHorizontal: -5,
  },
  filtroButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f1f5f9',
  },
  filtroButtonAtivo: {
    backgroundColor: '#d32f2f',
  },
  filtroButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  filtroButtonTextAtivo: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.5,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  rankingContainer: {
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.5,
    elevation: 5,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  positionContainer: {
    marginRight: 15,
  },
  medal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  simuladoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  tipoBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  dataText: {
    fontSize: 12,
    color: '#666',
  },
  positionBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 12,
    minWidth: 60,
  },
  positionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  positionLabel: {
    fontSize: 10,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  performanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  performanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  performanceValueSuccess: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  detailedStats: {
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: '#666',
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  refreshButton: {
    padding: 4,
  },
});

export default RankSimuladoScreen;