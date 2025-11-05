// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration.
// The API key is loaded from a secure environment variable, while other values are public.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, // Uses the environment secret 'VITE_FIREBASE_API_KEY'
  authDomain: "sistema-de-planillas.firebaseapp.com",
  projectId: "sistema-de-planillas",
  storageBucket: "sistema-de-planillas.appspot.com",
  messagingSenderId: "297079668413",
  appId: "1:297079668413:web:35f7906c6f7af6b29881d4"
};

// A check to ensure the API key is present
if (!firebaseConfig.apiKey) {
  const errorMessage = "Falta la clave de API de Firebase. Asegúrate de que el secreto llamado 'API_KEY' esté configurado correctamente en el entorno del proyecto.";
  // Display a user-friendly error on the page
  document.body.innerHTML = `<div style="padding: 2rem; text-align: center; font-family: sans-serif; background-color: #FFFBEB; color: #B45309;">
    <h1 style="font-size: 1.5rem;">Error de Configuración</h1>
    <p>${errorMessage}</p>
    </div>`;
  throw new Error(errorMessage);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
