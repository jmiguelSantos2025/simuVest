import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import LoginScreen from './src/App/LoginScreen';
import NewUserScreen from './src/App/NewUser';
import MainScreen from './src/App/MainScreen';
import SimuladoScreen from './src/App/Screens/SimuladoScreen';
import RankSimuladoScreen from './src/App/Screens/RankSimuladoScreen';

export default function App() {
  return (
    <View style={styles.container}>
      <LoginScreen/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
