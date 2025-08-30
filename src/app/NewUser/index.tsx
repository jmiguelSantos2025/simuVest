import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Image, KeyboardAvoidingView, 
  Platform, ScrollView, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../../src/configs/firebaseConfig"; // ajuste o caminho
import { router } from "expo-router"; // se estiver usando expo-router

const NewUserScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }

    try {
      // Cria o usuário no Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Atualiza o displayName
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      Alert.alert("Sucesso", "Conta criada com sucesso!");
      
      // Redireciona para a tela de login
      router.replace("/MainScreen");
    } catch (error: any) {
      console.log("Erro ao criar usuário:", error);
      let message = "Erro ao criar conta";
      if (error.code === "auth/email-already-in-use") message = "Email já está em uso";
      else if (error.code === "auth/invalid-email") message = "Email inválido";
      else if (error.code === "auth/weak-password") message = "Senha muito fraca";

      Alert.alert("Erro", message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#d32f2f" />
          </TouchableOpacity>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1001/1001371.png' }} 
            style={styles.logo}
          />
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Junte-se ao VestSimu e melhore seus estudos</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmar senha"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
            <Text style={styles.primaryButtonText}>Criar Conta</Text>
          </TouchableOpacity>

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              Ao criar uma conta, você concorda com nossos{' '}
              <Text style={styles.termsLink}>Termos de Serviço</Text> e{' '}
              <Text style={styles.termsLink}>Política de Privacidade</Text>
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Já tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.replace("/LoginScreen")}>
            <Text style={styles.footerLink}>Faça login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 25 },
  header: { alignItems: 'center', marginBottom: 30 },
  backButton: {
    alignSelf: 'flex-start', marginBottom: 15, padding: 8,
    backgroundColor: '#ffebee', borderRadius: 20, width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center'
  },
  logo: { width: 80, height: 80, marginBottom: 15, tintColor: '#d32f2f' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: '#d32f2f', textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 10, color: '#666', textAlign: 'center' },
  formContainer: { width: '100%', marginBottom: 20 },
  input: {
    width: '100%', height: 50, backgroundColor: '#fff', borderColor: '#ddd',
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, fontSize: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1,
    shadowRadius: 1.5, elevation: 2
  },
  primaryButton: {
    width: '100%', backgroundColor: '#d32f2f', padding: 15, borderRadius: 10,
    alignItems: 'center', marginTop: 10, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 3.5, elevation: 5
  },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  termsContainer: { marginBottom: 15 },
  termsText: { color: '#666', textAlign: 'center', fontSize: 12, lineHeight: 18 },
  termsLink: { color: '#d32f2f', fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  footerText: { color: '#666', fontSize: 14 },
  footerLink: { color: '#d32f2f', fontWeight: '600', fontSize: 14 },
});

export default NewUserScreen;
