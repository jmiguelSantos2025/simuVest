import React, { useEffect, useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Image, KeyboardAvoidingView, 
  Platform, ScrollView, Alert 
} from 'react-native';
import { auth } from "../../../src/configs/firebaseConfig"; 
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { router } from "expo-router"; // ✅ import correto

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 🔹 Verifica se o usuário já está logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Usuário já logado:", user.email);
        router.replace("/MainScreen"); // ✅ vai direto para a tela principal
      }
    });
    return unsubscribe;
  }, []);

  // 🔹 Faz o login
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login realizado com:", userCredential.user.email);
      router.replace("/MainScreen"); // ✅ redireciona após login
    } catch (error: any) {
      console.log(error);
      Alert.alert("Erro", "Email ou senha inválidos");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1001/1001371.png' }} 
            style={styles.logo}
          />
          <Text style={styles.title}>Bem-vindo ao VestSimu</Text>
          <Text style={styles.subtitle}>App de Rankings de Simulados e Questões</Text>
        </View>

        <View style={styles.formContainer}>
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
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => alert("Então lembre, acha que a vida é um morango?kkkkkk")}>
            <Text style={styles.forgotPassword}>Esqueceu sua senha?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Não tem uma conta?{" "}
            <Text style={styles.footerLink} onPress={() => router.push("/NewUser")}>
              Cadastre-se
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 25 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 100, height: 100, marginBottom: 20, tintColor: '#d32f2f' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: '#d32f2f', textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 10, color: '#666', textAlign: 'center' },
  formContainer: { width: '100%', marginBottom: 20 },
  input: {
    width: '100%', height: 50, backgroundColor: '#fff', borderColor: '#ddd',
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, fontSize: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 1.5, elevation: 2,
  },
  primaryButton: {
    width: '100%', backgroundColor: '#d32f2f', padding: 15, borderRadius: 10,
    alignItems: 'center', marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 3.5, elevation: 5,
  },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  forgotPassword: { color: '#d32f2f', textAlign: 'center', fontSize: 14 },
  footer: { marginTop: 30 },
  footerText: { color: '#666', textAlign: 'center', fontSize: 14 },
  footerLink: { color: '#d32f2f', fontWeight: '600' },
});

export default LoginScreen;
