import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const MainScreen = () => {
  const menuItems = [
    {
      id: 1,
      title: 'Questões por Matéria',
      subtitle: 'Adicionar número de questões',
      icon: 'book-outline',
      screen: '/Screens/QuestionScreen',
      color: '#4CAF50'
    },
    {
      id: 2,
      title: 'Ranking de Questões',
      subtitle: 'Ver ranking de questões',
      icon: 'stats-chart-outline',
      screen: '/Screens/RankQuestionScreen',
      color: '#2196F3'
    },
    {
      id: 3,
      title: 'Notas de Simulados',
      subtitle: 'Adicionar notas de simulados',
      icon: 'document-text-outline',
      screen: '/Screens/SimuladoScreen',
      color: '#FF9800'
    },
    {
      id: 4,
      title: 'Ranking de Simulados',
      subtitle: 'Ver ranking de simulados',
      icon: 'trophy-outline',
      screen: '/Screens/RankSimuladoScreen',
      color: '#9C27B0'
    },
    {
      id: 5,
      title: 'Em processo de desenvolvimento',
      subtitle: 'Acompanhar seu desempenho',
      icon: 'analytics-outline',
      screen: '/Desempenho',
      color: '#F44336'
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1001/1001371.png' }} 
            style={styles.logo}
          />
          <Text style={styles.title}>VestSimu</Text>
          <Text style={styles.subtitle}>Sua plataforma de estudos</Text>
        </View>

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Olá, Estudante!</Text>
          <Text style={styles.welcomeText}>O que você gostaria de fazer hoje?</Text>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuButton, { borderLeftColor: item.color }]}
              onPress={() => router.push(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.menuButtonContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.menuButtonTitle}>{item.title}</Text>
                  <Text style={styles.menuButtonSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Rumo a aprovação!</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { width:"100%", height:"100%", backgroundColor: '#f8f9fa' },
  container: { width:"100%", height:"100%", padding: 20 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  logo: { width: 80, height: 80, marginBottom: 15, tintColor: '#d32f2f' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 5, color: '#d32f2f', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
  welcomeContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.5, elevation: 5 },
  welcomeTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  welcomeText: { fontSize: 14, color: '#666' },
  menuContainer: { marginBottom: 30 },
  menuButton: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 15, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 3 },
  menuButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1 },
  menuButtonTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4, color: '#333' },
  menuButtonSubtitle: { fontSize: 12, color: '#666' },
  footer: { alignItems: 'center', marginBottom: 20 },
  footerText: { fontSize: 12, color: '#999' },
});

export default MainScreen;
