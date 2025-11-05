// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFFT1nYeW29wbu15P0QanBP-SKJAT3FgE",
  authDomain: "sistema-de-planillas.firebaseapp.com",
  projectId: "sistema-de-planillas",
  storageBucket: "sistema-de-planillas.appspot.com",
  messagingSenderId: "297079668413",
  appId: "1:297079668413:web:35f7906c6f7af6b29881d4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
