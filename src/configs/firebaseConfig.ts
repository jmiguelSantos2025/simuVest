// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAu0grZaQVnIvjljdBs6P8YdLCKDygFJTA",
  authDomain: "vestibularapp-8f9be.firebaseapp.com",
  projectId: "vestibularapp-8f9be",
  storageBucket: "vestibularapp-8f9be.firebasestorage.app",
  messagingSenderId: "183637916994",
  appId: "1:183637916994:web:dc13f41188e71103fbdcdb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getFirestore(app);