import { useEffect } from "react";
import { Slot, useRouter } from "expo-router";
import { auth } from "../../src/configs/firebaseConfig"; // ajuste o caminho
import { onAuthStateChanged } from "firebase/auth";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Usuário logado → MainScreen
        router.replace("/MainScreen");
      } else {
        // Não logado → LoginScreen
        router.replace("/LoginScreen");
      }
    });

    return () => unsubscribe();
  }, []);

  // Sempre renderiza o Slot; o router.replace fará a navegação automaticamente
  return <Slot />;
}
