import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de Voxelhub extraída de la consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyG9vQPy0FoYuJ9mRWb2iLA7C7J4MxaAg", //
  authDomain: "voxelhub-53b65.firebaseapp.com", //
  projectId: "voxelhub-53b65", //
  storageBucket: "voxelhub-53b65.appspot.com", //
  messagingSenderId: "375252224948", //
  appId: "1:375252224948:web:b37be6c279b14c32b47b11" //
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios de Autenticación y Base de Datos (Firestore)
export const auth = getAuth(app);
export const db = getFirestore(app);

// Este archivo ya está listo.
